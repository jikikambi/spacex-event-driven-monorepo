import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { MongoService } from '../../database/mongo/mongo.service';
import { RedisService } from '../../cache/redis/redis.service';
import { IncomingGatewayEvent } from 'gateway-contracts';

@Injectable()
export class EventPublisherService {

    constructor(private readonly mongoService: MongoService,
        private readonly redisSvc: RedisService,
        private readonly logger: PinoLogger) {
            
        this.logger.setContext(EventPublisherService.name);
    }

    /**
     * Publish an event:
     * - Persist to MongoDB (event log / audit trail)
     * - Publish to Redis (real-time fanout)
     */
    async publish(event: IncomingGatewayEvent): Promise<void> {

        try {

            await this.persist(event);

            await this.redisSvc.getClient().publish('events', JSON.stringify(event));

            this.logger.info({ event: event.event }, '[EventPublisher] Published event');

        }
        catch (error) {

            this.logger.error({ error }, '[EventPublisher] Failed to publish event');

            throw error;

        }
    }

    /**
     * Store event in MongoDB (durable log)
     */
    private async persist(event: IncomingGatewayEvent): Promise<void> {

        const collection = this.mongoService.getCollection('events');

        await collection.insertOne({ ...event, createdAt: new Date() });
        
    }
}