import { GatewayMetadata } from "../gateway-metadata";
import { GatewayShip } from "../gateway-payloads";
import { GatewayEvents } from '../../constants/gateway-events.constant';

export interface LoadShipsEvent extends GatewayMetadata {
    event: typeof GatewayEvents.SHIPS_LOADED
    payload: GatewayShip[];
}