import { LaunchIdentityService } from './launch-identity.service';

import { EnrichedGatewayLaunch, mapLaunch } from 'gateway-contracts';
import { getLaunchFixture } from '../../../test-utils/spacex.fixtures';

describe('LaunchIdentityService', () => {

    let service: LaunchIdentityService;

    let enrichedLaunch: EnrichedGatewayLaunch;

    beforeEach(() => {

        service = new LaunchIdentityService();

        const fixture = getLaunchFixture();

        enrichedLaunch = {

            launch: mapLaunch(fixture.launch),

            rocket: fixture.rocket,

            payloads: fixture.payloads,

            ships: fixture.ships

        };

    });

    describe('getLaunchId', () => {

        it('should return the launch id', () => {

            expect(service.getLaunchId(enrichedLaunch)).toBe(enrichedLaunch.launch.id);

        });

        it('should preserve the launch id exactly', () => {

            expect(service.getLaunchId(enrichedLaunch)).toBe(enrichedLaunch.launch.id);

        });

        it('should return undefined when launch id is missing', () => {

            const payload = {

                ...enrichedLaunch,

                launch: {

                    ...enrichedLaunch.launch,

                    id: undefined as unknown as string,

                },

            };

            expect(service.getLaunchId(payload)).toBeUndefined();

        });

        it('should return the same id for identical payloads', () => {

            expect(service.getLaunchId(enrichedLaunch)).toBe(service.getLaunchId(enrichedLaunch));

        });

    });

});