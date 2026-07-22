import { ConfigService } from "../../config/ConfigService";
import { EventConnection } from "./connection/EventConnection";
import { DefaultEventConnectionOptions, EventConnectionOptions } from "./connection/EventConnectionOptions";
import { ConnectionStatusService } from "./connection/ConnectionStatusService";
import { EventParser } from "./parser/EventParser";
import { EventClient } from "./client";
import { EventConnectionState } from "./connection/EventConnectionState";

export class EventModule {

    public readonly client: EventClient;

    public readonly connection: EventConnection;

    constructor(private readonly config: ConfigService, private readonly health: ConnectionStatusService, private readonly options: EventConnectionOptions = DefaultEventConnectionOptions) {

        this.connection = new EventConnection(config, options);

        this.client = new EventClient(this.connection, new EventParser());

        this.connection.onStateChanged(state => {

            console.log("HEALTH", state);

            switch (state) {

                case EventConnectionState.CONNECTING:

                    this.health.connectionStarted();

                    break;

                case EventConnectionState.CONNECTED:

                    this.health.connectionEstablished();

                    break;

                case EventConnectionState.RECONNECTING:

                    this.health.reconnectScheduled();

                    break;

                case EventConnectionState.OFFLINE:

                    this.health.connectionLost();

                    break;
            }
        });

        this.connection.onMessage(() => {

            this.health.eventReceived();

        });

    }

}