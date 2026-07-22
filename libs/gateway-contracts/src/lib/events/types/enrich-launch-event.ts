import { GatewayMetadata } from "../gateway-metadata";
import { EnrichedGatewayLaunch } from "../gateway-payloads";

export interface EnrichLaunchEvent extends GatewayMetadata { 

    event: "ENRICH_LAUNCH";
    
    payload: EnrichedGatewayLaunch;
}