import { mapShip } from "gateway-contracts";
import { getLaunchFixture } from "../../test-utils/spacex.fixtures";
import { GatewayShipSchema } from "./gateway-payload-schemas";

describe('GatewayShipSchema', () => {

    const fixture = getLaunchFixture();

    const mappedShip = mapShip(fixture.ships[0]);

    it('accepts every ship', () => {

        fixture.ships.forEach(ship => {

            expect(GatewayShipSchema.safeParse(ship).success).toBe(true);

        });

    });

    it('allows null mass', () => {

        const ship = {

            ...mappedShip,

            mass_kg: null

        };

        expect(GatewayShipSchema.safeParse(ship).success).toBe(true);

    });

});