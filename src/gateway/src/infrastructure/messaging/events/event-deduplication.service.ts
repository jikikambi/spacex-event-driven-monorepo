import { Injectable } from "@nestjs/common";
import { PinoLogger } from "nestjs-pino/PinoLogger";
import { MongoService } from "../../datastore/mongo/mongo.service";
import { RedisService } from "../../datastore/redis/redis.service";
import { LaunchIdentityService } from "./launch-identity.service";
import { IncomingGatewayEvent } from "gateway-contracts";
import { GatewayEvents } from 'gateway-contracts';
import { RedisKeyFactory } from "../../datastore/redis/redis-Key.factory";

@Injectable()
export class EventDeduplicationService {

    constructor(private readonly logger: PinoLogger,
        private readonly redisSvc: RedisService,
        private readonly mongoSvc: MongoService,
        private readonly identitySvc: LaunchIdentityService,
        private readonly keyFactory: RedisKeyFactory) {

        this.logger.setContext(EventDeduplicationService.name);
        
    }

    async shouldProcess(event: IncomingGatewayEvent): Promise<boolean> {

        if (event.event !== GatewayEvents.ENRICH_LAUNCHED) {

            return false;

        }
        
        const launchId = this.identitySvc.getLaunchId(event.payload);

        if (!launchId) {

            this.logger.warn(`Event ${event.event} missing launch id`);

            return false;

        }

        const dedupKey = this.keyFactory.dedupKey(launchId);

        // Check Redis for deduplication
        const exists = await this.redisSvc.exists(dedupKey);

        if (exists) {

            this.logger.info(`Skipping duplicate launch ${launchId}`);

            return false;

        }

        const evtCollection = this.mongoSvc.getCollection('events');

        // Optional: also check MongoDB
        const existing = await evtCollection.findOne({ id: launchId });

        if (existing) {

            // Rehydrate the Redis dedup cache from the persistent store.
            await this.redisSvc.set(dedupKey, '1', 3600);

            this.logger.info(`Launch already persisted ${launchId}`);

            return false;

        }

        // Mark as processed in Redis
        await this.redisSvc.set(dedupKey, '1', 3600);

        return true;

    }

}