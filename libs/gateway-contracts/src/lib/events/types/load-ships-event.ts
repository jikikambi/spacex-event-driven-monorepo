import { GatewayMetadata } from "../../gateway-metadata";
import { Ship } from "../../gateway-payloads";

//export type LoadShipsEvent = Omit<GatewayEventBase<"LOAD_SHIPS">, "payload"> & { payload: Ship[]; };

export interface LoadShipsEvent extends GatewayMetadata {
    event: "LOAD_SHIPS";
    payload: Ship[];
}