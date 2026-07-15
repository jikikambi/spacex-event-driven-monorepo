import { GatewayMetadata } from "../../gateway-metadata";
import { Rocket } from "../../gateway-payloads";

// Keep common metadata without duplicating it.
//export type LoadRocketsEvent = Omit<GatewayEventBase<"LOAD_ROCKETS">, "payload"> & { payload: Rocket[]; };

export interface LoadRocketsEvent extends GatewayMetadata {
    event: "LOAD_ROCKETS";
    payload: Rocket[];
}