import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PinoLogger } from "nestjs-pino";
import { Channel } from "amqplib";
import { EventHandlerService } from "./event-handler.service";
import { LaunchEventSchema  } from '../../../schemas';

@Injectable()
export class RabbitMQConsumer {

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

                const raw = JSON.parse(msg.content.toString());

                const result = LaunchEventSchema.safeParse(raw);

                if (!result.success) {

                    this.logger.error({ error: result.error.format() }, 'Invalid GatewayEvent received');

                    channel.nack(msg, false, false);

                    return;
                }

                const evt = result.data;

                this.logger.info(`[RabbitMQ] Received message: ${evt.event} with ID: ${evt.eventId}`);

                await this.handler.handleEvent(evt);

                channel.ack(msg);
            }
            catch (err) {

                this.logger.error("[RabbitMQ] Failed to process message:", err);

                channel.nack(msg, false, false);
            }

        }, { noAck: false });
    }
}