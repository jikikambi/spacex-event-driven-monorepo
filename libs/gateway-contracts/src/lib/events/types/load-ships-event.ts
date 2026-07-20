import { GatewayMetadata } from "../gateway-metadata";
import { GatewayShip } from "../gateway-payloads";

export interface LoadShipsEvent extends GatewayMetadata {
    event: "LOAD_SHIPS";
    payload: GatewayShip[];
}