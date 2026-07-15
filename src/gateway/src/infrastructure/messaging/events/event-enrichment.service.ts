import { Injectable } from "@nestjs/common";
import { EnrichmentService } from "../../../enrichment/enrichment.service";
import { GatewayEvent, EnrichLaunchEvent, GatewayEventType, GatewayEventBase } from "gateway-contracts";

@Injectable()
export class EventEnrichmentService {

    constructor(private readonly enrichSvc: EnrichmentService) { }

    // async enrich<T extends GatewayEventType>(event: GatewayEventBase<T>): Promise<GatewayEventBase<T> | EnrichLaunchEvent> {
    async enrich(event: GatewayEvent): Promise<GatewayEvent | EnrichLaunchEvent> {

        if (event.event !== 'ENRICH_LAUNCH') return event;

        const payload = await this.enrichSvc.enrichLaunchWithCache(event.payload);

        return { ...event, payload };
    }
}