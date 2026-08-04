import { Injectable } from "@nestjs/common";
import { PinoLogger } from "nestjs-pino/PinoLogger";
import { EnrichLaunchEvent } from "gateway-contracts";
import { RedisService } from "../../datastore/redis/redis.service";
import { SseGatewayService } from "../../../interfaces/sse/sse-gateway.service";

@Injectable()
export class EventFanoutService {

    constructor(private readonly redisSvc: RedisService,
        private readonly ssegwSvc: SseGatewayService,
        private readonly logger: PinoLogger) { }

    async fanout(launchId: string, fanoutKey: string, event: EnrichLaunchEvent) {

        await this.safeExecute("Event Cache", event, async () => {

            await this.redisSvc.set(fanoutKey, JSON.stringify(event), 3600)

            this.logger.info({ launchId }, 'Cached event');
            
        })

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