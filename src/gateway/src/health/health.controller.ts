import { Controller, Get } from "@nestjs/common";
import { HealthCheck, HealthCheckService, HttpHealthIndicator } from '@nestjs/terminus';
import { HealthService } from "./health.service";
import { ConfigService } from "@nestjs/config";

@Controller('health')
export class HealthController {

    constructor(private readonly config: ConfigService,
        private readonly healthSvc: HealthService,
        private healthCheckSvc: HealthCheckService,
        private http: HttpHealthIndicator
    ) { }

    @Get('live')
    @HealthCheck()
    liveness() {
        return this.healthSvc.getHealth();
    }

    @Get('ready')
    @HealthCheck()
    readiness() {
        const baseUrl = this.config.getOrThrow<string>('SPACEX_MODE');
        return this.healthCheckSvc.check([() => this.http.pingCheck('spacex', baseUrl!),]);
    }
}