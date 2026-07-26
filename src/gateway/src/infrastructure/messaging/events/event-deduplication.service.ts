import { Injectable } from "@nestjs/common";
import { PinoLogger } from "nestjs-pino/PinoLogger";
import { MongoService } from "../../database/mongo/mongo.service";
import { RedisService } from "../../cache/redis/redis.service";
import { LaunchIdentityService } from "./launch-identity.service";
import { IncomingGatewayEvent } from "gateway-contracts";
import { GatewayEvents } from 'gateway-contracts';

@Injectable()
export class EventDeduplicationService {

    constructor(private readonly logger: PinoLogger,
        private readonly redisSvc: RedisService,
        private readonly mongoSvc: MongoService,
        private readonly identitySvc: LaunchIdentityService) {
            
        this.logger.setContext(EventDeduplicationService.name);
    }

    async shouldProcess(event: IncomingGatewayEvent): Promise<boolean> {

        if (event.event !== GatewayEvents.ENRICH_LAUNCHED) {
            return false;
        }

        // Extract launch id + dedupKey for deduplication
        const { launchId, dedupKey } = this.identitySvc.getIdentity(event.payload);

        if (!launchId) {

            this.logger.warn(`Event ${event.event} missing launch id`);

            return false;
        }

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

            // Ensure Redis cache is set to prevent subscriber loop
            await this.redisSvc.set(dedupKey, '1', 3600);

            this.logger.info(`Launch already persisted ${launchId}`);

            return false;
        }

        // Mark as processed in Redis
        await this.redisSvc.set(dedupKey, '1', 3600);

        return true;
    }
}