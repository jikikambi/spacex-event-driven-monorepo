import { GatewayPayload, GatewayRocket, GatewayShip } from 'gateway-contracts';
import { z } from 'zod';


export const GatewayRocketSchema = z.object({

    id: z.string(),

    name: z.string(),

    type: z.string(),

    first_flight: z.string(),

    mass: z.object({

        kg: z.number(),

        lb: z.number()
    }),

}).loose();//.catchall(z.unknown());

export type GatewayRocketValidated = z.infer<typeof GatewayRocketSchema>;

export const GatewayShipSchema = z.object({

    id: z.string(),

    name: z.string(),

    mass_kg: z.number().nullable()

}).loose();//.catchall(z.unknown());

export type GatewayShipValidated = z.infer<typeof GatewayShipSchema>;

export const GatewayPayloadSchema = z.object({

    id: z.string(),

    type: z.string(),

    name: z.string(),

    mass_kg: z.number().nullable(),

}).loose();//.catchall(z.unknown());

export type GatewayPayloadValidated = z.infer<typeof GatewayPayloadSchema>;

