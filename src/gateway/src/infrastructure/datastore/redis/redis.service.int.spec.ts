import { ConfigService } from '@nestjs/config';
import { PinoLogger } from 'nestjs-pino';

import { GenericContainer, StartedTestContainer } from 'testcontainers';

import { RedisService } from './redis.service';
import { Test } from '@nestjs/testing';

describe('RedisService (integration)', () => {

    let redisContainer: StartedTestContainer;

    let service: RedisService;

    let configSvc: ConfigService;

    let logger: PinoLogger;

    beforeAll(async () => {

        redisContainer = await new GenericContainer('redis:7-alpine').withExposedPorts(6379).start();

    }, 120000);

    beforeEach(async () => {

        const redisUrl = `redis://${redisContainer.getHost()}:${redisContainer.getMappedPort(6379)}`;

        const module = await Test.createTestingModule({

            providers: [

                RedisService,

                {

                    provide: ConfigService,

                    useValue: {

                        getOrThrow: jest.fn().mockReturnValue(redisUrl)

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

                }

            ]

        }).compile();

        service = module.get(RedisService);

        configSvc = module.get(ConfigService);

        logger = module.get(PinoLogger);

         await service.onModuleInit();

    });

    afterEach(async () => {

        await service.onModuleDestroy();
        
    });

    afterAll(async () => {

        await redisContainer.stop();

    }, 120000);

    describe('connection lifecycle', () => {

        it('should connect to redis', () => {

            expect(service.isConnected()).toBe(true);
        });

        it('should expose redis client', () => {

            const client = service.getClient();

            expect(client).toBeDefined();
        });

    });

    describe('get/set operations', () => {

        it('should store and retrieve value', async () => {

            await service.set('test:key', 'hello');

            const result = await service.get('test:key');

            expect(result).toBe('hello');
        });

        it('should return null for missing key', async () => {

            const result = await service.get('missing:key');

            expect(result).toBeNull();
        });

        it('should set key with expiration', async () => {

            await service.set('ttl:key', 'value', 60);

            const result = await service.get('ttl:key');

            expect(result).toBe('value');
        });

    });

    describe('exists', () => {

        it('should return true for existing key', async () => {

            await service.set('exists:key', '1');

            await expect(service.exists('exists:key')).resolves.toBe(true);
        });

        it('should return false for missing key', async () => {

            await expect(service.exists('unknown:key')).resolves.toBe(false);
        });

    });

    describe('setIfNotExists', () => {

        it('should set value when key does not exist', async () => {

            const result = await service.setIfNotExists('lock:key', 'locked', 60);

            expect(result).toBe(true);

            expect(await service.get('lock:key'))
                .toBe('locked');
        });

        it('should not overwrite existing value', async () => {

            await service.set('lock:key', 'existing');

            const result = await service.setIfNotExists('lock:key', 'new', 60);

            expect(result).toBe(false);

            expect(await service.get('lock:key')).toBe('existing');
        });

    });

    describe('mGet', () => {

        it('should return multiple values', async () => {

            await service.set('one', '1');

            await service.set('two', '2');

            const result = await service.mGet(['one', 'two', 'missing']);

            expect(result).toEqual(['1', '2', null]);
        });

        it('should return empty array for empty input', async () => {

            await expect(service.mGet([])).resolves.toEqual([]);
        });

    });

    describe('keys', () => {

        it('should return matching keys', async () => {

            await service.set('launch:1', 'a');

            await service.set('launch:2', 'b');

            const keys = await service.keys('launch:*');

            expect(keys).toEqual(expect.arrayContaining(['launch:1', 'launch:2']));
        });

    });

    describe('delete', () => {

        it('should remove key', async () => {

            await service.set('delete:key', 'value');

            await service.delete('delete:key');

            expect(await service.exists('delete:key')).toBe(false);
        });

    });

    describe('disconnect', () => {

        it('should close redis connection', async () => {

            await service.disconnect();

            expect(service.isConnected()).toBe(false);
        });

    });

});