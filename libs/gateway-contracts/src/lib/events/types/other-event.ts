import { GatewayMetadata } from "../gateway-metadata";

export interface OtherEvent extends GatewayMetadata {
    event: "OTHER_EVENT",
    payload: any
}