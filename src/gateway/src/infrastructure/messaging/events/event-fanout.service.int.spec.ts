import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PinoLogger } from 'nestjs-pino';
import { Response } from 'express';

import { GenericContainer, StartedTestContainer } from 'testcontainers';

import { EventFanoutService } from './event-fanout.service';
import { RedisService } from '../../datastore/redis/redis.service';
import { SseGatewayService } from '../../../interfaces/sse/sse-gateway.service';
import { EnrichedLaunchBuilder } from '../../../test-utils/enriched-launch.builder';

describe('EventFanoutService (integration)', () => {

    let redisContainer: StartedTestContainer;

    let service: EventFanoutService;

    let redisSvc: RedisService;

    let sseSvc: SseGatewayService;

    let logger: jest.Mocked<PinoLogger>;

    beforeAll(async () => {

        redisContainer = await new GenericContainer('redis:7-alpine').withExposedPorts(6379).start();

    });

    beforeEach(async () => {

        const redisUrl = `redis://${redisContainer.getHost()}:${redisContainer.getMappedPort(6379)}`;

        const module = await Test.createTestingModule({

            providers: [

                EventFanoutService,

                RedisService,

                SseGatewayService,

                {

                    provide: ConfigService,

                    useValue: {

                        getOrThrow: jest.fn((key: string) => {

                            switch (key) {

                                case 'REDIS_URL': return redisUrl;

                                default: throw new Error(`Unexpected config ${key}`);

                            }

                        })

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

        service = module.get(EventFanoutService);

        redisSvc = module.get(RedisService);

        sseSvc = module.get(SseGatewayService);

        logger = module.get(PinoLogger);

        await redisSvc.onModuleInit();

    });

    afterEach(async () => {

        await redisSvc.getClient().flushAll();

        sseSvc.getClients.clear();

        await redisSvc.onModuleDestroy();

        jest.restoreAllMocks();

    });

    afterAll(async () => {

        await redisContainer.stop();

    });

    //  onWrite?.(payload); => if (onWrite) onWrite(payload);
    // '?.' => "Only call it if it exists." 
    function createSseClient(onWrite?: (payload: string) => void): Response {

        return {

            setHeader: jest.fn(),

            flushHeaders: jest.fn(),

            write: jest.fn((payload: string) => {

                onWrite?.(payload);

            })

        } as unknown as Response;

    }

    describe('fanout()', () => {

        it('caches the event before broadcasting', async () => {

            let payloadReceived = '';

            const event = new EnrichedLaunchBuilder().buildEvent();

            const fanoutKey = `fanout:${event.eventId}`;

            const client = createSseClient(payload => payloadReceived = payload);

            await sseSvc.registerClient(client);

            await service.fanout(event.payload.launch.id, fanoutKey, event);

            const cached = await redisSvc.getClient().get(fanoutKey);

            expect(cached).not.toBeNull();

            expect(JSON.parse(cached as string)).toEqual(event);

            expect(payloadReceived).toContain(event.eventId);

        });

        it('broadcasts identical payload to every connected client', async () => {

            const event = new EnrichedLaunchBuilder().buildEvent();

            const fanoutKey = `fanout:${event.eventId}`;

            const writes1: string[] = [];

            const writes2: string[] = [];

            const writes3: string[] = [];

            const client = (bucket: string[]) => ({

                setHeader(): undefined { return undefined; },

                flushHeaders(): undefined { return undefined; },

                write(payload: string) {

                    bucket.push(payload);

                }

            }) as unknown as Response;

            await sseSvc.registerClient(client(writes1));

            await sseSvc.registerClient(client(writes2));

            await sseSvc.registerClient(client(writes3));

            await service.fanout(event.payload.launch.id, fanoutKey, event);

            expect(writes1).toHaveLength(1);

            expect(writes2).toHaveLength(1);

            expect(writes3).toHaveLength(1);

            const expectedPayload = `data: ${JSON.stringify(event)}\n\n`;

            expect(writes1[0]).toEqual(expectedPayload);

            expect(writes1[0]).toEqual(writes2[0]);

            expect(writes2[0]).toEqual(writes3[0]);

        });

        it('replays an event that was previously distributed', async () => {

            const event = new EnrichedLaunchBuilder().buildEvent();

            const fanoutKey = `fanout:${event.eventId}`;

            let replay = '';

            const res = createSseClient(payload => replay += payload);

            const clientId = await sseSvc.registerClient(res);

            await service.fanout(event.payload.launch.id, fanoutKey, event);

            replay = '';

            await sseSvc.replayCachedEvents(clientId);

            expect(replay).toContain(event.eventId);

            expect(replay).toContain(event.event);

        });

        it('replays exactly the payload that was broadcast', async () => {

            const event = new EnrichedLaunchBuilder().buildEvent();

            const fanoutKey = `fanout:${event.eventId}`;

            let broadcast = '';

            let replay = '';

            const res = createSseClient(payload => {

                if (!broadcast)
                    broadcast = payload;
                else
                    replay = payload;

            });

            const id = await sseSvc.registerClient(res);

            await service.fanout(event.payload.launch.id, fanoutKey, event);

            await sseSvc.replayCachedEvents(id);

            expect(replay).toEqual(broadcast);

        });

        it('stores an exact serialized copy of the event', async () => {

            const event = new EnrichedLaunchBuilder().buildEvent();

            const fanoutKey = `fanout:${event.eventId}`;

            await service.fanout(event.payload.launch.id, fanoutKey, event);

            const cached = await redisSvc.getClient().get(fanoutKey);

            expect(cached).not.toBeNull();

            expect(JSON.parse(cached as string)).toStrictEqual(event);

        });

        it('keeps the latest event for the same fanout key', async () => {

            const event = new EnrichedLaunchBuilder().buildEvent();

            const fanoutKey = `fanout:${event.eventId}`;

            await service.fanout(event.payload.launch.id, fanoutKey, event);

            const updated = { ...event, timestamp: new Date().toISOString() };

            await service.fanout(event.payload.launch.id, fanoutKey, updated);

            const record = await redisSvc.getClient().get(fanoutKey);

            const cached = JSON.parse(record as string);

            expect(cached.timestamp).toBe(updated.timestamp);

        });

        it('stores multiple independent events', async () => {

            const event = new EnrichedLaunchBuilder().buildEvent();

            for (let i = 0; i < 10; i++) {

                await service.fanout(event.payload.launch.id, `fanout:${i}`,

                    {

                        ...event,

                        eventId: `${i}`

                    }

                );

            }

            const keys = await redisSvc.getClient().keys('fanout:*');

            expect(keys).toHaveLength(10);

        });

        it('does not fail when there are no connected SSE clients', async () => {

            const event = new EnrichedLaunchBuilder().buildEvent();

            const fanoutKey = `fanout:${event.eventId}`;

            expect(sseSvc.getClients.size).toBe(0);

            await expect(service.fanout(event.payload.launch.id, fanoutKey, event)).resolves.not.toThrow();

            expect(await redisSvc.exists(fanoutKey)).toBe(true);

        });

        it('continues broadcasting when Redis write fails', async () => {

            const event = new EnrichedLaunchBuilder().buildEvent();

            const fanoutKey = `fanout:${event.eventId}`;

            const client = createSseClient();

            await sseSvc.registerClient(client);

            jest.spyOn(redisSvc, 'set').mockRejectedValue(new Error('Redis unavailable'));

            await expect(service.fanout(event.payload.launch.id, fanoutKey, event)).resolves.not.toThrow();

            expect(client.write).toHaveBeenCalledWith(`data: ${JSON.stringify(event)}\n\n`);

            expect(logger.error).toHaveBeenCalled();

        });

        it('continues caching when SSE broadcast fails', async () => {

            const event = new EnrichedLaunchBuilder().buildEvent();

            const fanoutKey = `fanout:${event.eventId}`;

            jest.spyOn(sseSvc, 'broadcast').mockImplementation(() => {

                throw new Error('SSE unavailable');

            });

            await expect(service.fanout(event.payload.launch.id, fanoutKey, event)).resolves.not.toThrow();

            expect(await redisSvc.exists(fanoutKey)).toBe(true);

            expect(logger.error).toHaveBeenCalled();

        });

        it('stores the Redis key with a one hour TTL', async () => {

            const event = new EnrichedLaunchBuilder().buildEvent();

            const fanoutKey = `fanout:${event.eventId}`;

            await service.fanout(event.payload.launch.id, fanoutKey, event);

            const ttl = await redisSvc.getClient().ttl(fanoutKey);

            expect(ttl).toBeGreaterThan(3500);

            expect(ttl).toBeLessThanOrEqual(3600);

        });

        it('writes exactly one Redis entry and one broadcast', async () => {

            const event = new EnrichedLaunchBuilder().buildEvent();

            const fanoutKey = `fanout:${event.eventId}`;

            const redisSpy = jest.spyOn(redisSvc, 'set');

            const broadcastSpy = jest.spyOn(sseSvc, 'broadcast');

            await service.fanout(event.payload.launch.id, fanoutKey, event);

            expect(redisSpy).toHaveBeenCalledTimes(1);

            expect(broadcastSpy).toHaveBeenCalledTimes(1);

            expect(redisSpy).toHaveBeenCalledWith(fanoutKey, JSON.stringify(event), 3600);

            expect(broadcastSpy).toHaveBeenCalledWith(event);

        });

    });

});