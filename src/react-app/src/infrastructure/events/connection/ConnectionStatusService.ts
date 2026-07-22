import { EventConnectionState } from "./EventConnectionState"
import { EventListener } from "../types/EventListener";
import { ConnectionHealth } from "../../health/ConnectionHealth";

export class ConnectionStatusService {

    private health: ConnectionHealth = {
        state: EventConnectionState.OFFLINE,
        reconnectAttempts: 0,
    };

    private readonly listeners = new Set<EventListener<ConnectionHealth>>();

    /**
    * Gateway is attempting its first connection.
    */
    public connectionStarted(): void {

        this.update({

            state: EventConnectionState.CONNECTING,

        });
    }

    /**
    * Gateway successfully connected.
    */
    public connectionEstablished(): void {

        this.update({

            state: EventConnectionState.CONNECTED,

            reconnectAttempts: 0,

            lastConnected: new Date(),

        });
    }

    /**
     * A gateway event has been received.
     */
    public eventReceived(): void {

        this.update({

            lastEventAt: new Date(),

        });
    }

    /**
     * Gateway lost connection and scheduled another attempt.
     */
    public reconnectScheduled(): void {

        this.update({

            state: EventConnectionState.RECONNECTING,

            reconnectAttempts: this.health.reconnectAttempts + 1,

        });
    }

    /**
    * Gateway is completely offline.
    */
    public connectionLost(): void {

        this.update({

            state: EventConnectionState.OFFLINE,

        });
    }

    /**
    * Returns current connection health snapshot.
    */
    public getHealth(): ConnectionHealth {

        return this.health;
    }

    /**
    * React subscription.
    */
    public subscribe(listener: EventListener<ConnectionHealth>): () => void {

        this.listeners.add(listener);

        return () => this.listeners.delete(listener);
    }

    /**
     * Internal immutable update.
     */
    private update(change: Partial<ConnectionHealth>): void {

        const next: ConnectionHealth = {

            ...this.health,

            ...change,

        };

        if (this.equals(this.health, next)) {

            return;

        }

        this.health = next;

        this.notify();
    }

    private notify(): void {

        for (const listener of this.listeners) {

            listener(this.health);

        }
    }

    /**
     * Prevent unnecessary React renders.
     */
    private equals(a: ConnectionHealth, b: ConnectionHealth): boolean {

        return (

            a.state === b.state &&
            a.reconnectAttempts === b.reconnectAttempts &&
            a.lastConnected?.getTime() === b.lastConnected?.getTime() &&
            a.lastEventAt?.getTime() === b.lastEventAt?.getTime()

        );
    }

    private setState(ch: ConnectionHealth): void {

        if (this.health === ch) return;

        this.health = ch;

        this.listeners.forEach(listener => listener(this.health));
    }

    public getState(): ConnectionHealth {

        return this.health;
    }

}