import { Injectable } from "@nestjs/common";
import { EnrichedGatewayLaunch } from "gateway-contracts";

@Injectable()
export class LaunchIdentityService {

    getIdentity(payload: EnrichedGatewayLaunch) {

        const launchId = payload.launch?.id;

        return {
            
            launchId,
            dedupKey: `event:${launchId}`
        };
    }
}