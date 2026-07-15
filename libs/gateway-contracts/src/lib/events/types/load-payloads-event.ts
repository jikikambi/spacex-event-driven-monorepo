import { GatewayMetadata } from "../../gateway-metadata";
import { Payload } from "../../gateway-payloads";

//export type LoadPayloadsEvent = Omit<GatewayEventBase<"LOAD_PAYLOADS">, "payload"> & { payload: Payload[]; };

export interface LoadPayloadsEvent extends GatewayMetadata {
    event: "LOAD_PAYLOADS",
    payload: Payload[]
}