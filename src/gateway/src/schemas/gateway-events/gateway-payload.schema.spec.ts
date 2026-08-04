import { mapPayload } from "gateway-contracts";
import { getLaunchFixture } from "../../test-utils/spacex.fixtures";
import { GatewayPayloadSchema } from "./gateway-payload-schemas";

describe('GatewayPayloadSchema', () => {

    const fixture = getLaunchFixture();

    const payload = mapPayload(fixture.payloads[0]);

    it('accepts every payload', () => {

        fixture.payloads.forEach(payload => {

            expect(GatewayPayloadSchema.safeParse(payload).success).toBe(true);

        });

    });

    it('rejects invalid mass', () => {

        const invalid = {

            ...payload,

            mass_kg: "100"

        };

        expect(GatewayPayloadSchema.safeParse(invalid).success).toBe(false);

    });

});