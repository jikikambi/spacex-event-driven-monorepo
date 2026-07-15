import { Injectable } from "@nestjs/common";
import { EnrichedLaunchPayload } from "gateway-contracts";

@Injectable()
export class LaunchIdentityService {

    getIdentity(payload: EnrichedLaunchPayload) {

        const launchId = payload.launch?.id;

        return {
            launchId,
            dedupKey: `event:${launchId}`
        };
    }
}