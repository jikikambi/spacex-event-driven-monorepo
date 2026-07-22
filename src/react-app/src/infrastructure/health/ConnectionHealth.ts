import { EventConnectionState } from "../events/connection/EventConnectionState";

export interface ConnectionHealth {

    /**
     * Current gateway connection state.
     */
    readonly state: EventConnectionState;

    /**
     * Number of consecutive reconnect attempts.
     */
    readonly reconnectAttempts: number;

    /**
     * Time the gateway was last connected.
     */
    readonly lastConnected?: Date;

    /**
     * Time the last event was received.
     */
    readonly lastEventAt?: Date;
}