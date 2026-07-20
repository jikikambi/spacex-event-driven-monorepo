export interface AppConfig {

    gateway: {

        eventsUrl: string;
        
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