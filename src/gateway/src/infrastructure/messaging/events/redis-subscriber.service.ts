import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { RedisService } from '../../database/redis/redis.service';
import { SseGatewayService } from '../../sse/sse-gateway.service';
import { GatewayRocket, GatewayShip, GatewayPayload, EnrichedGatewayLaunch, GatewayEvent } from 'gateway-contracts';
import { REDIS_CHANNELS } from '../../../common/constants/redis.constants';

@Injectable()
export class RedisSubscriberService {

    constructor(private readonly redisSvc: RedisService,
        private readonly sseGwSvc: SseGatewayService,
        private readonly logger: PinoLogger) {

        this.logger.setContext(RedisSubscriberService.name);
    }

    async start(): Promise<void> {

        const client = this.redisSvc.getClient();

        this.logger.info(`[Redis Subscriber] Listening on ${REDIS_CHANNELS.EVENTS} channel`);

        await client.subscribe(REDIS_CHANNELS.EVENTS, async (message: string) => {

            await this.handleMessage(message);
        });
    }

    private async handleMessage(message: string): Promise<void> {

        try {

            const parsed = JSON.parse(message) as GatewayEvent & { source?: string; };

            // Skip self-published events
            if (parsed.source === 'gateway') return;

            const launchId = this.extractLaunchId(parsed);

            if (!launchId) {
                this.logger.warn({ event: parsed.event }, '[Redis Subscriber] Event missing launch id');
                return;
            }

            const dedupKey = `event:${launchId}`;

            const exists = await this.redisSvc.get(dedupKey);

            if (exists) return;

            await this.redisSvc.set(dedupKey, '1', 3600);

            const event = this.normalizeEvent(parsed);

            this.sseGwSvc.broadcast(event);

            this.logger.info({ event: event.event, launchId }, '[Redis Subscriber] Processed event');
        }
        catch (error) {

            this.logger.error({ error }, '[Redis Subscriber] Failed to process message');
        }
    }

    // 
    private extractLaunchId(parsed: GatewayEvent & { source?: string }): string | null {

        return (parsed.payload as any)?.id || (parsed.payload as any)?.launch?.id || null;
    }

    private normalizeEvent(parsed: GatewayEvent): GatewayEvent {

        switch (parsed.event) {

            case 'LOAD_ROCKETS':

                return { event: 'LOAD_ROCKETS', payload: parsed.payload as GatewayRocket[], timestamp: parsed.timestamp, source: parsed.source };

            case 'LOAD_SHIPS':

                return { event: 'LOAD_SHIPS', payload: parsed.payload as GatewayShip[], timestamp: parsed.timestamp, source: parsed.source };

            case 'LOAD_PAYLOADS':

                return { event: 'LOAD_PAYLOADS', payload: parsed.payload as GatewayPayload[], timestamp: parsed.timestamp, source: parsed.source };

            case 'ENRICH_LAUNCH':

                return { event: 'ENRICH_LAUNCH', payload: parsed.payload as EnrichedGatewayLaunch, timestamp: parsed.timestamp, source: parsed.source };

            default:

                return { event: 'OTHER_EVENT', payload: parsed.payload, timestamp: parsed.timestamp, source: parsed.source };
        }
    }
}