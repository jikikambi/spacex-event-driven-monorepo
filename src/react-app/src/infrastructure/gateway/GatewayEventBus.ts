import { GatewayEvent } from 'gateway-contracts';
import { GatewayEventListener } from './GatewayEventListener';
import { ConfigService } from '../../config';

export class GatewayEventBus {

    constructor(private readonly config: ConfigService) { }

    private source?: EventSource;

    private readonly listeners = new Set<GatewayEventListener>();

    connect(): void {

        const API = this.config.settings.gateway.baseUrl;

        if (this.source) {
            return;
        }

        this.source = new EventSource(`${API}/events`);

        this.source.onopen = () => {
            console.log('[GatewayEventBus] Connected');
        };

        this.source.onerror = (error) => {
            console.error('[GatewayEventBus] Connection error', error);
        };

        this.source.onmessage = (message) => {

            try {

                const event = JSON.parse(message.data) as GatewayEvent;

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

    private emit(event: GatewayEvent): void {

        for (const listener of this.listeners) {
            listener(event);
        }
    }
}