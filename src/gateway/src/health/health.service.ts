import { Injectable, Scope } from "@nestjs/common";
import { MongoService } from "../infrastructure/database/mongo/mongo.service";
import { RedisService } from "../infrastructure/database/redis/redis.service";
import { RabbitMQService } from "../infrastructure/messaging/rabbitmq/rabbitmq.service";
import { PinoLogger } from "nestjs-pino";
import { TelemetryContextService } from "../observability/logging/telemetry-context.service";
import { trace, SpanStatusCode } from '@opentelemetry/api';

const tracer = trace.getTracer('gateway');

@Injectable({ scope: Scope.REQUEST })
export class HealthService {

    constructor(private readonly telCtxSvc: TelemetryContextService,
        private readonly mongo: MongoService,
        private readonly redis: RedisService,
        private readonly rabbit: RabbitMQService,
        private readonly logger: PinoLogger) {

        this.logger.setContext(HealthService.name);
    }

    async getHealth() {

        return tracer.startActiveSpan('HealthService.getHealth',
            
            async (span) => {

                try {

                    const url = this.telCtxSvc.request.url;

                    this.logger.info(
                        {
                            ...this.logContext('getHealth'),
                            url,
                        }, 'Health check requested');

                    const checks = {
                        mongodb: this.mongo.isConnected(),
                        redis: this.redis.isConnected(),
                        rabbitmq: this.rabbit.isConnected(),
                    };

                    return {
                        status: Object.values(checks).every(Boolean) ? 'healthy' : 'degraded',
                        timestamp: new Date().toISOString(),
                        uptime: process.uptime(),
                        checks
                    };

                }
                catch (err) {

                    span.recordException(err as Error);

                    span.setStatus({ code: SpanStatusCode.ERROR });

                    throw err;

                }
                finally {

                    span.end();
                }
            });
    }

    private logContext(operation: string) {
        
        return {
            ...this.telCtxSvc.logContext,
            component: 'HealthService',
            operation,
        };
    }
}