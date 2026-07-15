import { Controller, Get, Res } from "@nestjs/common";
import { MetricsService } from "./metrics.service";
import { PinoLogger } from "nestjs-pino";
import { Response } from 'express';

@Controller('observability')
export class MetricsController {

    constructor(private readonly logger: PinoLogger,
        private readonly metricsSvc: MetricsService) {
        this.logger.setContext(MetricsController.name);
    }

    @Get('metrics')
    async getMetrics(@Res() res: Response) {
        res.setHeader('Content-Type', this.metricsSvc.getContentType());
        res.send(await this.metricsSvc.getMetrics());
    }
}