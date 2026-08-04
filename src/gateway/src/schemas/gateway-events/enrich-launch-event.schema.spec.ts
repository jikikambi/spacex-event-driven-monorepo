import { GatewayEvents, mapLaunch, mapPayload, mapRocket, mapShip } from "gateway-contracts";
import { getLaunchFixture } from "../../test-utils/spacex.fixtures";
import { EnrichLaunchEventSchema } from "./gateway-event.schema";

describe('EnrichLaunchEventSchema', () => {

    const fixture = getLaunchFixture();

    const enriched = {

        launch: mapLaunch(fixture.launch),

        rocket: mapRocket(fixture.rocket),

        payloads: fixture.payloads.map(mapPayload),

        ships: fixture.ships.map(mapShip)
    };

    it('accepts valid event', () => {

        const event = {

            event: GatewayEvents.ENRICH_LAUNCHED,

            eventId: crypto.randomUUID(),

            timestamp: new Date().toISOString(),

            source: 'gateway',

            payload: enriched

        };

        expect(EnrichLaunchEventSchema.safeParse(event).success).toBe(true);

    });

    it('rejects invalid event type', () => {

        const event = {

            event: "LAUNCH",

            timestamp: new Date().toISOString(),

            payload: enriched

        };

        expect(EnrichLaunchEventSchema.safeParse(event).success).toBe(false);

    });

    it('rejects invalid payload', () => {

        const event = {

            event: GatewayEvents.ENRICH_LAUNCHED,

            timestamp: new Date().toISOString(),

            payload: {

                hello: "world"

            }

        };

        expect(EnrichLaunchEventSchema.safeParse(event).success).toBe(false);

    });

});