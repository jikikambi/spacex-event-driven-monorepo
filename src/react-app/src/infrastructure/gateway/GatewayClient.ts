
import { ConfigService } from "../../config/ConfigService";

export class GatewayClient {

    constructor(private readonly config: ConfigService) { }

    connect() {
        
        const API = this.config.settings.gateway.baseUrl;

        const url = `${API}/events`;

        return new EventSource(url);
    }
}