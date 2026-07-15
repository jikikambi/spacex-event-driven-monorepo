import { Injectable } from "@nestjs/common";
import { PinoLogger } from "nestjs-pino/PinoLogger";
import { GatewayEventBase, EnrichLaunchEvent, GatewayEvent, GatewayEventType } from "gateway-contracts";
import { LaunchIdentityService } from "./launch-identity.service";
import { EventPersistenceService } from "./event-persistence.service";
import { EventDistributionService } from "./event-distribution.service";

@Injectable()
export class EventDispatcherService {

    constructor(private readonly logger: PinoLogger,
        private readonly identitySvc: LaunchIdentityService,
        private readonly persistSvc: EventPersistenceService,
        private readonly eventSvc: EventDistributionService) {
        this.logger.setContext(EventDispatcherService.name);
    }

    // async dispatch<T extends GatewayEventType>(event: GatewayEventBase<T> | EnrichLaunchEvent): Promise<void> {
    async dispatch(event: GatewayEvent): Promise<void> {

        if (event.event !== "ENRICH_LAUNCH") return;

        const { launchId, dedupKey } = this.identitySvc.getIdentity(event.payload);

        if (!launchId) {
            this.logger.warn(`Event ${event.event} missing launch id`);
            return;
        }

        await this.persistSvc.persist(event, event.payload);

        await this.eventSvc.distribute(launchId, dedupKey, event);
    }
}