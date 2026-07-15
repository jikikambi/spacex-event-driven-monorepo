import { GatewayMetadata } from "../../gateway-metadata";

//export type OtherEvent = Omit<GatewayEventBase<"OTHER_EVENT">, "payload"> & { payload: any; };

export interface OtherEvent extends GatewayMetadata {
    event: "OTHER_EVENT",
    payload: any
}