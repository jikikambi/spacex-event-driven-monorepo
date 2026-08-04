import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { GenericContainer, StartedTestContainer } from 'testcontainers';

import { ConfigService } from '@nestjs/config';
import { PinoLogger } from 'nestjs-pino';

import { SseController } from './sse.controller';
import { SseGatewayService } from './sse-gateway.service';
import { RedisService } from '../../infrastructure/datastore/redis/redis.service';
import { MongoService } from '../../infrastructure/datastore/mongo/mongo.service';
import { EnrichedLaunchBuilder } from '../../test-utils/enriched-launch.builder';

describe('SseController (integration)', () => {

    let app: INestApplication;

    let redisContainer: StartedTestContainer;

    let mongoContainer: StartedTestContainer;

    let redis: RedisService;

    let mongo: MongoService;

    let gateway: SseGatewayService;

    beforeAll(async () => {

        redisContainer = await new GenericContainer('redis:7-alpine').withExposedPorts(6379).start();

        mongoContainer = await new GenericContainer('mongo:7').withExposedPorts(27017).start();

    }, 120000);

    beforeEach(async () => {

        const redisUrl = `redis://${redisContainer.getHost()}:${redisContainer.getMappedPort(6379)}`;

        const mongoUrl = `mongodb://${mongoContainer.getHost()}:${mongoContainer.getMappedPort(27017)}`;

        const module = await Test.createTestingModule({

            controllers: [SseController],

            providers: [

                SseGatewayService,

                RedisService,

                MongoService,

                {
                    provide: ConfigService,

                    useValue: {

                        getOrThrow: jest.fn((key: string) => {

                            switch (key) {

                                case 'REDIS_URL': return redisUrl;

                                case 'MONGO_URL': return mongoUrl;

                                case 'MONGO_DB_NAME': return 'gateway-test';

                                default: throw new Error(`Missing config ${key}`);
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

        app = module.createNestApplication();

        await app.init();

        await app.listen(0);

        redis = module.get(RedisService);

        mongo = module.get(MongoService);

        gateway = module.get(SseGatewayService);

        await redis.onModuleInit();

        await mongo.onModuleInit();

    });

    afterEach(async () => {

        await redis.getClient().flushAll();

        await mongo.getDatabase().collection('events').deleteMany({});

        await redis.onModuleDestroy();

        await mongo.onModuleDestroy();

        await app.close();

    });

    afterAll(async () => {

        await app.close();

        await redisContainer.stop();

        await mongoContainer.stop();

    });

    it('opens SSE stream for new client', async () => {

        const server = app.getHttpServer();

        const req = require('http').request({

            hostname: '127.0.0.1',

            port: server.address().port,

            path: '/events',

            method: 'GET',

            headers: { Accept: 'text/event-stream' }

        });

        req.end();

        await new Promise(resolve => setTimeout(resolve, 100));

        expect((gateway as SseGatewayService).getClients.size).toBe(1);

        req.destroy();

    });

    it('replays cached Redis events for new clients', async () => {

        const event = new EnrichedLaunchBuilder().buildEvent();

        await redis.setIfNotExistsWithValue(`fanout:${event.eventId}`, JSON.stringify(event), 3600);

        const body = await connectSse(app, '/events');

        expect(body).toContain(event.event);

        expect(body).toContain(event.eventId);

    });

    it('replays missed Mongo events when since is provided', async () => {

        const event = new EnrichedLaunchBuilder().buildEvent();

        await mongo.getCollection('events').insertOne({
            ...event,
            receivedAt: new Date()
        });

        const since = new Date(Date.now() - 60000).toISOString();

        const body = await connectSse(app, `/events?since=${since}`);

        expect(body).toContain(event.eventId);

    });

});

function connectSse(app: INestApplication, path: string, expectedEvents = 1): Promise<string> {

    return new Promise((resolve, reject) => {

        const server = app.getHttpServer();

        const req = require('http').request(

            {
                hostname: '127.0.0.1',

                port: server.address().port,

                path,

                method: 'GET',

                headers: { Accept: 'text/event-stream' }

            },

            (res: any) => {

                expect(res.headers['content-type']).toContain('text/event-stream');

                let body = '';

                res.on('data', (chunk: Buffer) => {

                    body += chunk.toString();

                    const received = body.match(/data:/g)?.length ?? 0;

                    if (received >= expectedEvents) {

                        resolve(body);

                        req.destroy();

                    }

                });

                res.on('error', reject);

            }

        );

        req.on('error', (err: Error) => reject(err));

        req.end();

    });

}