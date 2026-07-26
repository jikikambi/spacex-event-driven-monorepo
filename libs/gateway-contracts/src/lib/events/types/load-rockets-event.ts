import { GatewayMetadata } from "../gateway-metadata";
import { GatewayRocket } from "../gateway-payloads";
import { GatewayEvents } from '../../constants/gateway-events.constant';

export interface LoadRocketsEvent extends GatewayMetadata {
    event: typeof GatewayEvents.ROCKETS_LOADED;
    payload: GatewayRocket[];
}