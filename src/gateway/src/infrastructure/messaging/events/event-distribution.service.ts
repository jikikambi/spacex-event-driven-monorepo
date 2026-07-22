import { Injectable } from "@nestjs/common";
import { PinoLogger } from "nestjs-pino/PinoLogger";
import { EnrichLaunchEvent } from "gateway-contracts";
import { RedisService } from "../../cache/redis/redis.service";
import { RabbitMQService } from "../rabbitmq/rabbitmq.service";
import { SseGatewayService } from "../../../interfaces/sse/sse-gateway.service";

@Injectable()
export class EventDistributionService {

    constructor(//private readonly rabbitMqSvc: RabbitMQService,
        private readonly redisSvc: RedisService,
        private readonly ssegwSvc: SseGatewayService,
        private readonly logger: PinoLogger) { }

    async distribute(launchId: string, dedupKey: string, event: EnrichLaunchEvent) {

        // await this.safeExecute("RabbitMQ", event, async () => {

        //     this.rabbitMqSvc.publish(event);

        //     this.logger.info({ launchId }, `[RabbitMQ] Published event: ${event.event}`);
        // });

        await this.safeExecute("Redis", event, async () => {

            this.redisSvc.set(dedupKey, JSON.stringify(event), 3600)

            this.logger.info({ launchId }, 'Cached event');
        });

        await this.safeExecute("SSE", event, async () => {

            this.ssegwSvc.broadcast(event);

            this.logger.info({ launchId }, `[SSE] Broadcasted event: ${event.event}`);
        });
    }

    private async safeExecute(operation: string, event: EnrichLaunchEvent, action: () => Promise<void>) {

        try {
            
            await action();
        }
        catch (error) {

            this.logger.error(error instanceof Error ? error.message ?? error : undefined, `[${operation}] : ${event.event} event failed`);
        }
    }
}