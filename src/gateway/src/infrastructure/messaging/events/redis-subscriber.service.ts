import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { RedisService } from '../../cache/redis/redis.service';
import { REDIS_CHANNELS } from '../../../common/constants/redis.constants';
import { SseGatewayService } from '../../../interfaces/sse/sse-gateway.service';
import { GatewayEvents } from 'gateway-contracts';
import { EnrichLaunchEventSchema, GatewayEventMapper } from '../../../schemas';
import { LaunchIdentityService } from './launch-identity.service';

@Injectable()
export class RedisSubscriberService {

    constructor(private readonly redisSvc: RedisService,
        private readonly identitySvc: LaunchIdentityService,
        private readonly sseGwSvc: SseGatewayService,
        private readonly logger: PinoLogger) {

        this.logger.setContext(RedisSubscriberService.name);
    }

    async start(): Promise<void> {

        const client = this.redisSvc.getClient();

        this.logger.info(`[Redis Subscriber] Listening on ${REDIS_CHANNELS.EVENTS} channel`);

        await client.subscribe(REDIS_CHANNELS.EVENTS, async (message: string) => await this.handleMessage(message));
    }

    private async handleMessage(message: string): Promise<void> {

        try {

            let raw: unknown;

            try {

                raw = JSON.parse(message);
            }
            catch {

                this.logger.warn('[Redis] Invalid JSON message');

                return;
            }

            const result = EnrichLaunchEventSchema.safeParse(raw);

            if (!result.success) {

                this.logger.warn({ issues: result.error.issues }, '[Redis] Invalid event schema');

                return;
            }

            const event = GatewayEventMapper.toDomain(result.data);

            // Ignore events published by this Gateway instance.
            if (event.source === 'gateway' && event.event !== GatewayEvents.ENRICH_LAUNCHED) return;

            const { launchId, dedupKey } = this.identitySvc.getIdentity(event.payload);

            if (!launchId) {

                this.logger.warn('[Redis Subscriber] ENRICH_LAUNCHED missing launch id');

                return;
            }

            const acquired = await this.redisSvc.setIfNotExists(dedupKey, '1', 3600);

            if (!acquired) {

                this.logger.debug({ launchId }, '[Redis] Duplicate event ignored');

                return;
            }

            this.sseGwSvc.broadcast(event);

            this.logger.info({ launchId }, '[Redis] Event broadcast to SSE clients');

        }
        catch (error) {

            this.logger.error({ error }, '[Redis Subscriber] Failed to process message');
        }
    }
}
