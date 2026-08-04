import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { RedisService } from '../../datastore/redis/redis.service';
import { REDIS_CHANNELS } from '../../../common/constants/redis.constants';
import { GatewayEvents } from 'gateway-contracts';
import { EnrichLaunchEventSchema, GatewayEventMapper } from '../../../schemas';
import { LaunchIdentityService } from './launch-identity.service';
import { EventFanoutService } from './event-fanout.service';
import { RedisKeyFactory } from '../../datastore/redis/redis-Key.factory';
import { RedisClientType } from 'redis';

@Injectable()
export class RedisSubscriberService {

    private client?: RedisClientType;

    constructor(private readonly redisSvc: RedisService,
        private readonly identitySvc: LaunchIdentityService,
        private readonly keyFactory: RedisKeyFactory,
        private readonly fanoutSvc: EventFanoutService,
        private readonly logger: PinoLogger) {

        this.logger.setContext(RedisSubscriberService.name);
        
    }

    async start(): Promise<void> {

        this.client = this.redisSvc.getClient();

        this.logger.info(`[Redis Subscriber] Listening on ${REDIS_CHANNELS.EVENTS} channel`);

        await this.client.subscribe(REDIS_CHANNELS.EVENTS, async (message: string) => await this.handleMessage(message));

    }

    async stop() {

        if (!this.client) return;

        await this.client.unsubscribe(REDIS_CHANNELS.EVENTS);

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

            if (event.source === 'gateway' && event.event !== GatewayEvents.ENRICH_LAUNCHED) return;

            const launchId = this.identitySvc.getLaunchId(event.payload);

            if (!launchId) {

                this.logger.warn('[Redis Subscriber] ENRICH_LAUNCHED missing launch id');

                return;

            }

            const eventId = this.identitySvc.getEventId(event);

            const fanoutKey = this.keyFactory.fanoutKey(eventId!);

            await this.fanoutSvc.fanout(launchId, fanoutKey, event);

        }
        catch (error) {

            this.logger.error({ error }, '[Redis Subscriber] Failed to process message');

        }

    }

}