import { mapLaunch } from "gateway-contracts";
import { getLaunchFixture, mockLaunches } from "../../test-utils/spacex.fixtures";
import { GatewayLaunchSchema } from "./gateway-launch-schema";

describe('GatewayLaunchSchema', () => {

    const fixture = getLaunchFixture();

    const gatewayLaunch = mapLaunch(fixture.launch);

    it('accepts mapped launch', () => {

        const result = GatewayLaunchSchema.safeParse(gatewayLaunch);

        expect(result.success).toBe(true);

    });

    it('all mapped launches satisfy GatewayLaunchSchema', () => {

        for (const launch of mockLaunches) {

            const mapped = mapLaunch(launch);

            expect(GatewayLaunchSchema.safeParse(mapped).success).toBe(true);

        }
    });

    it('rejects missing id', () => {

        const invalid = {

            ...gatewayLaunch,

            id: undefined

        };

        expect(GatewayLaunchSchema.safeParse(invalid).success).toBe(false);

    });

    it('rejects invalid payload ids', () => {

        const invalid = {

            ...gatewayLaunch,

            payloads: [123]

        };

        expect(GatewayLaunchSchema.safeParse(invalid).success).toBe(false);

    });

});