import { Injectable, OnApplicationBootstrap } from "@nestjs/common";
import { RabbitMQService } from "../infrastructure/messaging/rabbitmq/rabbitmq.service";
import { RabbitMQConsumer } from "../infrastructure/messaging/events/rabbitmq.consumer";
import { RedisSubscriberService } from "../infrastructure/messaging/events/redis-subscriber.service";

@Injectable()
export class TestGatewayLifecycleService implements OnApplicationBootstrap {

    constructor(private readonly rabbit: RabbitMQService,

        private readonly consumer: RabbitMQConsumer,

        private readonly subscriber: RedisSubscriberService

    ) { }

    async onApplicationBootstrap(): Promise<void> {

        const channel = await this.rabbit.connect();

        await this.consumer.start(channel);

        await this.subscriber.start();

    }

}