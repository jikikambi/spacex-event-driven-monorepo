import { GatewayMetadata } from "../gateway-metadata";
import { GatewayPayload } from "../gateway-payloads";

export interface LoadPayloadsEvent extends GatewayMetadata {
    event: "LOAD_PAYLOADS",
    payload: GatewayPayload[]
}