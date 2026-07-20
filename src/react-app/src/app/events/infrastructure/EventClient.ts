
import { ConfigService } from "../../../config/ConfigService";
import type { GatewayEvent } from "gateway-contracts";
import { Listener } from "./EventListener";
import { EventConnectionState } from "./EventConnectionState";
import { EventClientOptions } from "./EventClientOptions";

export class EventClient {

    private evtSrc?: EventSource;

    private readonly listeners = new Set<Listener<GatewayEvent>>();

    private reconnectTimer?: number;

    private reconnectDelay: number;

    private state = EventConnectionState.DISCONNECTED;

    constructor(private readonly config: ConfigService,
        private readonly options: EventClientOptions) {

        this.reconnectDelay = options.reconnectDelay;
    }

    public get connectionState(): EventConnectionState {
        
        return this.state;
    }

    public start(): void {

        if (this.state === EventConnectionState.CONNECTED || this.state === EventConnectionState.CONNECTING) return;

        this.connect();
    }

    public stop(): void {

        window.clearTimeout(this.reconnectTimer);

        this.evtSrc?.close();

        this.evtSrc = undefined;

        this.state = EventConnectionState.DISCONNECTED;

        console.info("[EventClient] stopped");
    }

    public subscribe(handler: Listener<GatewayEvent>): () => void {

        this.listeners.add(handler);

        return () => this.listeners.delete(handler);
    }

    private connect(): void {

        this.state = this.state === EventConnectionState.DISCONNECTED ? EventConnectionState.CONNECTING : EventConnectionState.RECONNECTING;

        this.evtSrc = new EventSource(this.config.settings.gateway.eventsUrl);

        this.evtSrc.onopen = () => {

            this.state = EventConnectionState.CONNECTED;

            this.reconnectDelay = this.options.reconnectDelay;

            console.info("[EventClient] connected");
        };

        this.evtSrc.onmessage = (msgEvt: MessageEvent) => {

            try {

                const event = JSON.parse(msgEvt.data) as GatewayEvent;

                this.listeners.forEach(handler => handler(event));
            }
            catch (error) {

                console.error("[EventClient] invalid gateway event", error);
            }
        };

        this.evtSrc.onerror = () => {

            console.warn("[EventClient] connection lost");

            this.evtSrc?.close();

            this.state = EventConnectionState.RECONNECTING;

            this.scheduleReconnect();
        };
    }

    private scheduleReconnect(): void {

        window.clearTimeout(this.reconnectTimer);

        this.reconnectTimer = window.setTimeout(() => {

            this.connect();

        }, this.reconnectDelay);

        this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.options.maxReconnectDelay);
    }
}