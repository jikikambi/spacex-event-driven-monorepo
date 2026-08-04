import { GatewayLaunch } from "gateway-contracts";
import { z } from "zod";

export const GatewayLaunchSchema = z.object({

    id: z.string(),

    name: z.string(),

    upcoming: z.boolean(),

    date_utc: z.string(),

    success: z.boolean()?.nullable(),

    details: z.string().nullable(),

    links: z.object({

        patch: z.object({

            small: z.string().nullable(),

            large: z.string().nullable(),

        }),

        webcast: z.string().nullable(),

        article: z.string().nullable(),

        wikipedia: z.string().nullable(),

    }),

    rocket: z.string(),

    payloads: z.array(z.string()),

    ships: z.array(z.string())

}).loose();//.catchall(z.unknown());

export type GatewayLaunchValidated = z.infer<typeof GatewayLaunchSchema>;

export class GatewayLaunchMapper {

    static toDomain(event: GatewayLaunchValidated): GatewayLaunch {

        return event as GatewayLaunch;

    }
    
}