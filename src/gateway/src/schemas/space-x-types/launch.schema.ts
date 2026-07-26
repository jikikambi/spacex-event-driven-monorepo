import { z } from "zod";
import { Launch } from "spacex-types";

export const LaunchSchema = z.object({

    id: z.string(),

    name: z.string(),

    date_utc: z.string(),

    date_unix: z.number(),

    date_local: z.string(),

    date_precision: z.string(),

    success: z.boolean().nullable(),

    upcoming: z.boolean(),

    details: z.string().nullable(),

    rocket: z.string(),

    launchpad: z.string(),

    window: z.number().nullable(),

    net: z.boolean(),

    tbd: z.boolean(),

    auto_update: z.boolean(),

    flight_number: z.number(),

    static_fire_date_utc: z.string().nullable(),

    static_fire_date_unix: z.number().nullable(),

    fairings: z.object({

        reused: z.boolean().nullable(),

        recovery_attempt: z.boolean().nullable(),

        recovered: z.boolean().nullable(),

        ships: z.array(z.string())

    }).nullable(),

    links: z.object({

        patch: z.object({

            small: z.string().nullable(),

            large: z.string().nullable(),

        }),

        reddit: z.object({

            campaign: z.string().nullable(),

            launch: z.string().nullable(),

            media: z.string().nullable(),

            recovery: z.string().nullable(),

        }),

        flickr: z.object({

            small: z.array(z.string()),

            original: z.array(z.string()),

        }),

        presskit: z.string().nullable(),

        webcast: z.string().nullable(),

        youtube_id: z.string().nullable(),

        article: z.string().nullable(),

        wikipedia: z.string().nullable(),

    }),

    cores: z.array(

        z.object({

            core: z.string().nullable(),

            flight: z.number().nullable(),

            gridfins: z.boolean(),

            legs: z.boolean(),

            reused: z.boolean(),

            landing_attempt: z.boolean(),

            landing_success: z.boolean().nullable(),

            landing_type: z.string().nullable(),

            landpad: z.string().nullable()

        })

    ),

    ships: z.array(z.string()),

    payloads: z.array(z.string()),

    crew: z.array(z.string()),

    capsules: z.array(z.string()),

    failures: z.array(

        z.object({

            time: z.number(),

            altitude: z.number().nullable(),

            reason: z.string()

        })

    ),

}).loose();

export type LaunchValidated = z.infer<typeof LaunchSchema>;

export class LaunchMapper {

    static toModel(model: LaunchValidated): Launch {
        return model as Launch;
    }
}