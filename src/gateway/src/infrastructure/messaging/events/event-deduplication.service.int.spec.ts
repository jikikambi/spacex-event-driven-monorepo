import { GenericContainer, StartedTestContainer } from "testcontainers";
import { RedisService } from "../../datastore/redis/redis.service";
import { MongoService } from "../../datastore/mongo/mongo.service";
import { EventDeduplicationService } from "./event-deduplication.service";
import { PinoLogger } from "nestjs-pino";
import { getLaunchFixture } from "../../../test-utils/spacex.fixtures";
import { EnrichedLaunchBuilder } from "../../../test-utils/enriched-launch.builder";
import { Test } from "@nestjs/testing";
import { LaunchIdentityService } from "./launch-identity.service";
import { ConfigService } from "@nestjs/config";
import { GatewayEvents } from "gateway-contracts";
import { RedisKeyFactory } from "../../datastore/redis/redis-Key.factory";
import { REDIS_CHANNELS } from "../../../common/constants/redis.constants";

describe('EventDeduplicationService (integration)', () => {

    let redisContainer: StartedTestContainer;

    let mongoContainer: StartedTestContainer;

    let redis: RedisService;

    let mongo: MongoService;

    let service: EventDeduplicationService;

    let keyFactory: RedisKeyFactory;

    let logger: PinoLogger;

    const fixture = getLaunchFixture();

    beforeAll(async () => {

        redisContainer = await new GenericContainer('redis:7-alpine').withExposedPorts(6379).start();

        mongoContainer = await new GenericContainer('mongo:7').withExposedPorts(27017).start();

    }, 120000);

    beforeEach(async () => {

        const redisUrl = `redis://${redisContainer.getHost()}:${redisContainer.getMappedPort(6379)}`;

        const mongoUrl = `mongodb://${mongoContainer.getHost()}:${mongoContainer.getMappedPort(27017)}`;

        const module = await Test.createTestingModule({

            providers: [

                EventDeduplicationService,

                LaunchIdentityService,

                RedisService,

                MongoService,

                {
                    provide: RedisKeyFactory,

                    useValue: {

                        dedupKey: jest.fn((launchId: string) => `dedup:${launchId}`),

                        fanoutKey: jest.fn((eventId: string) => `fanout:${eventId}`),

                        channelEvents: jest.fn(() => REDIS_CHANNELS.EVENTS)

                    }

                },

                {
                    provide: ConfigService,

                    useValue: {

                        getOrThrow: jest.fn((key: string) => {

                            switch (key) {

                                case 'REDIS_URL': return redisUrl;

                                case 'MONGO_URL': return mongoUrl;

                                case 'MONGO_DB_NAME': return 'gateway-test';

                                default: throw new Error(key);

                            }

                        })

                    }

                },

                {

                    provide: PinoLogger,

                    useValue: {

                        setContext: jest.fn(),

                        info: jest.fn(),

                        warn: jest.fn(),

                        error: jest.fn(),

                        debug: jest.fn()

                    }

                }

            ]

        }).compile();

        redis = module.get(RedisService);

        mongo = module.get(MongoService);

        logger = module.get(PinoLogger);

        service = module.get(EventDeduplicationService);

        keyFactory = module.get(RedisKeyFactory);

        await redis.onModuleInit();

        await mongo.onModuleInit();

    });

    afterEach(async () => {

        await redis.getClient().flushAll();

        await mongo.getCollection('events').deleteMany({});

        await redis.onModuleDestroy();

        await mongo.onModuleDestroy();

    });

    afterAll(async () => {

        await redisContainer.stop();

        await mongoContainer.stop();

    }, 120000);

    it('returns false for unsupported gateway events', async () => {

        const event = new EnrichedLaunchBuilder().buildEvent(); 

        event.event = GatewayEvents.ROCKETS_LOADED as any;

        await expect(service.shouldProcess(event)).resolves.toBe(false);

    });

    it('returns false when launch id is missing', async () => {

        const event = new EnrichedLaunchBuilder().buildEvent();

        event.payload.launch.id = '';

        await expect(service.shouldProcess(event)).resolves.toBe(false);

        expect(logger.warn).toHaveBeenCalled();

    });

    it('returns false when Redis already contains dedup key', async () => {

        const dedupKey = keyFactory.dedupKey(fixture.launch.id);

        await redis.set(dedupKey, '1', 3600);

        await expect(service.shouldProcess(new EnrichedLaunchBuilder().buildEvent())).resolves.toBe(false);

    });

    it('returns false when launch already exists in Mongo', async () => {

        await mongo.getCollection('events').insertOne({ id: fixture.launch.id });

        await expect(service.shouldProcess(new EnrichedLaunchBuilder().buildEvent())).resolves.toBe(false);

        expect(await redis.exists(keyFactory.dedupKey(fixture.launch.id))).toBe(true);

    });

    it('returns true for a brand new launch', async () => {

        await expect(service.shouldProcess(new EnrichedLaunchBuilder().buildEvent())).resolves.toBe(true);

        expect(await redis.exists(keyFactory.dedupKey(fixture.launch.id))).toBe(true);

    });

    it('stores Redis marker after accepting launch', async () => {

        await service.shouldProcess(new EnrichedLaunchBuilder().buildEvent());

        expect(await redis.get(keyFactory.dedupKey(fixture.launch.id))).toBe('1');

    });

    it('writes Redis marker when duplicate exists only in Mongo', async () => {

        await mongo.getCollection('events').insertOne({ id: fixture.launch.id });

        await service.shouldProcess(new EnrichedLaunchBuilder().buildEvent());

        expect(await redis.get(keyFactory.dedupKey(fixture.launch.id))).toBe('1');

    });

    it('stores Redis marker with one hour TTL', async () => {

        const event = new EnrichedLaunchBuilder().buildEvent();

        await service.shouldProcess(event);

        const dedupKey = keyFactory.dedupKey(fixture.launch.id);

        const ttl = await redis.getClient().ttl(dedupKey);

        expect(ttl).toBeGreaterThan(3500);
        expect(ttl).toBeLessThanOrEqual(3600);

    });

    it('accepts the first event and rejects subsequent duplicates', async () => {

         const event = new EnrichedLaunchBuilder().buildEvent();

        expect(await service.shouldProcess(event)).toBe(true);

        expect(await service.shouldProcess(event)).toBe(false);

    });

});