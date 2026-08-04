import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { RedisService } from '../../datastore/redis/redis.service';
import { IncomingGatewayEvent } from 'gateway-contracts';

@Injectable()
export class EventPublisherService {

    constructor(private readonly redisSvc: RedisService,
        private readonly logger: PinoLogger) {
            
        this.logger.setContext(EventPublisherService.name);
    }
       
    async publish(event: IncomingGatewayEvent): Promise<void> {

        try {

            await this.redisSvc.getClient().publish('events', JSON.stringify(event));

            this.logger.info({ event: event.event }, '[EventPublisher] Published event');

        }
        catch (error) {

            this.logger.error({ error }, '[EventPublisher] Failed to publish event');

            throw error;

        }
    }

}