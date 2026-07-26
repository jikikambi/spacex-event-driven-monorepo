import { z } from "zod";
import { GatewayLaunchSchema} from "./gateway-launch-schema";

import { GatewayRocketSchema, GatewayShipSchema, GatewayPayloadSchema} from "./gateway-payload-schemas";
import { EnrichedGatewayLaunch } from "gateway-contracts";

export const EnrichedGatewayLaunchSchema = z.object({

    launch: GatewayLaunchSchema,

    rocket: GatewayRocketSchema.nullable(),

    payloads: z.array( GatewayPayloadSchema ),

    ships: z.array( GatewayShipSchema )
}).loose();

export type EnrichedGatewayLaunchValidated = z.infer<typeof EnrichedGatewayLaunchSchema>;

export class EnrichedGatewayLaunchMapper {

    static toDomain(event: EnrichedGatewayLaunchValidated): EnrichedGatewayLaunch {

        return event as EnrichedGatewayLaunch;
    }
}