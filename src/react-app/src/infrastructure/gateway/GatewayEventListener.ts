import { GatewayEvent } from "gateway-contracts";

export interface GatewayEventListener {
    (event: GatewayEvent): void;
}