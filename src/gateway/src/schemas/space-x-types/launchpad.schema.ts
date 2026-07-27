import { Launchpad } from "spacex-types";
import { z } from "zod";

export const LaunchpadSchema = z.object({

    id: z.string(),

    name: z.string(),

    full_name: z.string(),

    locality: z.string(),

    region: z.string(),

    latitude: z.number(),

    longitude: z.number(),

    landing_attempts: z.number(),

    landing_successes: z.number(),

    wikipedia: z.string(),

    details: z.string(),

    rockets: z.array(z.string()),

    timezone: z.string(),

    launches: z.array(z.string()),

    status: z.string(),

    type: z.string(),

    images: z.object({

        large: z.array(z.string())

    }).optional()

}).loose().strict();

export type LaunchpadValidated = z.infer<typeof LaunchpadSchema>;

export class LaunchpadMapper {

    static toModel(model: LaunchpadValidated): Launchpad {
        return model as Launchpad;
    }
}