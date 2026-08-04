import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PinoLogger } from 'nestjs-pino';

import { GenericContainer, StartedTestContainer } from 'testcontainers';

import amqp from 'amqplib';

import { RabbitMQService } from './rabbitmq.service';

import { randomUUID } from 'crypto';
import { QUEUE_NAMES } from '../../../common/constants/queue.constants';
import { GatewayEvents } from 'gateway-contracts';

describe('RabbitMQService (integration)', () => {

    let container: StartedTestContainer;

    let rabbitUrl: string;

    let service: RabbitMQService;

    let moduleRef: any;

    beforeAll(async () => {

        container = await new GenericContainer('rabbitmq:3-management-alpine').withExposedPorts(5672).start();

        rabbitUrl = `amqp://${container.getHost()}:${container.getMappedPort(5672)}`;

    }, 120000);

    beforeEach(async () => {

        moduleRef = await Test.createTestingModule({

            providers: [

                RabbitMQService,

                {
                    provide: ConfigService,

                    useValue: {

                        getOrThrow: jest.fn((key: string) => {

                            if (key === 'RABBITMQ_URL') return rabbitUrl;

                            if (key === 'RABBITMQ_QUEUE') return QUEUE_NAMES.SPACEX_EVENTS;

                        }),

                        get: jest.fn((key: string) => {

                            if (key === 'RABBITMQ_RETRY_TTL_MS') return 100;

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

        service = moduleRef.get(RabbitMQService);

    });

    afterEach(async () => {

        if (service) await service.close();

        await moduleRef.close();

        //jest.clearAllTimers();
        jest.useRealTimers();
    });

    afterAll(async () => {

        await container.stop();

    }, 120000);

    it('should connect to RabbitMQ and assert topology', async () => {

        const channel = await service.connect();

        expect(channel).toBeDefined();

        expect(service.isConnected()).toBe(true);

        const health = service.getHealth();

        expect(health).toMatchObject({

            connected: true,

            bufferedEvents: 0

        });

    });

    it('should publish event to queue', async () => {

        await service.connect();

        const event =
        {
            event: GatewayEvents.LAUNCH_RECEIVED,

            eventId: randomUUID(),

            timestamp: new Date().toISOString(),

            payload:
            {
                id: randomUUID()
            }

        };

        await service.publish(event);

        const verify = await amqp.connect(rabbitUrl);

        const channel = await verify.createChannel();

        const msg = await channel.get(QUEUE_NAMES.SPACEX_EVENTS);

        expect(msg).not.toBe(false);

        if (msg) {

            const body = JSON.parse(msg.content.toString());

            expect(body).toEqual(event);

            channel.ack(msg);
        }

        await channel.close();

        await verify.close();

    });

    it('should buffer event when RabbitMQ is unavailable', async () => {

        jest.spyOn(service, 'connect').mockRejectedValue(new Error('RabbitMQ unavailable'));

        const event =
        {
            event: GatewayEvents.LAUNCH_RECEIVED,

            eventId: randomUUID(),

            timestamp: new Date().toISOString(),

            payload:
            {
                id: randomUUID()
            }
        };

        await service.publish(event);

        const health = service.getHealth();

        expect(health.bufferedEvents).toBe(1);

        expect(health.message).toContain('1 events waiting');

    });

    it('should report health information', async () => {

        const before = service.getHealth();

        expect(before).toEqual({

            connected: false,

            bufferedEvents: 0,

            oldestBufferedMs: 0,

            lastPublishAttempt: undefined,

            message: 'No buffered events.'

        });

        await service.connect();

        const after = service.getHealth();

        expect(after.connected).toBe(true);

    });

    it('should close RabbitMQ gracefully', async () => {

        await service.connect();

        expect(service.isConnected()).toBe(true);

        await service.close();

        expect(service.isConnected()).toBe(false);

    });

    it('should retry connection failures', async () => {

        const badConfig = await Test.createTestingModule({

            providers: [

                RabbitMQService,
                {
                    provide: ConfigService,

                    useValue:
                    {
                        getOrThrow: jest.fn().mockReturnValue('amqp://invalid-host:5672')
                    }
                },
                {
                    provide: PinoLogger,

                    useValue:
                    {
                        info: jest.fn(),
                        warn: jest.fn(),
                        error: jest.fn(),
                        setContext: jest.fn()
                    }

                }

            ]

        }).compile();

        const svc = badConfig.get(RabbitMQService);

        try {

            await expect(svc.connect(3, 10)).rejects.toBeDefined();

            const logger = badConfig.get(PinoLogger);

            expect(logger.warn).toHaveBeenCalledTimes(3);

        }
        finally {
            
            await svc.close();

            await badConfig.close();
        }

    });

});