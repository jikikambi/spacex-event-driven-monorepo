import { Test } from "@nestjs/testing";
import { PinoLogger } from "nestjs-pino";
import { GenericContainer, StartedTestContainer } from "testcontainers";

import { SpaceXApiService } from './spacex-api.service';
import { ConfigService } from "@nestjs/config";
import { TelemetryContextService } from "../../../observability/logging/telemetry-context.service";
import { RequestMetadataService } from "../../../common/middleware/request-metadata.service";
import { HttpModule } from "@nestjs/axios";

import { getLaunchFixture, mockLaunches } from "../../../test-utils/spacex.fixtures";


describe('SpaceXApiService (integration)', () => {

    let container: StartedTestContainer;

    let service: SpaceXApiService;

    let logger: jest.Mocked<PinoLogger>;

    let wiremockBase: string;

    const fixture = getLaunchFixture();

    beforeAll(async () => {

        container = await new GenericContainer('wiremock/wiremock:3.9.1').withExposedPorts(8080).start();

        wiremockBase = `http://${container.getHost()}:${container.getMappedPort(8080)}`;

    }, 120000);

    beforeEach(async () => {

        const module = await Test.createTestingModule({

            imports: [

                HttpModule

            ],

            providers: [

                SpaceXApiService,

                {

                    provide: ConfigService,

                    useValue: {

                        getOrThrow: jest.fn((key: string) => {

                            if (key === 'SPACEX_API') return wiremockBase;

                            return undefined;

                        })

                    }

                },
                {

                    provide: PinoLogger,

                    useValue: {

                        info: jest.fn(),

                        warn: jest.fn(),

                        error: jest.fn(),

                        debug: jest.fn(),

                        setContext: jest.fn()

                    }

                },
                {

                    provide: TelemetryContextService,

                    useValue: {

                        traceId: 'trace-id',

                        spanId: 'span-id'

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

        service = module.get(SpaceXApiService);

        logger = module.get(PinoLogger);

    });

    afterEach(async () => {

        await fetch(`${wiremockBase}/__admin/mappings/reset`, { method: 'POST' });

    });

    afterAll(async () => {

        await container.stop();

    }, 120000);

    it('should fetch launches', async () => {

        await stubGet(wiremockBase, '/launches', mockLaunches);

        const result = await service.fetchLaunches();

        expect(result).toHaveLength(mockLaunches.length);

    });

    it('should fetch launch', async () => {

        await stubGet(wiremockBase, `/launches/${fixture.launch.id}`, fixture.launch);

        const result = await service.fetchLaunch(fixture.launch.id);

        expect(result.id).toBe(fixture.launch.id);

    });

    it('should fetch rocket', async () => {

        await stubGet(wiremockBase, `/rockets/${fixture.rocket.id}`, fixture.rocket);

        const result = await service.fetchRocket(fixture.rocket.id);

        expect(result?.id).toBe(fixture.rocket.id);      

    });

    it('should fetch payload collection', async () => {

        await stubGet(wiremockBase, `/payloads/${fixture.payloads[0].id}`, fixture.payloads[0]);

        const result = await service.fetchPayloads([fixture.payloads[0].id]);

        expect(result).toHaveLength(1);

    });

    it('should fetch ships', async () => {

        await stubGet(wiremockBase, `/ships/${fixture.ships[0].id}`, fixture.ships[0]);

        const result = await service.fetchShips([fixture.ships[0].id]);

        expect(result).toHaveLength(1);

    });

    it('should fetch launchpad', async () => {

        await stubGet(wiremockBase, `/launchpads/${fixture.launchpad.id}`, fixture.launchpad);

        const result = await service.fetchLaunchpad(fixture.launchpad.id);

        expect(result?.id).toBe(fixture.launchpad.id);

    });

    it('should return null when rocket id is empty', async () => {

        expect(await service.fetchRocket('')).toBeNull();

    });

    it('should return empty payload collection', async () => {

        expect(await service.fetchPayloads([])).toEqual([]);

    });

    it('should return empty ship collection', async () => {

        expect(await service.fetchShips([])).toEqual([]);

    });

    it('should return null launchpad', async () => {

        expect(await service.fetchLaunchpad('')).toBeNull();

    });

    it('should reject invalid launch payload', async () => {

        await stubGet(wiremockBase, '/launches', [{}]);

        await expect(service.fetchLaunches()).rejects.toThrow('Invalid SpaceX launches payload');

        expect(logger.error).toHaveBeenCalled();

    });

    it('should propagate HTTP errors', async () => {

        await fetch(`${wiremockBase}/__admin/mappings`, {

            method: 'POST',

            headers: { 'Content-Type': 'application/json' },

            body: JSON.stringify({

                request: { method: 'GET', url: '/launches' },

                response: { status: 500 }

            })

        });

        await expect(service.fetchLaunches()).rejects.toBeDefined();

    });

});

async function stubGet(base: string, url: string, body: unknown, status = 200) {

    await fetch(`${base}/__admin/mappings`, {

        method: 'POST',

        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify({

            request: { method: 'GET', url },

            response: { status, headers: { 'Content-Type': 'application/json' }, jsonBody: body }

        })

    });

}