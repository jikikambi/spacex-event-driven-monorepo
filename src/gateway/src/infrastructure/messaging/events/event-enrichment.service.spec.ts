import { Test } from '@nestjs/testing';

import { EventEnrichmentService } from './event-enrichment.service';
import { EnrichmentService } from '../../../enrichment/enrichment.service';
import { GatewayEvents } from 'gateway-contracts';

describe('EventEnrichmentService', () => {

    let service: EventEnrichmentService;

    let enrichSvc: EnrichmentService;

    beforeEach(async () => {

        const module = await Test.createTestingModule({

            providers: [

                EventEnrichmentService,

                {
                    provide: EnrichmentService,

                    useValue: {

                        buildEnrichedLaunch: jest.fn()
                    }

                }

            ]

        }).compile();

        enrichSvc = module.get(EnrichmentService);

        service = module.get(EventEnrichmentService);

    });

    function createLaunchEvent() {

        return {

            event: GatewayEvents.LAUNCH_RECEIVED,

            timestamp: new Date().toISOString(),

            source: 'spacex-api',

            eventId: crypto.randomUUID(),

            payload: {

                id: crypto.randomUUID(),

            },

        };

    }

    describe('enrich()', () => {

        it('should enrich LAUNCH_RECEIVED events', async () => {

            const event = createLaunchEvent();

            const result = await service.enrich(event); 

            expect(enrichSvc.buildEnrichedLaunch).toHaveBeenCalledTimes(1);

            expect(result.event).toBe(GatewayEvents.ENRICH_LAUNCHED);

        });

        it('should return non-launch events unchanged', async () => {

            const event = {

                event: GatewayEvents.ROCKETS_LOADED,

                timestamp: new Date().toISOString(),

                payload: {},

            };

            const result = await service.enrich(event as any);

            expect(result).toEqual(event);

            expect(enrichSvc.buildEnrichedLaunch).not.toHaveBeenCalled();

        });

    });

});