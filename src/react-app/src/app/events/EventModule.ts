import { ConfigService } from "../../config/ConfigService";
import { EventClient } from "./infrastructure";

export class EventModule {

    public readonly client: EventClient;    

    constructor(private readonly config: ConfigService){

        this.client = new EventClient(config, {
            reconnectDelay: 1000,
            maxReconnectDelay: 30000,
        });
    }
    
}