import { mapLaunch, mapPayload, mapRocket, mapShip } from "gateway-contracts";
import { getLaunchFixture } from "../../test-utils/spacex.fixtures";
import { EnrichedGatewayLaunchSchema } from "./enriched-gateway-launch-schema";

describe('EnrichedGatewayLaunchSchema', () => {

    const fixture = getLaunchFixture();

    const enriched = {

        launch: mapLaunch(fixture.launch),

        rocket: mapRocket(fixture.rocket),

        payloads: fixture.payloads.map(mapPayload),

        ships: fixture.ships.map(mapShip)
    };

    it('accepts enriched launch', () => {

        expect(EnrichedGatewayLaunchSchema.safeParse(enriched).success).toBe(true);

    });

    it('accepts null rocket', () => {

        const dto = { ...enriched, rocket: null };

        expect(EnrichedGatewayLaunchSchema.safeParse(dto).success).toBe(true);

    });

    it('rejects invalid payload collection', () => {

        const dto = {

            ...enriched,

            payloads: [{ hello: 'world' }]

        };

        expect(EnrichedGatewayLaunchSchema.safeParse(dto).success).toBe(false);

    });

});