import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PinoLogger } from 'nestjs-pino';
import { Collection, Db, Document, MongoClient } from 'mongodb';

@Injectable()
export class MongoService implements OnModuleInit, OnModuleDestroy {

    private client: MongoClient | null = null;
    private db: Db | null = null;

    constructor(private readonly configService: ConfigService,
        private readonly logger: PinoLogger) { }

    async onModuleInit(): Promise<void> {
        await this.connect();
    }

    async onModuleDestroy(): Promise<void> {
        await this.disconnect();
    }

    async connect(): Promise<void> {

        if (this.client) return;

        const mongoUrl = this.configService.getOrThrow<string>('MONGO_URL');
        const database = this.configService.getOrThrow<string>('MONGO_DB_NAME');

        try {

            this.client = new MongoClient(mongoUrl);

            await this.client.connect();

            this.db = this.client.db(database);

            this.logger.info({ database, url: mongoUrl }, '[MongoDB] Connected.');
        }
        catch (error) {
            this.logger.error(error instanceof Error ? error.message ?? error : undefined, '[MongoDB] Connection failed.');

            throw error;
        }
    }

    isConnected(): boolean {
        return this.client !== null && this.db !== null;
    }

    async disconnect(): Promise<void> {

        if (!this.client) return;

        try {

            await this.client.close();

            this.logger.info('[MongoDB] Connection closed.');
        }
        finally {
            this.client = null;
            this.db = null;
        }
    }

    getCollection<T extends Document>(name: string): Collection<T> {

        if (!this.db) throw new Error('MongoDB has not been initialized.');

        return this.db.collection<T>(name);
    }

    getDatabase(): Db {
        return this.db!;
    }
}