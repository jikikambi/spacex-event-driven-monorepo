import { mapRocket } from "gateway-contracts";
import { getLaunchFixture } from "../../test-utils/spacex.fixtures";
import { GatewayRocketSchema } from "./gateway-payload-schemas";

describe('GatewayRocketSchema', () => {

    const fixture = getLaunchFixture();

    const rocket = mapRocket(fixture.rocket);

    it('accepts mapped rocket', () => {

        const result = GatewayRocketSchema.safeParse(fixture.rocket);

        expect(result.success).toBe(true);

    });

    it('rejects invalid mass', () => {

        const invalid = {

            ...rocket,

            mass: { kg: 'abc', lb: 123 }

        };

        expect(GatewayRocketSchema.safeParse(invalid).success).toBe(false);

    });

});