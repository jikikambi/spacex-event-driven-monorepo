import { Injectable, Logger, OnApplicationShutdown } from '@nestjs/common';
import { sdk } from '../tracing/tracing';

@Injectable()
export class OpenTelemetryService implements OnApplicationShutdown {

    private readonly logger = new Logger(OpenTelemetryService.name);

    async onApplicationShutdown(signal?: string) {

        this.logger.log(`Application shutdown signal received: ${signal}`);

        try {

            this.logger.log('Stopping OpenTelemetry...');

            await sdk.shutdown();

            this.logger.log('OpenTelemetry shutdown complete');

        } catch (error) {

            this.logger.error('Failed shutting down OpenTelemetry', error);
        }
    }
}