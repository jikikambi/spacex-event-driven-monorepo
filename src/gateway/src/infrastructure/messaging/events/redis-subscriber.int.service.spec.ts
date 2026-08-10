import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PinoLogger } from 'nestjs-pino';
import { GenericContainer, StartedTestContainer } from 'testcontainers';
import { GatewayEvents, LaunchEvent } from 'gateway-contracts';
import { REDIS_CHANNELS } from '../../../common/constants/redis.constants';
import { RedisService } from '../../datastore/redis/redis.service';
import { LaunchIdentityService } from './launch-identity.service';
import { RedisSubscriberService } from './redis-subscriber.service';
import { EventFanoutService } from './event-fanout.service';
import { EnrichedLaunchBuilder } from '../../../test-utils/enriched-launch.builder';
import { randomUUID } from 'crypto';
import { RedisKeyFactory } from '../../datastore/redis/redis-Key.factory';

describe('RedisSubscriberService (integration)', () => {

    let module: TestingModule;

    let redisContainer: StartedTestContainer;

    let redis: RedisService;

    let subscriber: RedisSubscriberService;

    let fanoutSvc: EventFanoutService;

    let keyFactory: RedisKeyFactory;

    let logger = {

        setContext: jest.fn(),

        debug: jest.fn(),

        warn: jest.fn(),

        error: jest.fn(),

        info: jest.fn(),

    };

    beforeAll(async () => {

        redisContainer = await new GenericContainer('redis:7-alpine').withExposedPorts(6379).start();

    }, 120000);

    beforeEach(async () => {

        const redisUrl = `redis://${redisContainer.getHost()}:${redisContainer.getMappedPort(6379)}`;

        module = await Test.createTestingModule({

            providers: [

                RedisService,

                RedisSubscriberService,

                LaunchIdentityService,

                {
                    provide: RedisKeyFactory,

                    useValue: {

                        dedupKey: jest.fn((launchId: string) => `dedup:${launchId}`),

                        fanoutKey: jest.fn((eventId: string) => `fanout:${eventId}`),

                        channelEvents: jest.fn(() => REDIS_CHANNELS.EVENTS)

                    }

                },

                {
                    provide: EventFanoutService,

                    useValue: {

                        fanout: jest.fn()

                    }

                },

                {
                    provide: ConfigService,

                    useValue: {

                        getOrThrow: jest.fn((key: string) => {

                            if (key === 'REDIS_URL') return redisUrl;

                            throw new Error(key);

                        })
                    }
                },

                {
                    provide: PinoLogger,

                    useValue: logger
                }

            ]

        }).compile();

        logger = module.get(PinoLogger);

        redis = module.get(RedisService);

        fanoutSvc = module.get(EventFanoutService);

        subscriber = module.get(RedisSubscriberService);

        keyFactory = module.get(RedisKeyFactory);

        await redis.onModuleInit();

        await subscriber.start();

    });

    afterEach(async () => {

        await redis.getClient().flushAll();

        await subscriber.stop();

        await redis.onModuleDestroy();

    });

    afterAll(async () => {

        await redisContainer.stop();

    });

    async function waitFor(assertion: () => void, timeoutMs = 3000, intervalMs = 50) {

        const start = Date.now();

        let lastError: unknown;

        while (Date.now() - start < timeoutMs) {

            try {

                assertion();

                return;

            }
            catch (err) {

                lastError = err;

                await new Promise(resolve => setTimeout(resolve, intervalMs));

            }

        }

        // Run one final time so Jest reports the real expectation failure
        if (lastError) {

            assertion();

        }

        throw lastError;

    }

    describe('event processing', () => {

        it('ignores invalid JSON', async () => {

            await redis.getClient().publish(REDIS_CHANNELS.EVENTS, '{bad json');

            expect(logger.warn).toHaveBeenCalledWith('[Redis] Invalid JSON message');

            await waitFor(() => expect(fanoutSvc.fanout).not.toHaveBeenCalled());

        });

        it('ignores invalid schema', async () => {

            await redis.getClient().publish(REDIS_CHANNELS.EVENTS, JSON.stringify({ hello: 'world' }));

            expect(logger.warn).toHaveBeenCalled();

            await waitFor(async () => expect(fanoutSvc.fanout).not.toHaveBeenCalled());

        });

        it('ignores unsupported gateway events', async () => {

            const event: LaunchEvent = {

                event: GatewayEvents.LAUNCH_RECEIVED,

                eventId: randomUUID(),

                timestamp: new Date().toISOString(),

                source: "gateway",

                payload: {

                    id: randomUUID(),

                }

            };

            await redis.getClient().publish(REDIS_CHANNELS.EVENTS, JSON.stringify(event));

            await waitFor(() => expect(fanoutSvc.fanout).not.toHaveBeenCalled());

        });

        it('ignores event without launch id', async () => {

            const event = new EnrichedLaunchBuilder().buildEvent();

            event.payload.launch.id = '';

            await redis.getClient().publish(REDIS_CHANNELS.EVENTS, JSON.stringify(event));

            expect(logger.warn).toHaveBeenCalled();

            await waitFor(() => expect(fanoutSvc.fanout).not.toHaveBeenCalled());

        });

        it('fans out every published event', async () => {

            const event = new EnrichedLaunchBuilder().buildEvent();

            expect(event.eventId).toBeDefined();

            const launchId = event.payload.launch.id;

            const fanoutKey = keyFactory.fanoutKey(event.eventId);

            await redis.getClient().publish(REDIS_CHANNELS.EVENTS, JSON.stringify(event));

            await waitFor(() => expect(fanoutSvc.fanout).toHaveBeenCalledWith(
                launchId,

                fanoutKey,

                expect.objectContaining({
                    eventId: event.eventId,
                    event: event.event,
                    source: event.source,
                })

            ));

        });

        it('logs unexpected errors', async () => {

            (fanoutSvc.fanout as jest.Mock).mockRejectedValueOnce(new Error('boom'));

            await redis.getClient().publish(REDIS_CHANNELS.EVENTS, JSON.stringify(new EnrichedLaunchBuilder().buildEvent()));

            await waitFor(() => expect(logger.error).toHaveBeenCalled());

        });

    });

});