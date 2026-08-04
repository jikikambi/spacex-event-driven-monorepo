import { Test } from '@nestjs/testing';
import { PinoLogger } from 'nestjs-pino';

import { EnrichmentService } from './enrichment.service';
import { RedisService } from '../infrastructure/datastore/redis/redis.service';
import { SPACEX_PROVIDER_TOKEN } from '../common/constants/spacex.constants';
import { ISpaceXProvider } from '../infrastructure/external/spacex/spacex.provider';

import { getLaunchFixture } from '../test-utils/spacex.fixtures';
import { EnrichedGatewayLaunch, mapLaunch, mapPayload, mapRocket, mapShip } from 'gateway-contracts';

describe('EnrichmentService', () => {

    let service: EnrichmentService;

    let redis: jest.Mocked<RedisService>;

    let provider: jest.Mocked<ISpaceXProvider>;

    const fixture = getLaunchFixture();

    beforeEach(async () => {

        const module = await Test.createTestingModule({

            providers: [

                EnrichmentService,
                {
                    provide: RedisService,
                    useValue: {
                        get: jest.fn(),
                        set: jest.fn(),
                        delete: jest.fn()
                    }
                },
                {
                    provide: SPACEX_PROVIDER_TOKEN,
                    useValue: {
                        fetchLaunch: jest.fn(),
                        fetchRocket: jest.fn(),
                        fetchPayloads: jest.fn(),
                        fetchShips: jest.fn()
                    }
                },
                {
                    provide: PinoLogger,
                    useValue: {
                        setContext: jest.fn(),
                        debug: jest.fn(),
                        warn: jest.fn(),
                        error: jest.fn()
                    }
                }

            ]

        }).compile();

        service = module.get(EnrichmentService);

        redis = module.get(RedisService);

        provider = module.get(SPACEX_PROVIDER_TOKEN);

    });

    it('returns cached launch when Redis contains valid data', async () => {

        const enriched: EnrichedGatewayLaunch = {

            launch: mapLaunch(fixture.launch),

            rocket: mapRocket(fixture.rocket),

            payloads: fixture.payloads.map(mapPayload),

            ships: fixture.ships.map(mapShip)

        };

        redis.get.mockResolvedValue(JSON.stringify(enriched));

        const result = await service.buildEnrichedLaunch(fixture.launch.id);

        expect(result).toEqual(enriched);

        expect(provider.fetchLaunch).not.toHaveBeenCalled();

        expect(provider.fetchRocket).not.toHaveBeenCalled();

        expect(provider.fetchPayloads).not.toHaveBeenCalled();

        expect(provider.fetchShips).not.toHaveBeenCalled();

        expect(redis.set).not.toHaveBeenCalled();
    });

    it('builds enriched launch when cache is empty', async () => {

        redis.get.mockResolvedValue(null);

        provider.fetchLaunch.mockResolvedValue(fixture.launch);

        provider.fetchRocket.mockResolvedValue(fixture.rocket);

        provider.fetchPayloads.mockResolvedValue(fixture.payloads);

        provider.fetchShips.mockResolvedValue(fixture.ships);

        const result = await service.buildEnrichedLaunch(fixture.launch.id);

        expect(result.launch.id).toBe(fixture.launch.id);

        expect(provider.fetchLaunch).toHaveBeenCalledWith(fixture.launch.id);

        expect(provider.fetchRocket).toHaveBeenCalledWith(fixture.launch.rocket);

        expect(provider.fetchPayloads).toHaveBeenCalledWith(fixture.launch.payloads);

        expect(provider.fetchShips).toHaveBeenCalledWith(fixture.launch.ships);

        expect(redis.set).toHaveBeenCalled();

    });

    it('stores the serialized enriched launch in Redis', async () => {

        redis.get.mockResolvedValue(null);

        provider.fetchLaunch.mockResolvedValue(fixture.launch);

        provider.fetchRocket.mockResolvedValue(fixture.rocket);

        provider.fetchPayloads.mockResolvedValue(fixture.payloads);

        provider.fetchShips.mockResolvedValue(fixture.ships);

        await service.buildEnrichedLaunch(fixture.launch.id);

        expect(redis.set).toHaveBeenCalledWith(

            `enrichedLaunch:${fixture.launch.id}`,

            expect.any(String),

            300

        );

        const cachedJson = redis.set.mock.calls[0][1];

        const cached = JSON.parse(cachedJson);

        expect(cached.launch.id).toBe(fixture.launch.id);

    });

    it('ignores corrupted cache and rebuilds from provider', async () => {

        redis.get.mockResolvedValue('THIS IS NOT JSON');

        provider.fetchLaunch.mockResolvedValue(fixture.launch);

        provider.fetchRocket.mockResolvedValue(fixture.rocket);

        provider.fetchPayloads.mockResolvedValue(fixture.payloads);

        provider.fetchShips.mockResolvedValue(fixture.ships);

        await service.buildEnrichedLaunch(fixture.launch.id);

        expect(redis.delete).toHaveBeenCalledWith(`enrichedLaunch:${fixture.launch.id}`);

        expect(provider.fetchLaunch).toHaveBeenCalled();

    });

    it('ignores invalid cached schema and rebuilds', async () => {

        redis.get.mockResolvedValue(JSON.stringify({ hello: 'world' }));

        provider.fetchLaunch.mockResolvedValue(fixture.launch);

        provider.fetchRocket.mockResolvedValue(fixture.rocket);

        provider.fetchPayloads.mockResolvedValue(fixture.payloads);

        provider.fetchShips.mockResolvedValue(fixture.ships);

        await service.buildEnrichedLaunch(fixture.launch.id);

        expect(redis.delete).toHaveBeenCalledWith(`enrichedLaunch:${fixture.launch.id}`);

        expect(provider.fetchLaunch).toHaveBeenCalled();

    });

    it('propagates provider failures', async () => {

        redis.get.mockResolvedValue(null);

        provider.fetchLaunch.mockRejectedValue(new Error('SpaceX unavailable'));

        await expect(service.buildEnrichedLaunch(fixture.launch.id)).rejects.toThrow('SpaceX unavailable');

    });

    it('supports launches without payloads or ships', async () => {

        redis.get.mockResolvedValue(null);

        provider.fetchLaunch.mockResolvedValue({

            ...fixture.launch,

            payloads: [],

            ships: []

        });

        provider.fetchRocket.mockResolvedValue(fixture.rocket);

        provider.fetchPayloads.mockResolvedValue([]);

        provider.fetchShips.mockResolvedValue([]);

        const result = await service.buildEnrichedLaunch(fixture.launch.id);

        expect(result.payloads).toEqual([]);

        expect(result.ships).toEqual([]);

    });

    it('propagates Redis write failures', async () => {

        redis.get.mockResolvedValue(null);

        redis.set.mockRejectedValue(new Error('Redis unavailable'));

        provider.fetchLaunch.mockResolvedValue(fixture.launch);

        provider.fetchRocket.mockResolvedValue(fixture.rocket);

        provider.fetchPayloads.mockResolvedValue(fixture.payloads);

        provider.fetchShips.mockResolvedValue(fixture.ships);

        await expect(service.buildEnrichedLaunch(fixture.launch.id)).rejects.toThrow('Redis unavailable');

    });

});