import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PinoLogger } from 'nestjs-pino';
import { GenericContainer, StartedTestContainer } from 'testcontainers';
import { MongoService } from '../../datastore/mongo/mongo.service';
import { EventPersistenceService } from './event-persistence.service';
import { GatewayEvents } from 'gateway-contracts';
import { EnrichedLaunchBuilder } from '../../../test-utils/enriched-launch.builder';


describe('EventPersistenceService (integration)', () => {

    let mongoContainer: StartedTestContainer;

    let mongoSvc: MongoService;

    let persistenceSvc: EventPersistenceService;

    let logger: PinoLogger;

    beforeAll(async () => {

        mongoContainer = await new GenericContainer('mongo:7').withExposedPorts(27017).start();

    }, 120000);

    beforeEach(async () => {

        const mongoUrl = `mongodb://${mongoContainer.getHost()}:${mongoContainer.getMappedPort(27017)}`;

        const module = await Test.createTestingModule({

            providers: [

                MongoService,

                EventPersistenceService,

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

                    useValue: {

                        setContext: jest.fn(),

                        debug: jest.fn(),

                        warn: jest.fn(),

                        error: jest.fn(),

                        info: jest.fn(),

                    }

                }

            ]

        }).compile();

        mongoSvc = module.get(MongoService);

        persistenceSvc = module.get(EventPersistenceService);

        logger = module.get(PinoLogger);

        await mongoSvc.onModuleInit();

    }, 120000);

    afterEach(async () => {

        jest.clearAllMocks();

        if (!mongoSvc.isConnected()) {

            await mongoSvc.connect();

        }

        await mongoSvc.getDatabase().collection('events').deleteMany({});

        await mongoSvc.onModuleDestroy();

    });

    afterAll(async () => {

        await mongoContainer.stop();

    });

    describe('persist()', () => {

        it('should persist an event', async () => {

            const event = new EnrichedLaunchBuilder().buildEvent();

            const result = await persistenceSvc.persist(event, event.payload);

            expect(result.acknowledged).toBe(true);

            const document = await mongoSvc.getCollection('events').findOne({ _id: result.insertedId });

            expect(document).not.toBeNull();

            expect(document?.event).toBe(GatewayEvents.ENRICH_LAUNCHED);

            expect(document?.launch.id).toBe(event.payload.launch.id);

        });

        it('should persist receivedAt timestamp', async () => {

            const event = new EnrichedLaunchBuilder().buildEvent();

            const result = await persistenceSvc.persist(event, event.payload);

            const document = await mongoSvc.getCollection('events').findOne({ _id: result.insertedId });

            expect(document?.receivedAt).toBeInstanceOf(Date);

        });

        it('should persist complete payload', async () => {

            const event = new EnrichedLaunchBuilder().buildEvent();

            const result = await persistenceSvc.persist(event, event.payload);

            const document = await mongoSvc.getCollection('events').findOne({ _id: result.insertedId });

            expect(document?.rocket).toEqual(event.payload.rocket);

            expect(document?.payloads).toEqual(event.payload.payloads);

            expect(document?.ships).toEqual(event.payload.ships);

        });

        it('should log successful persistence', async () => {

            const event = new EnrichedLaunchBuilder().buildEvent();

            const result = await persistenceSvc.persist(event, event.payload);

            expect(logger.info).toHaveBeenCalledWith(

                {

                    insertedId: result.insertedId,

                },

                '[MongoDB] Persisted event: ENRICH_LAUNCHED',

            );

        });

        it('should propagate insert errors', async () => {

            const insertOne = jest.fn().mockRejectedValue(new Error('Insert failed'));

            jest.spyOn(mongoSvc, 'getCollection').mockReturnValue({ insertOne, } as any);

            const event = new EnrichedLaunchBuilder().buildEvent();

            await expect(persistenceSvc.persist(event, event.payload)).rejects.toThrow('Insert failed');

            expect(insertOne).toHaveBeenCalledTimes(1);

        });

    });

});