import { Module } from "@nestjs/common";
import { MetricsService } from "./metrics.service";
import { MetricsController } from "./metrics.controller";

@Module({
    imports: [],
    controllers: [MetricsController],
    providers: [MetricsService],
    exports: [MetricsService]
})
export class MetricsModule { }