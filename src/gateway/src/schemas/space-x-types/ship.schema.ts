import { Ship } from "spacex-types";
import { z } from "zod";

export const ShipSchema = z.object({

    id: z.string(),

    legacy_id: z.string().nullable(),

    model: z.string().nullable(),

    type: z.string().nullable(),

    roles: z.array(z.string()),

    imo: z.number().nullable(),

    mmsi: z.number().nullable(),

    abs: z.number().nullable(),

    class: z.number().nullable(),

    mass_kg: z.number().nullable(),

    mass_lbs: z.number().nullable(),

    year_built: z.number().nullable(),

    home_port: z.string().nullable(),

    status: z.string().nullable(),

    speed_kn: z.number().nullable(),

    course_deg: z.number().nullable(),

    latitude: z.number().nullable(),

    longitude: z.number().nullable(),

    link: z.string().nullable(),

    image: z.string().nullable(),

    name: z.string(),

    active: z.boolean(),

    launches: z.array(z.string()),

    last_ais_update: z.string().nullable()

}).loose().strict();

export type ShipValidated = z.infer<typeof ShipSchema>;

export class ShipMapper {

    static toModel(model: ShipValidated): Ship {
        return model as Ship;
    }
}