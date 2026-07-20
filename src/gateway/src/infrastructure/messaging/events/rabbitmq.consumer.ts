import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PinoLogger } from "nestjs-pino";
import { Channel } from "amqplib";
import { EventHandlerService } from "./event-handler.service";
import { GatewayEvent } from "gateway-contracts";

@Injectable()
export class RabbitMQConsumer  {

    constructor(private readonly configService: ConfigService,
        private readonly logger: PinoLogger,
        private readonly handler: EventHandlerService) {
        this.logger.setContext(RabbitMQConsumer.name);
    }   

    async start(channel: Channel) {

        const queue = this.configService.get<string>('RABBITMQ_QUEUE') ?? 'spacex-events';

        await channel.assertQueue(queue, { durable: true });

        this.logger.info(`[RabbitMQ] Consuming messages from queue: ${queue}`);

        await channel.consume(queue, async (msg) => {

            this.logger.info(`[RabbitMQ] Received message: ${msg?.content.toString()}`);

            if (!msg) return;

            try {

                const event = JSON.parse(msg.content.toString()) as GatewayEvent;

                this.logger.info(`[RabbitMQ] Received message: ${event.event} with ID: ${event.eventId}`);

                await this.handler.handleEvent(event);

                channel.ack(msg);
            }
            catch (err) {

                this.logger.error("[RabbitMQ] Failed to process message:", err);

                channel.nack(msg, false, false);
            }

        }, { noAck: false });
    }
}