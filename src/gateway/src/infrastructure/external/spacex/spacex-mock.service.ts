import { Injectable, NotFoundException } from "@nestjs/common";
import { PinoLogger } from "nestjs-pino";
import rockets from '../../../mock-data/rockets.json';
import payloads from '../../../mock-data/payloads.json';
import ships from '../../../mock-data/ships.json';
import launchpads from '../../../mock-data/launchpads.json';
import { ISpaceXProvider } from "./spacex.provider";
import { Launch, Launchpad, Payload, Rocket, Ship } from "spacex-types";
import { RequestMetadataService } from "../../../common/middleware/request-metadata.service";
import { TelemetryContextService } from "../../../observability/logging/telemetry-context.service";
import { LaunchMapper, LaunchSchema } from "../../../schemas";
import { mockLaunches } from "../../../test-utils/spacex.fixtures";

@Injectable()
export class SpaceXMockService implements ISpaceXProvider {

    private readonly launchMap: Map<string, Launch>;

    constructor(private readonly logger: PinoLogger,
        private readonly telctxSvc: TelemetryContextService,
        private readonly metadataSvc: RequestMetadataService) {

        this.logger.setContext(SpaceXMockService.name);

        this.launchMap = this.loadLaunches();
    }

    async fetchLaunches(): Promise<Launch[]> {

        this.logger.debug({ count: this.launchMap.size }, "Loading mock launches");

        return [...this.launchMap.values()].map(x => structuredClone(x));

    }

    async fetchLaunch(id: string): Promise<Launch> {

        const context = this.logContext('fetchLaunch');

        this.logger.info({ ...context }, 'Fetching launch from SpaceX');

        try {

            const launch = this.launchMap.get(id);

            if (!launch) {

                throw new NotFoundException(`Mock launch '${id}' not found`);
            }

            const cloned = structuredClone(launch);

            return cloned;
        }
        catch (error) {

            this.logger.error(
                {
                    ...context,
                    error: error,
                    message: error instanceof Error ? error.message : String(error),
                }, 'SpaceX Mock request failed');

            throw error;
        }
    }

    async fetchLaunchpad(id: string): Promise<Launchpad | null> {

        this.logger.debug({ id }, 'Loading mock launchpad');

        return (this.launchpadMap.get(id) ?? null);
    }

    async fetchRocket(id: string): Promise<Rocket | null> {

        this.logger.debug({ id }, 'Loading mock rocket');

        const rocket = this.rocketMap.get(id);

        if (!rocket) {

            this.logger.warn({ rocketId: id }, "Rocket not found in mock dataset");

            return null;

        }

        return structuredClone(rocket);
    }

    async fetchPayloads(ids: string[]): Promise<Payload[]> {

        if (!ids.length) return [];

        this.logger.debug({ count: ids.length }, 'Loading mock payloads');

        return (payloads as Payload[])
            .filter(x => ids.includes(x.id))
            .map(x => structuredClone(x));
    }

    async fetchShips(ids: string[]): Promise<Ship[]> {

        if (!ids.length) return [];

        this.logger.debug({ count: ids.length }, 'Loading mock ships');

        return (ships as Ship[])
            .filter(x => ids.includes(x.id))
            .map(x => structuredClone(x));
    }

    private loadLaunches(): Map<string, Launch> {

        const validated = mockLaunches.map(item => {

            const result = LaunchSchema.safeParse(item);

            if (!result.success) {

                this.logger.error({ issues: result.error.issues }, 'Invalid mock SpaceX launch data');

                throw new Error(`Mock SpaceX data contract violation: ${result.error.message}`);
            }

            const mapped = LaunchMapper.toModel(result.data)

            return mapped;
        });

        return new Map(validated.map(x => [x.id, x]));
    }

    private readonly rocketMap = new Map((rockets as Rocket[]).map(x => [x.id, x]));

    private readonly launchpadMap = new Map((launchpads as Launchpad[]).map(x => [x.id, x]));

    private logContext(operation: string) {

        return {
            
            correlationId: this.metadataSvc.correlationId,

            traceId: this.telctxSvc.traceId,

            spanId: this.telctxSvc.spanId,

            component: 'spacex',

            operation,
        };
    }
}