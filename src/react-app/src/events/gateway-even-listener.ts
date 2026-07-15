export interface GatewayEventListener {
    (event: SpaceXEventBase): void;
}