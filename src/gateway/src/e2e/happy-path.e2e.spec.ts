import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { EnrichLaunchEvent, GatewayEvents } from 'gateway-contracts';

import { GatewayE2ETestModule } from './gateway-e2e-test.module';
import { MongoService } from '../infrastructure/datastore/mongo/mongo.service';
import { RedisService } from '../infrastructure/datastore/redis/redis.service';
import { RabbitMQService } from '../infrastructure/messaging/rabbitmq/rabbitmq.service';
import { getLaunchFixture } from '../test-utils/spacex.fixtures';

describe('Gateway E2E - Happy Path', () => {

    let app: INestApplication;

    let mongo: MongoService;

    let redis: RedisService;

    beforeAll(async () => {

        const moduleRef = await Test.createTestingModule(

            {

                imports: [GatewayE2ETestModule]

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

    beforeEach(async () => {

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