import { AppConfig } from "./AppConfig";

export class ConfigService {

    private readonly config: AppConfig;

    constructor() {

        this.config = {

            gateway: {

                eventsUrl: import.meta.env.VITE_GATEWAY_EVENTS_URL,

                baseUrl: import.meta.env.VITE_GATEWAY_BASE_URL,

                sseEndpoint: "/events",

            },

            features: {

                mockProvider: import.meta.env.VITE_MOCK_PROVIDER === "true",

                telemetry: import.meta.env.VITE_TELEMETRY === "true",

            },

            environment: {

                production: import.meta.env.PROD,

            }

        };
        
    }

    get settings(): Readonly<AppConfig> {

        return this.config;

    }

}