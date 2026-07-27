import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PinoLogger } from "nestjs-pino";
import { Channel, Message } from "amqplib";
import { EventHandlerService } from "./event-handler.service";
import { LaunchEventSchema } from '../../../schemas';
import { QUEUE_NAMES } from "../../../common/constants/queue.constants";

@Injectable()
export class RabbitMQConsumer {

    constructor(private readonly cfgSvc: ConfigService,
        private readonly logger: PinoLogger,
        private readonly handler: EventHandlerService) {
        this.logger.setContext(RabbitMQConsumer.name);
    }

    async start(channel: Channel) {

        const queue = this.cfgSvc.get<string>('RABBITMQ_QUEUE') ?? QUEUE_NAMES.SPACEX_EVENTS;

        //await channel.assertQueue(queue, { durable: true });

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

                await this.sendToRetry(channel, queue, msg);

                channel.nack(msg, false, false);
            }

        }, { noAck: false });
    }

    private async sendToRetry(channel: Channel, queueName: string, msg: Message): Promise<void> {

        const retryQueue = `${queueName}.retry`;

        const headers = msg.properties.headers ?? {};

        const retryCount = Number(headers['x-retry-count'] ?? 0);

        if (retryCount >= 3) {

            this.logger.error(
                {
                    retryCount
                },
                '[RabbitMQ] Retry exhausted, sending to DLQ'
            );

            channel.nack(msg, false, false);

            return;
        }

        channel.sendToQueue(retryQueue, msg.content,
            {
                persistent: true,

                headers: {
                    ...headers,
                    'x-retry-count': retryCount + 1
                }
            }
        );
    }
}