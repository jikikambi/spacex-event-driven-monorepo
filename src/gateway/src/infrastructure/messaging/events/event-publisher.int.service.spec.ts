import { Test, TestingModule } from '@nestjs/testing';
import { GenericContainer, StartedTestContainer } from 'testcontainers';

import { EventPublisherService } from './event-publisher.service';

import { PinoLogger } from 'nestjs-pino';
import { RedisService } from '../../datastore/redis/redis.service';
import { ConfigService } from '@nestjs/config';
import { GatewayEvents } from 'gateway-contracts';
import { EnrichedLaunchBuilder } from '../../../test-utils/enriched-launch.builder';

describe('EventPublisherService (integration)', () => {

    let redisContainer: StartedTestContainer;

    let publisher: EventPublisherService;

    let redisService: RedisService;

    const logger = {

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

        const module: TestingModule = await Test.createTestingModule({

            providers: [

                RedisService,

                EventPublisherService,

                {

                    provide: PinoLogger,

                    useValue: logger,

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
            ],

        }).compile();

        redisService = module.get(RedisService);

        publisher = module.get(EventPublisherService);

        await redisService.onModuleInit();

    });

    afterEach(async () => {

        const client = redisService.getClient();

        if (client.isReady) {

            await client.flushAll();

        }

        await redisService.onModuleDestroy();

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

    }

    it('should connect to redis', async () => {

        await redisService.onModuleInit();

        await waitFor(() => expect(redisService.isConnected()).toBe(true));

    });

    it('should publish an ENRICH_LAUNCHED event', async () => {

        const event = new EnrichedLaunchBuilder().withSource('integration-test').buildEvent();

        await publisher.publish(event);

        expect(logger.info).toHaveBeenCalledWith({ event: GatewayEvents.ENRICH_LAUNCHED, }, '[EventPublisher] Published event');

    });

    it('should propagate redis failure', async () => {

        const event = new EnrichedLaunchBuilder().buildEvent();

        await redisService.disconnect();

        await expect(publisher.publish(event)).rejects.toBeDefined();

        expect(logger.error).toHaveBeenCalledWith({ error: expect.anything() }, '[EventPublisher] Failed to publish event');

    });

});