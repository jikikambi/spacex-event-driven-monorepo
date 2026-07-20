import { Injectable, Inject, OnApplicationBootstrap } from "@nestjs/common";
import { PinoLogger } from "nestjs-pino";
import { SPACEX_PROVIDER_TOKEN } from "../common/constants/spacex.constants";
import { ISpaceXProvider } from "../integrations/spacex/spacex.provider";
import { RabbitMQService } from "../infrastructure/messaging/rabbitmq/rabbitmq.service";
import { EnrichedGatewayLaunch, GatewayEvent, GatewayLaunch, mapPayload, mapRocket, mapShip } from "gateway-contracts";

@Injectable()
export class LaunchProducerService implements OnApplicationBootstrap {

    constructor(@Inject(SPACEX_PROVIDER_TOKEN) private readonly provider: ISpaceXProvider,
        private readonly rabbitSvc: RabbitMQService,
        private readonly logger: PinoLogger,
    ) {

        this.logger.setContext(LaunchProducerService.name);
    }

    async onApplicationBootstrap(): Promise<void> {

        await this.publishMockLaunches();
    }

    /**
     * Reads launches from the provider and injects
     * initial GatewayEvents into RabbitMQ.
     */
    private async publishMockLaunches(): Promise<void> {

        const launches = await this.loadLaunches();

        this.logger.info({ count: launches.length }, "Publishing initial launches");

        for (const launch of launches) {

            await this.publishLaunch(launch);
        }

        this.logger.info("Initial launch publication complete.");
    }

    private async publishLaunch(launch: GatewayLaunch): Promise<void> {

        const [rocket, payloads, ships] = await Promise.all([

            this.provider.fetchRocket(launch.rocket),

            this.provider.fetchPayloads(launch.payloads ?? []),
            
            this.provider.fetchShips(launch.ships ?? []),
        ]);

        const enriched: EnrichedGatewayLaunch =
        {
            launch: launch,
            rocket: mapRocket(rocket),
            payloads: payloads.map(mapPayload),
            ships: ships.map(mapShip)
        };

        const event: GatewayEvent = {

            event: "ENRICH_LAUNCH",

            eventId: crypto.randomUUID(),

            timestamp: new Date().toISOString(),

            source: "gateway",

            payload: enriched
        };

        await this.rabbitSvc.publish(event);

        this.logger.info(

            {
                launchId: launch.id
            },

            "Published launch",

        );
    }

    /**
     * Provider abstraction.
     *
     * Mock provider returns launches from JSON.
     * API provider can later call /launches.
     */
    private async loadLaunches(): Promise<GatewayLaunch[]> {

        return this.provider.fetchLaunches();
    }
}