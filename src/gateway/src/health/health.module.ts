import { Module } from "@nestjs/common";
import { MongoModule } from "../infrastructure/datastore/mongo/mongo.module";
import { RedisModule } from "../infrastructure/datastore/redis/redis.module";
import { RabbitMQModule } from "../infrastructure/messaging/rabbitmq/rabbitmq.module";
import { HealthService } from "./health.service";
import { HealthController } from "./health.controller";
import { TerminusModule } from "@nestjs/terminus";
import { TelemetryContextService } from "../observability/logging/telemetry-context.service";

@Module({
    imports:[TerminusModule, MongoModule, RedisModule, RabbitMQModule],

    controllers: [HealthController],

    providers: [TelemetryContextService, HealthService],
    
    exports: [HealthService]
})
export class HealthModule {}