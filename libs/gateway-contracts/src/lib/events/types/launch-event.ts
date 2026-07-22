import { GatewayMetadata } from "../gateway-metadata";

export interface LaunchEvent extends GatewayMetadata {

    event: "LAUNCH_RECEIVED";

    payload: {
        id: string;
    };
}