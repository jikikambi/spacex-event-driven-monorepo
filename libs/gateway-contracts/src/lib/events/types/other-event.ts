import { GatewayMetadata } from "../gateway-metadata";
import { GatewayEvents } from '../../constants/gateway-events.constant';

export interface OtherEvent extends GatewayMetadata {
    event: typeof GatewayEvents.OTHER_EVENT;
    payload: unknown;
}