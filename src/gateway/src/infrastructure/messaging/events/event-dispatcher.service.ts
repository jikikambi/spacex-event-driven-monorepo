import { Injectable } from "@nestjs/common";
import { PinoLogger } from "nestjs-pino/PinoLogger";
import { IncomingGatewayEvent } from "gateway-contracts";
import { LaunchIdentityService } from "./launch-identity.service";
import { EventPersistenceService } from "./event-persistence.service";
import { GatewayEvents } from 'gateway-contracts';
import { EventPublisherService } from "./event-publisher.service";

@Injectable()
export class EventDispatcherService {

    constructor(private readonly logger: PinoLogger,
        private readonly identitySvc: LaunchIdentityService,
        private readonly persistSvc: EventPersistenceService,
        private readonly pubSvc: EventPublisherService) {

        this.logger.setContext(EventDispatcherService.name);
        
    }

    async dispatch(event: IncomingGatewayEvent): Promise<void> {

        if (event.event !== GatewayEvents.ENRICH_LAUNCHED) return;

        const launchId = this.identitySvc.getLaunchId(event.payload);

        if (!launchId ) {

            this.logger.warn(`Event ${event.event} missing launch id`);

            return;

        }

        await this.persistSvc.persist(event, event.payload);

        await this.pubSvc.publish(event);

    }

}