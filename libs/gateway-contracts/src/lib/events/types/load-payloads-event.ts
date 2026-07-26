import { GatewayMetadata } from "../gateway-metadata";
import { GatewayPayload } from "../gateway-payloads";
import { GatewayEvents } from '../../constants/gateway-events.constant';

export interface LoadPayloadsEvent extends GatewayMetadata {
    event: typeof GatewayEvents.PAYLOADS_LOADED;
    payload: GatewayPayload[];
}