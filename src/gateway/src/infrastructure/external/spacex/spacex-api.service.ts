import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { PinoLogger } from 'nestjs-pino';
import { ISpaceXProvider } from './spacex.provider';
import { Launch, Launchpad, Payload, Rocket, Ship } from 'spacex-types';
import { RequestMetadataService } from '../../../common/middleware/request-metadata.service';
import { TelemetryContextService } from '../../../observability/logging/telemetry-context.service';
import { LaunchMapper, LaunchpadMapper, LaunchpadSchema, LaunchSchema, PayloadMapper, PayloadSchema, RocketMapper, RocketSchema, ShipMapper, ShipSchema } from '../../../schemas';
import z from 'zod';

@Injectable()
export class SpaceXApiService implements ISpaceXProvider {

    private readonly baseUrl: string;

    constructor(private readonly http: HttpService,
        private readonly config: ConfigService,
        private readonly logger: PinoLogger,
        private readonly telctxSvc: TelemetryContextService,
        private readonly metadataSvc: RequestMetadataService
    ) {

        this.logger.setContext(SpaceXApiService.name);

        this.baseUrl = this.config.getOrThrow<string>('SPACEX_API');

        if (!this.baseUrl) throw new Error('SPACEX_API is not defined');
        
    }

    async fetchLaunches(): Promise<Launch[]> {

        const url = `${this.baseUrl}/launches`;

        const data = await this.getUnknown(url, 'fetchLaunches');

        const result = z.array(LaunchSchema).safeParse(data);

        if (!result.success) {

            this.logger.error(
                {
                    issues: result.error.issues
                }, '[SpaceX] Invalid launches response');

            throw new Error('Invalid SpaceX launches payload');
        }

        const payloadData: Launch[] = [];

        result.data.forEach((payload: Launch) => {

            payloadData.push(LaunchMapper.toModel(payload));
        });

        return payloadData;

    }

    async fetchLaunch(id: string): Promise<Launch> {

        const url = `${this.baseUrl}/launches/${id}`;

        const data = await this.getUnknown(url, 'fetchLaunches');

        const result = LaunchSchema.safeParse(data);

        if (!result.success) {

            this.logger.error(
                {
                    launchId: id,
                    issues: result.error.issues
                }, '[SpaceX] Invalid launch response');

            throw new Error(`Invalid SpaceX launch payload ${id}`);
        }

        return LaunchMapper.toModel(result.data);

    }

    async fetchRocket(id: string): Promise<Rocket | null> {

        if (!id) return null;

        const url = `${this.baseUrl}/rockets/${id}`;

        const data = await this.getUnknown(url, 'fetchRocket');

        const result = RocketSchema.safeParse(data);

        if (!result.success) {

            this.logger.error(
                {
                    rocketId: id,
                    issues:
                        result.error.issues
                }, '[SpaceX] Invalid rocket response');

            throw new Error(`Invalid SpaceX rocket payload ${id}`);
        }

        return RocketMapper.toModel(result.data);

    }

    async fetchPayloads(ids: string[]): Promise<Payload[]> {

        if (!ids.length) return [];

        const base = `${this.baseUrl}/payloads`;

        const payloads = await Promise.all(ids.map(id => this.getUnknown(`${base}/${id}`, 'fetchPayload')));

        const result = z.array(PayloadSchema).safeParse(payloads);

        if (!result.success) {

            this.logger.error(
                {
                    issues: result.error.issues
                }, '[SpaceX] Invalid payload response');

            throw new Error('Invalid SpaceX payload collection');
        }

        const payloadData: Payload[] = [];

        result.data.forEach((payload: Payload) => {

            payloadData.push(PayloadMapper.toModel(payload));
        });

        return payloadData;

    }

    async fetchShips(ids: string[]): Promise<Ship[]> {

        if (!ids.length) return [];

        const base = `${this.baseUrl}/ships`;

        const ships = await Promise.all(ids.map(id => this.getUnknown(`${base}/${id}`, 'fetchShip')));

        const result = z.array(ShipSchema).safeParse(ships);

        if (!result.success) {

            this.logger.error(
                {
                    issues: result.error.issues
                }, '[SpaceX] Invalid ships response');

            throw new Error('Invalid SpaceX ships collection');

        }

        const payloadData: Ship[] = [];

        result.data.forEach((payload: Ship) => {

            payloadData.push(ShipMapper.toModel(payload));

        });

        return payloadData;

    }

    async fetchLaunchpad(id: string): Promise<Launchpad | null> {

        if (!id) return null;

        const url = `${this.baseUrl}/launchpads/${id}`;

        const data = await this.getUnknown(url, 'fetchLaunchpad');

        const result = LaunchpadSchema.safeParse(data);

        if (!result.success) {

            this.logger.error(
                {
                    launchpadId: id,
                    issues:
                        result.error.issues
                }, '[SpaceX] Invalid launchpad response');

            throw new Error('Invalid SpaceX launchpad payload');
        }

        return LaunchpadMapper.toModel(result.data);

    }

    private async getUnknown(url: string, operation: string): Promise<unknown> {

        const context = this.logContext(operation);

        this.logger.info(
            {
                ...context,
                url
            }, '[SpaceX] HTTP request');

        try {

            const response = await firstValueFrom(this.http.get(url, { timeout: 5000 }));

            return response.data;

        }
        catch (error) {

            this.logger.error(
                {
                    ...context,
                    url,
                    error: error instanceof Error ? error.message : String(error)
                }, '[SpaceX] API request failed');

            throw error;

        }

    }

    private logContext(operation: string) {

        return {
            correlationId: this.metadataSvc.correlationId,

            traceId: this.telctxSvc?.traceId,

            spanId: this.telctxSvc?.spanId,

            component: 'spacex',

            operation,
        };

    }

}