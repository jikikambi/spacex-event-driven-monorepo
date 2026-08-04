import { Injectable } from "@nestjs/common";
import { EnrichedGatewayLaunch, IncomingGatewayEvent } from "gateway-contracts";

@Injectable()
export class LaunchIdentityService {

    getLaunchId(payload: EnrichedGatewayLaunch): string | undefined {

        return payload.launch?.id;

    }

    getEventId(event: IncomingGatewayEvent): string | undefined {

        return event.eventId;

    }
    
}