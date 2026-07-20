import { Injectable } from "@nestjs/common";
import { PinoLogger } from "nestjs-pino";
import { GatewayEvent } from "gateway-contracts";
import { EventDeduplicationService } from "./event-deduplication.service";
import { EventDispatcherService } from "./event-dispatcher.service";
import { EventEnrichmentService } from "./event-enrichment.service";

@Injectable()
export class EventHandlerService {

    constructor(private readonly logger: PinoLogger,
        private readonly enrichSvc: EventEnrichmentService,
        private readonly dedupSvc: EventDeduplicationService,
        private readonly dispatcherSvc: EventDispatcherService) {
            
        this.logger.setContext(EventHandlerService.name);
    }

    async handleEvent(event: GatewayEvent): Promise<void> {

        console.log("HANDLE EVENT", event.event);

        if (!event.event || !event.payload) {

            this.logger.warn('Skipped invalid event payload', event);

            return;
        }

        try {

            const enrichedEvent = await this.enrichSvc.enrich(event);

            const shouldProcess = await this.dedupSvc.shouldProcess(enrichedEvent);

            if (!shouldProcess)  return;

            await this.dispatcherSvc.dispatch(enrichedEvent);
        }
        catch (error) {

            this.logger.error(error instanceof Error ? error.message ?? error : undefined, `[Gateway] handleEvent failed for ${event.event}`);
        }
    }
}