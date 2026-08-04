import { Injectable } from "@nestjs/common";
import { EnrichmentService } from "../../../enrichment/enrichment.service";
import { IncomingGatewayEvent, EnrichLaunchEvent, LaunchEvent } from "gateway-contracts";
import { GatewayEvents } from 'gateway-contracts';

@Injectable()
export class EventEnrichmentService {

    constructor(private readonly enrichSvc: EnrichmentService) { }

    async enrich(event: IncomingGatewayEvent): Promise<IncomingGatewayEvent> {

        switch (event.event) {

            case GatewayEvents.LAUNCH_RECEIVED:
                return this.enrichLaunch(event);

            default:
                return event;
        }
    }

    private async enrichLaunch(event: LaunchEvent): Promise<EnrichLaunchEvent> {

        const payload = await this.enrichSvc.buildEnrichedLaunch(event.payload.id);

        return {

            ...event,

            event: GatewayEvents.ENRICH_LAUNCHED,

            payload,
        };

    }
    
}