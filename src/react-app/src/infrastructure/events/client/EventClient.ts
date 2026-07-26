
import { IncomingGatewayEvent } from "gateway-contracts";
import { EventListener } from "../types/EventListener";
import { EventParser } from "../parser/EventParser";
import { EventConnection } from "../connection/EventConnection";

export class EventClient {

    private readonly listeners = new Set<EventListener<IncomingGatewayEvent>>();

    private readonly unsubscribeConnection: () => void;

    constructor(private readonly connection: EventConnection,
        private readonly parser: EventParser) {

        this.unsubscribeConnection = this.connection.onMessage((msgEvt: MessageEvent) => {

            const event = this.parser.parse(msgEvt.data);

            if (!event) return;

            this.notify(event);
        });
    }

    public start(): void {

        this.connection.connect();
    }

    public notify(event: IncomingGatewayEvent): void {

        this.listeners.forEach(listener => listener(event));
    }

    public subscribe(listener: EventListener<IncomingGatewayEvent>): () => void {

        this.listeners.add(listener);

        return () => this.listeners.delete(listener);
    }

    public stop(): void {

        this.unsubscribeConnection();

        this.connection.disconnect();
    }

}