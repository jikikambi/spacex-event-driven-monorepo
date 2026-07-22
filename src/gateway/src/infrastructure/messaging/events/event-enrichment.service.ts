import { Injectable } from "@nestjs/common";
import { EnrichmentService } from "../../../enrichment/enrichment.service";
import { GatewayEvent, EnrichLaunchEvent, LaunchEvent } from "gateway-contracts";

@Injectable()
export class EventEnrichmentService {

    constructor(private readonly enrichSvc: EnrichmentService) { }

    async enrich(event: GatewayEvent): Promise<GatewayEvent> {

        switch (event.event) {

            case "LAUNCH_RECEIVED":
                return this.enrichLaunch(event);

            default:
                return event;
        }
    }

    private async enrichLaunch(event: LaunchEvent): Promise<EnrichLaunchEvent> {

        const payload = await this.enrichSvc.buildEnrichedLaunch(event.payload.id);

        return {

            ...event,

            event: "ENRICH_LAUNCH",

            payload,
        };
    }
}