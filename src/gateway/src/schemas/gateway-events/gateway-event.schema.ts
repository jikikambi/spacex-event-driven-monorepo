import { z } from 'zod';
import { EnrichedGatewayLaunchSchema } from './enriched-gateway-launch-schema';
import { GatewayEvents, EnrichLaunchEvent } from 'gateway-contracts';
import { GatewayPayloadSchema, GatewayRocketSchema, GatewayShipSchema } from './gateway-payload-schemas';

const GatewayMetadataSchema = z.object({
    eventId: z.uuid().optional(),
    timestamp: z.string(),
    source: z.string().optional(),
});

// ---------------------------
// Event schemas
// ---------------------------

const LoadRocketsEventSchema = GatewayMetadataSchema.extend({

    event: z.literal(GatewayEvents.ROCKETS_LOADED),

    payload: z.array(GatewayRocketSchema)

});

const LoadShipsEventSchema = GatewayMetadataSchema.extend({

    event: z.literal(GatewayEvents.SHIPS_LOADED),

    payload: z.array(GatewayShipSchema)

});

const LoadPayloadsEventSchema = GatewayMetadataSchema.extend({

    event: z.literal(GatewayEvents.PAYLOADS_LOADED),

    payload: z.array(GatewayPayloadSchema)

});

const OtherEventSchema = GatewayMetadataSchema.extend({

    event: z.literal("OTHER_EVENT"),

    payload: z.unknown()

});

export const LaunchEventSchema = GatewayMetadataSchema.extend({

    event: z.literal(GatewayEvents.LAUNCH_RECEIVED),

    payload: z.object({

        id: z.string()

    })

});

export const EnrichLaunchEventSchema = GatewayMetadataSchema.extend({

    event: z.literal(GatewayEvents.ENRICH_LAUNCHED),

    payload: EnrichedGatewayLaunchSchema

});

export type GatewayEventValidated = z.infer<typeof EnrichLaunchEventSchema>;

export class GatewayEventMapper {

    static toDomain(event: GatewayEventValidated): EnrichLaunchEvent {

        return event as EnrichLaunchEvent;

    }
    
}