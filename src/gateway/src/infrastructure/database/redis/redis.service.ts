import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PinoLogger } from 'nestjs-pino';
import { RedisClientType, createClient } from 'redis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {

    private client!: RedisClientType<Record<string, never>, Record<string, never>>;

    constructor(private readonly configService: ConfigService,
        private readonly logger: PinoLogger) { }

    async onModuleInit() {

        this.client = createClient({ url: this.configService.getOrThrow<string>('REDIS_URL') });

        this.client.on('connect', () => {
            this.logger.info({ url: this.configService.getOrThrow<string>('REDIS_URL') }, '[Redis] Connected');
        });

        this.client.on('error', (error: Error) => {
            this.logger.error(error, '[Redis] Error.');
        });

        await this.connect();
    }

    async onModuleDestroy() {
        await this.disconnect();
    }

    async connect(): Promise<void> {

        if (this.client.isOpen) return;

        try {
            await this.client.connect();
        }
        catch (error) {
            this.logger.error(error instanceof Error ? error.message ?? error : undefined, '[Redis] Failed to connect');
            throw error instanceof Error ? error.message ?? error : undefined;
        }
    }

    isConnected(): boolean {
        return !!this.client?.isReady;
    }

    async disconnect(): Promise<void> {
        if (!this.client.isOpen) return;

        try {
            await this.client.quit();
            this.logger.info('[Redis] Connection closed');
        }
        catch (error) {
            this.logger.error(error instanceof Error ? error.message ?? error : undefined, '[Redis] Failed to close connection');
        }
    }

    getClient(): RedisClientType<Record<string, never>, Record<string, never>> {

        if (!this.client) {
            throw new Error('Redis client has not been initialized.');
        }

        return this.client;
    }

    async get(key: string): Promise<string | null> {
        return await this.client.get(key) as string | null;
    }

    async keys(pattern: string): Promise<string[]> {
        return this.client.keys(pattern);
    }

    async exists(key: string): Promise<boolean> {
        return (await this.client.exists(key)) === 1;
    }

    async mGet(keys: string[]): Promise<(string | null)[]> {

        if (keys.length === 0) return [];

        const values = await this.client.mGet(keys);

        return values.map(value => typeof value === 'string' ? value : null);
    }

    async set(key: string, value: string, ttlSeconds?: number): Promise<void> {

        if (ttlSeconds) {
            await this.client.set(key, value, { EX: ttlSeconds });
            return;
        }

        await this.client.set(key, value);
    }

    async delete(key: string): Promise<void> {
        await this.client.del(key);
    }
}