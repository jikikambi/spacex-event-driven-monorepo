import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import * as amqp from 'amqplib';
import { Channel, ChannelModel } from 'amqplib';
import { PinoLogger } from 'nestjs-pino';
import { ConfigService } from '@nestjs/config';
import { RabbitMqHealthDto } from './dto/rabbitmq-health.dto';
import { QUEUE_NAMES } from '../../../common/constants/queue.constants';
import { DEFAULT_URL } from '../../../common/constants/rabbitmq.constants';
import { IncomingGatewayEvent } from 'gateway-contracts';

export interface BufferedEvent<T extends IncomingGatewayEvent> {
    timestamp: number;
    payload: T;
}

@Injectable()
export class RabbitMQService implements OnModuleInit, OnModuleDestroy {

    private connection: ChannelModel | null = null;
    private channel: Channel | null = null;

    private reconnecting = false;
    private flushTimer?: NodeJS.Timeout;
    private flushIntervalMs = 1000;
    private lastPublishAttempt?: Date;
    
    private readonly eventBuffer: BufferedEvent<IncomingGatewayEvent>[] = [];

    constructor(private readonly logger: PinoLogger,
        private readonly cfgSvc: ConfigService) { }

    private get queueName(): string {
        return this.cfgSvc.getOrThrow<string>('RABBITMQ_QUEUE') ?? QUEUE_NAMES.SPACEX_EVENTS;
    }

    private get rabbitUrl(): string {

        const url = this.cfgSvc.getOrThrow<string>('RABBITMQ_URL');
        this.logger.info({ url }, '[RabbitMQ] URL');
        return url ?? DEFAULT_URL.RABBITMQ_DEFAULT_URL;
    }

    async onModuleInit(): Promise<void> {
        await this.connect();
    }

    async onModuleDestroy(): Promise<void> {
        await this.close();
    }

    async connect(retries = 5, retryDelay = 3000): Promise<Channel> {

        if (this.channel) {
            return this.channel;
        }

        if (this.reconnecting) {
            await new Promise((r) => setTimeout(r, retryDelay));
            return this.channel!;
        }

        this.reconnecting = true;

        try {

            for (let attempt = 1; attempt <= retries; attempt++) {

                try {

                    this.logger.info(`[RabbitMQ] Connecting (${attempt}/${retries})`);

                    this.connection = await amqp.connect(this.rabbitUrl);

                    this.channel = await this.connection.createChannel();

                    await this.channel.assertQueue(this.queueName, { durable: true });

                    this.logger.info(`Connected to RabbitMQ. Queue: ${this.queueName} asserted`);

                    this.registerEvents();

                    this.startFlushing();

                    return this.channel;

                } catch (error) {

                    this.logger.warn(`[RabbitMQ] connection attempt ${attempt}/${retries} failed.`);

                    if (attempt === retries) {
                        throw error;
                    }

                    await this.delay(retryDelay);
                }
            }

            throw new Error('Unable to connect');
        }
        finally {
            this.reconnecting = false;
        }
    }

    isConnected(): boolean {
        return !!this.channel;
    }

    private registerEvents(): void {

        this.connection?.on('close', () => {

            this.logger.warn('[RabbitMQ] connection closed, reconnecting...');

            this.channel = null;
            this.connection = null;

            setTimeout(() => this.connect(), 5000);
        });

        this.connection?.on('error', (err) => {
            this.logger.error(`[RabbitMQ] Connection error: ${err.message || err}`, err.stack);
        });
    }

    /** Flush buffered events periodically */
    private startFlushing(): void {

        if (this.flushTimer) return;

        this.flushTimer = setInterval(async () => {

            if (!this.channel || this.eventBuffer.length === 0) return;

            this.logger.info(`[RabbitMQ] Flushing ${this.eventBuffer.length} messages`);

            const events = this.eventBuffer.splice(0, this.eventBuffer.length);

            for (const event of events) {

                try {
                    await this.publish(event.payload);
                }
                catch (error) {
                    this.logger.error("[RabbitMQ] Failed to flush buffered event, re-buffering:", error instanceof Error ? error?.message || error : undefined);
                    this.eventBuffer.push(event);
                }
            }
        }, this.flushIntervalMs);
    }

    async publish<T extends IncomingGatewayEvent>(event: T): Promise<void> {

        this.lastPublishAttempt = new Date();

        if (!this.channel) {

            this.logger.warn('RabbitMQ unavailable. Buffering event.');

            this.eventBuffer.push({ timestamp: Date.now(), payload: event });

            // trigger reconnect but don't await (avoid bubbling errors to caller)
            this.connect()
                .catch(err => this.logger.error("[RabbitMQ] Reconnect attempt failed:", { message: err?.message, stack: err?.stack }));

            return;
        }

        try {

            const payload = Buffer.from(JSON.stringify(event));
            const published = this.channel.sendToQueue(this.queueName, payload, { persistent: true });

            if (!published) {
                this.logger.warn("[RabbitMQ] Backpressure detected, waiting for drain...");
                await new Promise<void>((resolve) => this.channel!.once('drain', resolve));
            }

            this.logger.info(`[RabbitMQ] Published event: ${event.event}`);
        }
        catch (error) {

            this.logger.error(`Failed to publish ${event.event}`, error instanceof Error ? error.stack : undefined);

            this.eventBuffer.push({ timestamp: Date.now(), payload: event });
        }
    }

    async close(): Promise<void> {

        if (this.flushTimer) {
            clearInterval(this.flushTimer);
        }

        await this.channel?.close();
        await this.connection?.close();

        this.channel = null;
        this.connection = null;

        this.logger.info('[RabbitMQ] Closed gracefully');
    }

    /** Expose health info for monitoring */
    getHealth(): RabbitMqHealthDto {

        const first = this.eventBuffer[0];
        const oldestBufferedMs = first ? Date.now() - first.timestamp : 0;

        return {
            connected: !!this.channel,
            bufferedEvents: this.eventBuffer.length,
            lastPublishAttempt: this.lastPublishAttempt,
            oldestBufferedMs: oldestBufferedMs,
            message: this.eventBuffer.length > 0
                ? `${this.eventBuffer.length} events waiting to be published. Oldest is ${oldestBufferedMs} ms old.`
                : 'No buffered events.'
        };
    }

    private delay(ms: number) {
        return new Promise((res) => setTimeout(res, ms));
    }
}