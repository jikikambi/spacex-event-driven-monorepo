import { SpaceXEventBase } from '@shared-types/events';
import { GatewayEventListener } from './gateway-even-listener';

export class GatewayEventBus {

    private readonly url = 'http://localhost:3001/api/events';

    private source?: EventSource;

    private readonly listeners = new Set<GatewayEventListener>();

    connect(): void {

        if (this.source) {
            return;
        }

        this.source = new EventSource(this.url);

        this.source.onopen = () => {
            console.log('[GatewayEventBus] Connected');
        };

        this.source.onerror = (error) => {
            console.error('[GatewayEventBus] Connection error', error);
        };

        this.source.onmessage = (message) => {

            try {

                const event = JSON.parse(message.data) as SpaceXEventBase;

                console.log('[GatewayEventBus] Received', event.event);

                this.emit(event);

            } catch (error) {

                console.error('[GatewayEventBus] Invalid event', error);
            }
        };
    }

    disconnect(): void {

        this.source?.close();
        this.source = undefined;
    }

    subscribe(listener: GatewayEventListener): () => void {

        this.listeners.add(listener);

        return () => this.listeners.delete(listener);
    }

    private emit(event: SpaceXEventBase): void {

        for (const listener of this.listeners) {
            listener(event);
        }
    }
}