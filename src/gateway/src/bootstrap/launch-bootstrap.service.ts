import { Injectable, Inject, OnApplicationBootstrap } from "@nestjs/common";
import { PinoLogger } from "nestjs-pino";
import { SPACEX_PROVIDER_TOKEN } from "../common/constants/spacex.constants";
import { RabbitMQService } from "../infrastructure/messaging/rabbitmq/rabbitmq.service";
import { GatewayEvent, GatewayLaunch } from "gateway-contracts";
import { ISpaceXProvider } from "../infrastructure/external/spacex/spacex.provider";

@Injectable()
export class LaunchBootstrapService implements OnApplicationBootstrap {

    constructor(@Inject(SPACEX_PROVIDER_TOKEN) private readonly provider: ISpaceXProvider,
        private readonly rabbitSvc: RabbitMQService,
        private readonly logger: PinoLogger,
    ) {

        this.logger.setContext(LaunchBootstrapService.name);
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

        const event: GatewayEvent = {

            event: "LAUNCH_RECEIVED",

            eventId: crypto.randomUUID(),

            timestamp: new Date().toISOString(),

            source: "gateway",

            payload: {

                id: launch.id
            }
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