export interface AppConfig {

    gateway: {
        
        baseUrl: string;

        sseEndpoint: string;

    };

    features: {
        
        mockProvider: boolean;

        telemetry: boolean;

    };

    environment: {

        production: boolean;

    };
}