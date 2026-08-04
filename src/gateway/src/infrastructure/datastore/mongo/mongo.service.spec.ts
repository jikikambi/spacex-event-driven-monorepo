import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PinoLogger } from 'nestjs-pino';
import { GenericContainer, StartedTestContainer } from 'testcontainers';

import { MongoService } from './mongo.service';

describe('MongoService', () => {

    let service: MongoService;

    let mongoContainer: StartedTestContainer;

    const logger = {

        setContext: jest.fn(),

        debug: jest.fn(),

        warn: jest.fn(),

        error: jest.fn(),

        info: jest.fn()

    };

    beforeAll(async () => {

        mongoContainer = await new GenericContainer('mongo:7').withExposedPorts(27017).start();

    }, 120000);

    beforeEach(async () => {

        const mongoUrl = `mongodb://${mongoContainer.getHost()}:${mongoContainer.getMappedPort(27017)}`;

        const module = await Test.createTestingModule({

            providers: [

                MongoService,

                {
                    provide: ConfigService,

                    useValue: {

                        getOrThrow: jest.fn((key: string) => {

                            switch (key) {

                                case 'MONGO_URL': return mongoUrl;

                                case 'MONGO_DB_NAME': return 'test-db';

                                default: throw new Error(`Unexpected config key: ${key}`);

                            }

                        })

                    }

                },

                {
                    provide: PinoLogger,

                    useValue: logger
                }

            ]

        }).compile();

        service = module.get(MongoService);

        await service.onModuleInit();
    });

    afterEach(async () => {

        jest.clearAllMocks();

        if (!service.isConnected()) {

            await service.connect();

        }

        await service.getDatabase().collection('events').deleteMany({});

        await service.onModuleDestroy();

    });

    afterAll(async () => {

        await mongoContainer.stop();

    });

    describe('connect', () => {

        it('should connect during module initialization', () => {

            expect(service.isConnected()).toBe(true);

        });

        it('should be idempotent', async () => {

            await expect(service.connect()).resolves.not.toThrow();

            expect(service.isConnected()).toBe(true);

        });

        it('should log successful connection', async () => {

            await service.disconnect();

            await service.connect();

            expect(logger.info).toHaveBeenCalledWith(expect.objectContaining({ database: 'test-db', }), '[MongoDB] Connected.');

        });

    });

    describe('disconnect', () => {

        it('should disconnect successfully', async () => {

            await service.disconnect();

            expect(service.isConnected()).toBe(false);

        });

        it('should be idempotent', async () => {

            await service.disconnect();

            await expect(service.disconnect()).resolves.not.toThrow();

            expect(service.isConnected()).toBe(false);

            await service.connect();

        });

        it('should log disconnect', async () => {

            await service.disconnect();

            expect(logger.info).toHaveBeenCalledWith('[MongoDB] Connection closed.');

            await service.connect();

        });

    });

    describe('getCollection', () => {

        it('should return a collection', () => {

            const collection = service.getCollection('events');

            expect(collection.collectionName).toBe('events');

        });

        it('should perform CRUD operations', async () => {

            const collection = service.getCollection<{ name: string }>('events');

            await collection.insertOne({ name: 'Created' });

            const document = await collection.findOne({ name: 'Created' });

            expect(document).toBeTruthy();

            expect(document?.name).toBe('Created');

        });

        it('should throw when not connected', async () => {

            await service.disconnect();

            expect(() => service.getCollection('events')).toThrow('MongoDB has not been initialized.');

            await service.connect();
        });

    });

    describe('getDatabase', () => {

        it('should return the configured database', () => {

            expect(service.getDatabase().databaseName).toBe('test-db');

        });

    });

    describe('isConnected', () => {

        it('should reflect connection state', async () => {

            expect(service.isConnected()).toBe(true);

            await service.disconnect();

            expect(service.isConnected()).toBe(false);

            await service.connect();

            expect(service.isConnected()).toBe(true);

        });

    });

    describe('connection failures', () => {

        it('should propagate connection errors', async () => {

            const failingService = new MongoService(

                {

                    getOrThrow: jest.fn((key: string) => {

                        if (key === 'MONGO_URL') {

                            return 'mongodb://localhost:1/test-db?serverSelectionTimeoutMS=100';

                        }

                        return 'test-db';

                    }),

                } as unknown as ConfigService,

                logger as unknown as PinoLogger,

            );

            await expect(failingService.connect()).rejects.toThrow();

            expect(logger.error).toHaveBeenCalled();
        });

    });

});