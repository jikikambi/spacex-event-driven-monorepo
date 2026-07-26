import { GatewayMetadata } from "../gateway-metadata";
import { GatewayEvents } from '../../constants/gateway-events.constant';

export interface LaunchEvent extends GatewayMetadata {

    event: typeof GatewayEvents.LAUNCH_RECEIVED;

    payload: {
        id: string;
    };
}