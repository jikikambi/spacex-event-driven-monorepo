
export interface EventConnectionOptions {

    /**
     * Initial reconnect delay.
     */
    readonly reconnectDelay: number;

    /**
     * Maximum reconnect delay.
     */
    readonly maxReconnectDelay: number;

    /**
     * Heartbeat timeout.
     */
    readonly heartbeatTimeout: number;

    /**
     * Enables automatic reconnect.
     */
    readonly autoReconnect: boolean;
}

export const DefaultEventConnectionOptions = Object.freeze({
    reconnectDelay: 1_000,
    maxReconnectDelay: 30_000,
    heartbeatTimeout: 45_000,
    autoReconnect: true,
}) satisfies EventConnectionOptions;