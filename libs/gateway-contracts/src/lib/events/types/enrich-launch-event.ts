import { GatewayMetadata } from "../../gateway-metadata";
import { EnrichedLaunchPayload } from "../../gateway-payloads";

//export type EnrichLaunchEvent = Omit<GatewayEventBase<"ENRICH_LAUNCH">, "payload"> & { payload: EnrichedLaunchPayload; };

export interface EnrichLaunchEvent extends GatewayMetadata {
    event: "ENRICH_LAUNCH";
    payload: EnrichedLaunchPayload;
}