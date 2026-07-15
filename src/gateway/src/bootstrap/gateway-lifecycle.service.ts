import { Injectable, OnApplicationBootstrap } from "@nestjs/common";
import { PinoLogger } from "nestjs-pino";
import { RabbitMQConsumer } from "../infrastructure/messaging/events/rabbitmq.consumer";
import { RedisSubscriberService } from "../infrastructure/messaging/events/redis-subscriber.service";
import { RabbitMQService } from "../infrastructure/messaging/rabbitmq/rabbitmq.service";

@Injectable()
export class GatewayLifecycleService implements OnApplicationBootstrap {

    constructor(private readonly rabbit: RabbitMQService,
        private readonly consumer: RabbitMQConsumer,
        private readonly subscriber: RedisSubscriberService,
        private readonly logger: PinoLogger,
    ) {
        this.logger.setContext(GatewayLifecycleService.name);
    }

    async onApplicationBootstrap(): Promise<void> {

        this.logger.info("Starting Gateway workflow...");

        const channel = await this.rabbit.connect();

        this.logger.info("Starting RabbitMQ consumer...");
        await this.consumer.start(channel);

        this.logger.info("Starting Redis subscriber...");
        await this.subscriber.start();

        this.logger.info("Gateway workflow started.");
    }
}

/*
it's already responsible for the application's operational lifecycle 
(startup today, and potentially coordinated shutdown, health orchestration, or warm-up tasks later), 
not just "starting" the app.
*/