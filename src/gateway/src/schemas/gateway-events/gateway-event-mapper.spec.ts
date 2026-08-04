import { randomUUID } from 'crypto';

import { EnrichLaunchEventSchema, GatewayEventMapper } from './gateway-event.schema';
import { getLaunchFixture } from '../../test-utils/spacex.fixtures';
import { GatewayEvents, GatewayRocket } from 'gateway-contracts';

const fixture = getLaunchFixture();

describe('GatewayEventMapper', () => {

    describe('toDomain', () => {

        it('should map a validated event to the domain model', () => {

            const event = createEvent();

            const result = GatewayEventMapper.toDomain(event);

            expect(result).toEqual(event);

            expect(result.event).toBe(GatewayEvents.ENRICH_LAUNCHED);
        });

        it('should preserve object references', () => {

            const event = createEvent();

            const result = GatewayEventMapper.toDomain(event);

            expect(result).toBe(event);

            expect(result.payload).toBe(event.payload);

            expect(result.payload.launch).toBe(event.payload.launch);

            expect(result.payload.rocket).toBe(event.payload.rocket);

            expect(result.payload.payloads).toBe(event.payload.payloads);

            expect(result.payload.ships).toBe(event.payload.ships);

        });

        it('should preserve nullable rocket', () => {

            const event = createEvent();

            event.payload.rocket = null;

            const result = GatewayEventMapper.toDomain(event);

            expect(result.payload.rocket).toBeNull();

        });

        it('should rely on schema validation before mapping', () => {

            const invalid = {

                event: GatewayEvents.ENRICH_LAUNCHED,

                payload: {}

            };

            expect(EnrichLaunchEventSchema.safeParse(invalid).success).toBe(false);

        });

    });

});

function createEvent() {

    return {

        event: GatewayEvents.ENRICH_LAUNCHED,

        eventId: randomUUID(),

        timestamp: new Date().toISOString(),

        source: 'gateway',

        payload: {

            launch: fixture.launch,

            rocket: fixture.rocket as GatewayRocket | null,

            payloads: fixture.payloads,

            ships: fixture.ships,

        }

    };

}