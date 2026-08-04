import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';

import { PinoLogger } from 'nestjs-pino';

import { SpaceXMockService } from './spacex-mock.service';
import { TelemetryContextService } from '../../../observability/logging/telemetry-context.service';
import { RequestMetadataService } from '../../../common/middleware/request-metadata.service';
import { getLaunchFixture, mockLaunches } from '../../../test-utils/spacex.fixtures';

describe('SpaceXMockService', () => {

    let service: SpaceXMockService;

    let logger: jest.Mocked<PinoLogger>;

    beforeEach(async () => {

        const module = await Test.createTestingModule({

            providers: [

                SpaceXMockService,

                {
                    provide: PinoLogger,

                    useValue: {

                        setContext: jest.fn(),

                        debug: jest.fn(),

                        info: jest.fn(),

                        warn: jest.fn(),

                        error: jest.fn(),

                    }

                },
                {

                    provide: TelemetryContextService,

                    useValue: {

                        traceId: 'trace-id',

                        spanId: 'span-id',

                    }

                },
                {

                    provide: RequestMetadataService,

                    useValue: {

                        correlationId: 'corr-id'

                    }

                }

            ]

        }).compile();

        service = module.get(SpaceXMockService);

        logger = module.get(PinoLogger);

    });

    describe('fetchLaunches', () => {

        it('should return all launches', async () => {

            const launches = await service.fetchLaunches();

            expect(launches).toHaveLength(mockLaunches.length);

        });

        it('should return cloned launches', async () => {

            const launches = await service.fetchLaunches();

            launches[0].name = 'changed';

            const again = await service.fetchLaunches();

            expect(again[0].name).not.toBe('changed');

        });

    });

    describe('fetchLaunch', () => {

        it('should return launch by id', async () => {

            const { launch } = getLaunchFixture();

            const result = await service.fetchLaunch(launch.id);

            expect(result).toEqual(launch);

        });

        it('should return cloned launch', async () => {

            const { launch } = getLaunchFixture();

            const first = await service.fetchLaunch(launch.id);

            first.name = 'modified';

            const second = await service.fetchLaunch(launch.id);

            expect(second.name).toBe(launch.name);

        });

        it('should throw when launch is missing', async () => {

            await expect(

                service.fetchLaunch('does-not-exist')

            ).rejects.toBeInstanceOf(NotFoundException);

            expect(logger.error).toHaveBeenCalled();

        });

    });

    describe('fetchRocket', () => {

        it('should return rocket', async () => {

            const { rocket } = getLaunchFixture();

            const result = await service.fetchRocket(rocket.id);

            expect(result).toEqual(rocket);

        });

        it('should return cloned rocket', async () => {

            const { rocket } = getLaunchFixture();

            const first = await service.fetchRocket(rocket.id);

            first!.name = 'modified';

            const second = await service.fetchRocket(rocket.id);

            expect(second!.name).toBe(rocket.name);

        });

        it('should return null when rocket does not exist', async () => {

            const result = await service.fetchRocket('missing');

            expect(result).toBeNull();

            expect(logger.warn).toHaveBeenCalled();

        });

    });

    describe('fetchPayloads', () => {

        it('should return payload collection', async () => {

            const { payloads } = getLaunchFixture();

            const ids = payloads.map(x => x.id);

            const result = await service.fetchPayloads(ids);

            expect(result).toEqual(payloads);

        });

        it('should return cloned payloads', async () => {

            const { payloads } = getLaunchFixture();

            const ids = payloads.map(x => x.id);

            const first = await service.fetchPayloads(ids);

            first[0].name = 'changed';

            const second = await service.fetchPayloads(ids);

            expect(second[0].name).toBe(payloads[0].name);

        });

        it('should return empty collection for empty ids', async () => {

            const result = await service.fetchPayloads([]);

            expect(result).toEqual([]);

        });

    });

    describe('fetchShips', () => {

        it('should return ship collection', async () => {

            const { ships } = getLaunchFixture();

            const ids = ships.map(x => x.id);

            const result = await service.fetchShips(ids);

            expect(result).toEqual(ships);

        });

        it('should return cloned ships', async () => {

            const { ships } = getLaunchFixture();

            const ids = ships.map(x => x.id);

            const first = await service.fetchShips(ids);

            first[0].name = 'modified';

            const second = await service.fetchShips(ids);

            expect(second[0].name).toBe(ships[0].name);

        });

        it('should return empty collection when ids are empty', async () => {

            const result = await service.fetchShips([]);

            expect(result).toEqual([]);

        });

    });

    describe('fetchLaunchpad', () => {

        it('should return launchpad', async () => {

            const { launchpad } = getLaunchFixture();

            const result = await service.fetchLaunchpad(launchpad.id);

            expect(result).toEqual(launchpad);

        });

        it('should return null when launchpad does not exist', async () => {

            const result = await service.fetchLaunchpad('missing');

            expect(result).toBeNull();

        });

    });

});