import { Payload } from "spacex-types";
import { z } from "zod";

const DragonSchema = z.object({

    capsule: z.string().nullable(),

    mass_returned_kg: z.number().nullable(),

    mass_returned_lbs: z.number().nullable(),

    flight_time_sec: z.number().nullable(),

    manifest: z.string().nullable(),

    water_landing: z.boolean().nullable(),

    land_landing: z.boolean().nullable()

});

export const PayloadSchema = z.object({

    id: z.string(),

    name: z.string(),

    type: z.string(),

    reused: z.boolean(),

    launch: z.string(),

    customers: z.array(z.string()),

    norad_ids: z.array(z.number()),

    nationalities: z.array(z.string()),

    manufacturers: z.array(z.string()),

    mass_kg: z.number().nullable(),

    mass_lbs: z.number().nullable(),

    orbit: z.string().nullable(),

    reference_system: z.string().nullable(),

    regime: z.string().nullable(),

    longitude: z.number().nullable(),

    semi_major_axis_km: z.number().nullable(),

    eccentricity: z.number().nullable(),

    periapsis_km: z.number().nullable(),

    apoapsis_km: z.number().nullable(),

    inclination_deg: z.number().nullable(),

    period_min: z.number().nullable(),

    lifespan_years: z.number().nullable(),

    epoch: z.string().nullable(),

    mean_motion: z.number().nullable(),

    raan: z.number().nullable(),

    arg_of_pericenter: z.number().nullable(),

    mean_anomaly: z.number().nullable(),

    dragon: DragonSchema

}).loose().strict();

export type PayloadValidated = z.infer<typeof PayloadSchema>;

export class PayloadMapper {

    static toModel(model: PayloadValidated): Payload {
        return model as Payload;
    }
}