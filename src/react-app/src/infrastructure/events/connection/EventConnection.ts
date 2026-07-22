
import { EventConnectionOptions } from "./EventConnectionOptions";
import { EventListener } from "../types/EventListener";
import { EventConnectionState } from "./EventConnectionState";
import { ConfigService } from "../../../config";

export class EventConnection {

    private evtSrc?: EventSource;

    private heartbeatTimer?: number;

    private reconnectTimer?: number;

    private reconnectDelay: number;

    readonly messageListeners = new Set<EventListener<MessageEvent>>();

    private readonly openListeners = new Set<EventListener<void>>();

    private readonly errorListeners = new Set<EventListener<Event>>();

    private readonly stateListeners = new Set<EventListener<EventConnectionState>>();

    private state = EventConnectionState.OFFLINE;

    constructor(private readonly config: ConfigService,
        private readonly options: EventConnectionOptions) {

        this.reconnectDelay = options.reconnectDelay;
    }

    public connect(): void {

        if (this.state === EventConnectionState.CONNECTED || this.state === EventConnectionState.CONNECTING) return;

        window.clearTimeout(this.reconnectTimer);

        const nextState = this.state === EventConnectionState.OFFLINE ? EventConnectionState.CONNECTING : EventConnectionState.RECONNECTING;
        
        this.transition(nextState);

        this.evtSrc = new EventSource(this.config.settings.gateway.eventsUrl);

        this.evtSrc.onopen = () => {

            this.reconnectDelay = this.options.reconnectDelay;

            this.resetHeartbeat();

            this.transition(EventConnectionState.CONNECTED);

            this.openListeners.forEach(listener => listener());
        };

        this.evtSrc.onmessage = (msgEvt: MessageEvent) => {

            this.resetHeartbeat();

            this.messageListeners.forEach(listener => listener(msgEvt));
        };

        this.evtSrc.onerror = event => {

            this.errorListeners.forEach(listener => listener(event));

            this.scheduleReconnect();
        };
    }

    public disconnect(): void {

        window.clearTimeout(this.heartbeatTimer);

        window.clearTimeout(this.reconnectTimer);

        this.heartbeatTimer = undefined;
        this.reconnectTimer = undefined;

        this.evtSrc?.close();
        this.evtSrc = undefined;

        this.reconnectDelay = this.options.reconnectDelay;

        this.transition(EventConnectionState.OFFLINE);
    }

    private handleDisconnect(): void {

         if (!this.evtSrc) return;

        window.clearTimeout(this.heartbeatTimer);

        this.evtSrc?.close();

        this.evtSrc = undefined;

        this.transition(EventConnectionState.RECONNECTING);

        this.scheduleReconnect();
    }

    public onMessage(listener: EventListener<MessageEvent>): () => void {

        this.messageListeners.add(listener);

        return () => this.messageListeners.delete(listener);
    }

    public onOpen(listener: EventListener<void>): () => void {

        this.openListeners.add(listener);

        return () => this.openListeners.delete(listener);
    }

    public onError(listener: EventListener<Event>): () => void {

        this.errorListeners.add(listener);

        return () => this.errorListeners.delete(listener);
    }

    public onStateChanged(listener: EventListener<EventConnectionState>): () => void {

        this.stateListeners.add(listener);

        return () => this.stateListeners.delete(listener);
    }

    public get connectionState(): EventConnectionState {

        return this.state;
    }

    private transition(next: EventConnectionState): void {

        if (this.state === next)  return;

        console.log("STATE", this.state, "->", next);

        this.state = next;

        this.stateListeners.forEach(listener => listener(next));
    }

    private resetHeartbeat(): void {

        window.clearTimeout(this.heartbeatTimer);

        this.heartbeatTimer = window.setTimeout(() => {

            console.warn("[SSE] heartbeat timeout");

            this.handleDisconnect();

        }, this.options.heartbeatTimeout);
    }

    private scheduleReconnect(): void {

        if (!this.options.autoReconnect) {

            this.transition(EventConnectionState.OFFLINE);

            return;
        }

        const delay = this.reconnectDelay;

        this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.options.maxReconnectDelay);

        this.reconnectTimer = window.setTimeout(() => {

            this.connect();

        }, delay);
    }
}