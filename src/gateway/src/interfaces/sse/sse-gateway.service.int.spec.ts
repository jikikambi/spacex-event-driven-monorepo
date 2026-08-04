import { Test } from '@nestjs/testing';
import { GenericContainer, StartedTestContainer } from 'testcontainers';
import { ConfigService } from '@nestjs/config';
import { PinoLogger } from 'nestjs-pino';
import { randomUUID } from 'crypto';

import { SseGatewayService } from './sse-gateway.service';

import { getLaunchFixture } from '../../test-utils/spacex.fixtures';
import { RedisService } from '../../infrastructure/datastore/redis/redis.service';
import { EnrichLaunchEvent, GatewayEvents } from 'gateway-contracts';
import { EnrichedLaunchBuilder } from '../../test-utils/enriched-launch.builder';

describe('SseGatewayService (integration)', () => {

    let redisContainer: StartedTestContainer;

    let redis: RedisService;

    let service: SseGatewayService;

    beforeAll(async () => {

        redisContainer = await new GenericContainer('redis:7-alpine').withExposedPorts(6379).start();

    }, 120000);

    beforeEach(async () => {

        const module = await Test.createTestingModule({

            providers: [

                RedisService,

                SseGatewayService,

                {
                    provide: ConfigService,
                    useValue: {

                        getOrThrow: jest.fn().mockReturnValue(`redis://${redisContainer.getHost()}:${redisContainer.getMappedPort(6379)}`)

                    }
                },

                {
                    provide: PinoLogger,

                    useValue: {

                        setContext: jest.fn(),

                        info: jest.fn(),

                        debug: jest.fn(),

                        warn: jest.fn(),

                        error: jest.fn()
                    }
                }

            ]

        }).compile();

        redis = module.get(RedisService);

        service = module.get(SseGatewayService);

        await redis.onModuleInit();

    });

    afterEach(async () => {

        await redis.getClient().flushAll();

        await redis.onModuleDestroy();

    });

    afterAll(async () => {

        await redisContainer.stop();

    }, 120000);

    function createResponseMock() {

        return {

            setHeader: jest.fn(),

            flushHeaders: jest.fn(),

            write: jest.fn(),

            end: jest.fn()

        } as any;

    }
  
    it('registers SSE client and sets headers', async () => {

        const res = createResponseMock();

        const clientId = await service.registerClient(res);

        expect(clientId).toBeDefined();

        expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/event-stream');

        expect(res.flushHeaders).toHaveBeenCalled();

    });

    it('broadcasts event to connected clients', async () => {

        const res = createResponseMock();

        await service.registerClient(res);

        const event = new EnrichedLaunchBuilder().buildEvent();

        service.broadcast(event);

        expect(res.write).toHaveBeenCalledWith(expect.stringContaining(GatewayEvents.ENRICH_LAUNCHED));

    });

    it('broadcasts to multiple clients', async () => {

        const res1 = createResponseMock();

        const res2 = createResponseMock();

        await service.registerClient(res1);

        await service.registerClient(res2);

        service.broadcast(new EnrichedLaunchBuilder().buildEvent());

        expect(res1.write).toHaveBeenCalled();

        expect(res2.write).toHaveBeenCalled();

    });

    it('replays cached Redis events', async () => {

        const res = createResponseMock();

        const clientId = await service.registerClient(res);

        const event = new EnrichedLaunchBuilder().buildEvent();

        await redis.setIfNotExistsWithValue(`fanout:${event.eventId}`, JSON.stringify(event), 3600);

        await service.replayCachedEvents(clientId);

        expect(res.write).toHaveBeenCalledWith(expect.stringContaining(event.eventId!));

    });

    it('does nothing when replaying unknown client', async () => {

        await expect(service.replayCachedEvents('missing')).resolves.not.toThrow();

    });

    it('removes disconnected clients', async () => {

        const res = createResponseMock();

        const id = await service.registerClient(res);

        service.unregisterClient(id);

        service.broadcast(new EnrichedLaunchBuilder().buildEvent());

        expect(res.write).not.toHaveBeenCalled();

    });

});