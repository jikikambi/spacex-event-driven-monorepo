import { ConfigService } from '@nestjs/config';
import { PinoLogger } from 'nestjs-pino';
import { randomUUID } from 'crypto';

import { GenericContainer, StartedTestContainer, } from 'testcontainers';

import amqp, { Channel, ChannelModel } from 'amqplib';

import { RabbitMQConsumer } from './rabbitmq.consumer';
import { EventHandlerService } from './event-handler.service';
import { QUEUE_NAMES } from '../../../common/constants/queue.constants';
import { Test } from '@nestjs/testing';
import { GatewayEvents, LaunchEvent } from 'gateway-contracts';

describe('RabbitMQConsumer (integration)', () => {

    const MAX_RETRIES = 3;

    let container: StartedTestContainer;

    let connection: ChannelModel;

    let channel: Channel;

    let consumer: RabbitMQConsumer;

    let handler: jest.Mocked<EventHandlerService>;

    let logger: jest.Mocked<PinoLogger>;

    let config: jest.Mocked<ConfigService>;

    beforeAll(async () => {

        container = await new GenericContainer('rabbitmq:3-management-alpine').withExposedPorts(5672).start();

    }, 120000);

    beforeEach(async () => {

        const host = container.getHost();

        const port = container.getMappedPort(5672);

        connection = await amqp.connect(`amqp://${host}:${port}`);

        channel = await connection.createChannel();

        await channel.assertQueue(QUEUE_NAMES.SPACEX_EVENTS, { durable: true });

        await channel.assertQueue(`${QUEUE_NAMES.SPACEX_EVENTS}.retry`, { durable: true });

        const module = await Test.createTestingModule({

            providers: [

                RabbitMQConsumer,
                {
                    provide: ConfigService,
                    useValue: {
                        get: jest.fn().mockReturnValue(QUEUE_NAMES.SPACEX_EVENTS)
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
                },
                {
                    provide: EventHandlerService,
                    useValue: {
                        handleEvent: jest.fn()
                    }
                }
            ]

        }).compile();

        consumer = module.get(RabbitMQConsumer);

        handler = module.get(EventHandlerService);

        logger = module.get(PinoLogger);

        config = module.get(ConfigService);

    });

    afterEach(async () => {

        await consumer.stop(channel);

        await channel.deleteQueue(QUEUE_NAMES.SPACEX_EVENTS);

        await channel.deleteQueue(`${QUEUE_NAMES.SPACEX_EVENTS}.retry`);

        await channel.close();

        await connection.close();

    });

    afterAll(async () => {

        await container.stop();

    }, 120000);

    it('should consume valid launch event and acknowledge message', async () => {

        await consumer.start(channel);

        const event = createLaunchEvent();

        channel.sendToQueue(QUEUE_NAMES.SPACEX_EVENTS, Buffer.from(JSON.stringify(event)), { persistent: true });

        await waitUntil(() => handler.handleEvent.mock.calls.length > 0);

        expect(handler.handleEvent).toHaveBeenCalledWith(event);

    });

    it('should ignore null messages', async () => {

        await consumer.start(channel);

        expect(handler.handleEvent).not.toHaveBeenCalled();

    });

    it('should reject invalid schema message', async () => {

        await consumer.start(channel);

        const invalid = {

            event: GatewayEvents.LAUNCH_RECEIVED,

            payload: {},

            timestamp: new Date().toISOString()
        };

        channel.sendToQueue(QUEUE_NAMES.SPACEX_EVENTS, Buffer.from(JSON.stringify(invalid)));

        await new Promise(resolve => setTimeout(resolve, 500));

        expect(handler.handleEvent).not.toHaveBeenCalled();

        expect(logger.error).toHaveBeenCalledWith(expect.any(Object), 'Invalid GatewayEvent received');

    });

    it('should send failed messages to retry queue', async () => {

        handler.handleEvent.mockRejectedValue(new Error('processing failed'));

        await consumer.start(channel);

        const event = createLaunchEvent();

        channel.sendToQueue(QUEUE_NAMES.SPACEX_EVENTS, Buffer.from(JSON.stringify(event)));

        await waitUntil(() => handler.handleEvent.mock.calls.length > 0);

        const retryMessage = await channel.get(`${QUEUE_NAMES.SPACEX_EVENTS}.retry`);

        expect(retryMessage).not.toBeNull();

        if (retryMessage)
            expect(retryMessage.properties.headers?.['x-retry-count']).toBe(1);

    });

    it('should stop retrying after retry limit is reached', async () => {

        handler.handleEvent.mockRejectedValue(new Error('always fails'));

        await consumer.start(channel);

        const msgOptions = {

            headers: { 'x-retry-count': MAX_RETRIES }

        };

        channel.sendToQueue(QUEUE_NAMES.SPACEX_EVENTS,

            Buffer.from(JSON.stringify({

                event: GatewayEvents.LAUNCH_RECEIVED,

                eventId: randomUUID(),

                timestamp: new Date().toISOString(),

                payload: {

                    id: randomUUID()

                }
            })
            ), msgOptions );

        await waitUntil(() => handler.handleEvent.mock.calls.length > 0);

        const retry = await channel.get(`${QUEUE_NAMES.SPACEX_EVENTS}.retry`);

        expect(retry).toBe(false);

        expect(logger.error).toHaveBeenCalledWith({ retryCount: MAX_RETRIES }, '[RabbitMQ] Retry exhausted, sending to DLQ');

    });

});

function createLaunchEvent(overrides: Partial<LaunchEvent> = {}) {

    return {

        event: GatewayEvents.LAUNCH_RECEIVED,

        eventId: randomUUID(),

        timestamp: new Date().toISOString(),

        payload: {

            id: randomUUID()

        },

        ...overrides

    };

}

async function waitUntil(condition: () => boolean | Promise<boolean>, timeout = 5000, interval = 100) {

    const start = Date.now();

    while (!condition()) {

        if (Date.now() - start > timeout) {

            throw new Error('Timeout waiting for condition');
            
        }

        await new Promise(resolve => setTimeout(resolve, interval));
    }
    
}