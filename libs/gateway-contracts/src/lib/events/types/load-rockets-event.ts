import { GatewayMetadata } from "../gateway-metadata";
import { GatewayRocket } from "../gateway-payloads";

export interface LoadRocketsEvent extends GatewayMetadata {
    event: "LOAD_ROCKETS";
    payload: GatewayRocket[];
}