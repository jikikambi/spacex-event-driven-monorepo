import { GatewayMetadata } from "../gateway-metadata";
import { EnrichedGatewayLaunch } from "../gateway-payloads";
import { GatewayEvents } from '../../constants/gateway-events.constant';

export interface EnrichLaunchEvent extends GatewayMetadata { 

    event: typeof GatewayEvents.ENRICH_LAUNCHED;
    
    payload: EnrichedGatewayLaunch;
}