import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { EnrichLaunchEvent, GatewayEvents } from 'gateway-contracts';

import { GatewayE2ETestModule } from './gateway-e2e-test.module';
import { MongoService } from '../infrastructure/datastore/mongo/mongo.service';
import { RedisService } from '../infrastructure/datastore/redis/redis.service';
import { RabbitMQService } from '../infrastructure/messaging/rabbitmq/rabbitmq.service';
import { getLaunchFixture } from '../test-utils/spacex.fixtures';
import { GenericContainer, StartedTestContainer } from 'testcontainers';
import { ConfigService } from '@nestjs/config';
import { QUEUE_NAMES, QUEUE_TEST_NAMES } from '../common/constants/queue.constants';

describe('Gateway E2E - Happy Path', () => {

    let app: INestApplication;

    let mongoContainer: StartedTestContainer;

    let redisContainer: StartedTestContainer;

    let rabbitContainer: StartedTestContainer;

    let mongoUrl: string;

    let redisUrl: string;

    let rabbitUrl: string;

    let mongo: MongoService;

    let redis: RedisService;

    beforeAll(async () => {

        mongoContainer = await new GenericContainer('mongo:7').withExposedPorts(27017).start();

        redisContainer = await new GenericContainer('redis:7.2-alpine').withExposedPorts(6379).start();

        rabbitContainer = await new GenericContainer('rabbitmq:4-management-alpine').withExposedPorts(5672).start();

        mongoUrl = `mongodb://${mongoContainer.getHost()}:${mongoContainer.getMappedPort(27017)}`;

        redisUrl = `redis://${redisContainer.getHost()}:${redisContainer.getMappedPort(6379)}`;

        rabbitUrl = `amqp://${rabbitContainer.getHost()}:${rabbitContainer.getMappedPort(5672)}`;

    }, 120000);

    beforeEach(async () => {

        const moduleRef = await Test.createTestingModule(

            {

                imports: [GatewayE2ETestModule],

                providers: [

                    {
                        provide: ConfigService,

                        useValue: {

                            getOrThrow: jest.fn((key: string) => {

                                switch (key) {

                                    case 'MONGO_URL': return mongoUrl;

                                    case 'MONGO_DB_NAME': return 'spacex_test';

                                    case 'REDIS_URL': return redisUrl;

                                    case 'RABBITMQ_URL': return rabbitUrl;

                                    case 'RABBITMQ_QUEUE': return QUEUE_TEST_NAMES.SPACEX_EVENTS;

                                    default: throw new Error(`Missing config ${key}`);

                                }

                            })
                        }
                    }
                ]

            }

        ).compile();

        app = moduleRef.createNestApplication();

        await app.init();

        await app.get(RabbitMQService).publish(

            {

                event: GatewayEvents.LAUNCH_RECEIVED,

                eventId: crypto.randomUUID(),

                timestamp: new Date().toISOString(),

                source: 'e2e',

                payload: {

                    id: getLaunchFixture().launch.id

                }

            }

        );

        mongo = app.get(MongoService);

        redis = app.get(RedisService);

        await app.listen(0);

    });

    afterEach(async () => {

        await mongo.getDatabase().dropDatabase();

        await redis.getClient().flushAll();

    });

    afterAll(async () => {

        await app?.close();

    });

    it('processes a SpaceX launch from bootstrap to SSE delivery', async () => {

        const event = await connectSse(app);

        expect(event.event).toBe(GatewayEvents.ENRICH_LAUNCHED);

        expect(event.payload.launch.id).toBe(getLaunchFixture().launch.id);

        const persisted = await mongo.getCollection('events').findOne({ event: GatewayEvents.ENRICH_LAUNCHED });

        expect(persisted).not.toBeNull();

        const keys = await redis.keys('fanout:*');

        expect(keys).toHaveLength(1);

    }, 60000);

});

function connectSse(app: INestApplication, path = '/events', expectedEvents = 1): Promise<EnrichLaunchEvent> {

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

                        const json = body.replace('data: ', '').trim();

                        resolve(JSON.parse(json) as EnrichLaunchEvent);

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