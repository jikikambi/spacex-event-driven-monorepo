import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { PinoLogger } from 'nestjs-pino';
import { TelemetryContextService } from '../../observability/logging/telemetry-context.service';
import { ISpaceXProvider } from './spacex.provider';
import { RequestMetadataService } from '../../common/middleware/request-metadata.service';
import { Launchpad } from 'spacex-types';

@Injectable()
export class SpaceXApiService implements ISpaceXProvider {

    private readonly baseUrl: string | "";

    constructor(private readonly http: HttpService,
        private readonly config: ConfigService,
        private readonly logger: PinoLogger,
        private readonly telctxSvc: TelemetryContextService,
        private readonly metadataSvc: RequestMetadataService
    ) {
        this.logger.info('SpaceXApiService constructor called');

        this.logger.setContext(SpaceXApiService.name);

        this.baseUrl = this.config.getOrThrow<string>('SPACEX_API');

        if (!this.baseUrl) throw new Error('SPACEX_API is not defined');
    }

    async fetchLaunch(id: string) {

        const url = `${this.baseUrl}/${id}`;

        const context = this.logContext('fetchLaunch');

        this.logger.info(
            {
                ...context,
                url,
            }, 'Fetching launch from SpaceX');

        try {

            const { data } = await firstValueFrom(this.http.get(url, { timeout: 5000 }));

            return data;
        }
        catch (error) {

            this.logger.error(
                {
                    ...context,
                    url,
                    error: error,
                    message: error instanceof Error ? error.message : String(error),
                }, 'SpaceX API request failed');

            throw error;
        }
    }

    fetchLaunchpad(id: string): Promise<Launchpad | null> {
        throw new Error('Method not implemented.');
    }

    async fetchRocket(rocketId: string) {

        if (!rocketId) return null;

        const url = `${this.baseUrl.replace('/launches', '/rockets')}/${rocketId}`;

        const { data } = await firstValueFrom(this.http.get(url));
        return data;
    }

    async fetchPayloads(payloadIds: string[]) {

        if (!payloadIds?.length) return [];

        const base = this.baseUrl.replace('/launches', '/payloads');

        const results = await Promise.all(
            payloadIds.map(async (id) => {
                const { data } = await firstValueFrom(this.http.get(`${base}/${id}`));
                return data;
            }),
        );

        return results;
    }

    async fetchShips(shipIds: string[]) {

        if (!shipIds?.length) return [];

        const base = this.baseUrl.replace('/launches', '/ships');

        return Promise.all(
            shipIds.map(async (id) => {
                const { data } = await firstValueFrom(this.http.get(`${base}/${id}`));
                return data;
            }),
        );
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