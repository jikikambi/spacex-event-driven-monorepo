import { PinoLogger } from 'nestjs-pino';

import { EventHandlerService } from './event-handler.service';
import { EventEnrichmentService } from './event-enrichment.service';
import { EventDeduplicationService } from './event-deduplication.service';
import { EventDispatcherService } from './event-dispatcher.service';
import { EnrichLaunchEvent, GatewayEvents, IncomingGatewayEvent, LaunchEvent } from 'gateway-contracts';

import { getLaunchFixture } from '../../../test-utils/spacex.fixtures';
import { mapLaunch, mapPayload, mapRocket, mapShip } from 'gateway-contracts';
import { Test } from '@nestjs/testing';

import { randomUUID } from 'crypto';

describe('EventHandlerService', () => {

    let service: EventHandlerService;

    let logger: jest.Mocked<PinoLogger>;

    let enrichSvc: jest.Mocked<EventEnrichmentService>;

    let dedupSvc: jest.Mocked<EventDeduplicationService>;

    let dispatcherSvc: jest.Mocked<EventDispatcherService>;

    const fixture = getLaunchFixture();    

    const launchEvent: IncomingGatewayEvent = {

        event: GatewayEvents.LAUNCH_RECEIVED,

        timestamp: new Date().toISOString(),

        source: 'test',

        eventId: randomUUID(),

        payload: {

            id: fixture.launch.id,

        },
    };

    const enrichedEvent: EnrichLaunchEvent = {

        event: GatewayEvents.ENRICH_LAUNCHED,

        timestamp: new Date().toISOString(),

        source: 'test',

        eventId: randomUUID(),

        payload: {
            launch: mapLaunch(fixture.launch),

            rocket: mapRocket(fixture.rocket),

            payloads: fixture.payloads.map(mapPayload),

            ships: fixture.ships.map(mapShip)
        },
    };

    beforeEach(async () => {

        const module = await Test.createTestingModule({

            providers: [

                EventHandlerService,                
                {

                    provide: PinoLogger,

                    useValue: {

                        setContext: jest.fn(),

                        debug: jest.fn(),

                        warn: jest.fn(),

                        error: jest.fn(),

                        info: jest.fn(),

                    }

                },
                {
                    provide: EventEnrichmentService,

                    useValue: {

                        enrich: jest.fn(),

                    }

                },
                {
                    provide: EventDeduplicationService,

                    useValue: {

                        shouldProcess: jest.fn()

                    }

                },
                {
                    provide: EventDispatcherService,

                    useValue: {

                        dispatch: jest.fn()

                    }

                }
            ]
        }).compile();

        service = module.get(EventHandlerService);

        logger = module.get(PinoLogger);

        enrichSvc = module.get(EventEnrichmentService);

        dedupSvc = module.get(EventDeduplicationService);

        dispatcherSvc = module.get(EventDispatcherService);

    });

    describe('constructor', () => {

        it('should set logger context', () => {

            expect(logger.setContext).toHaveBeenCalledWith(EventHandlerService.name);
        });

    });

    describe('handleEvent', () => {

        it('should enrich, deduplicate and dispatch a valid launch event', async () => {

            const incomingEvent: LaunchEvent = {

                event: GatewayEvents.LAUNCH_RECEIVED,

                timestamp: new Date().toISOString(),

                source: 'spacex',

                eventId: randomUUID(),

                payload: {
                    id: fixture.launch.id,
                },

            };

            enrichSvc.enrich.mockResolvedValue(enrichedEvent);

            dedupSvc.shouldProcess.mockResolvedValue(true);

            await service.handleEvent(incomingEvent);

            expect(enrichSvc.enrich).toHaveBeenCalledWith(incomingEvent);

            expect(dedupSvc.shouldProcess).toHaveBeenCalledWith(enrichedEvent);

            expect(dispatcherSvc.dispatch).toHaveBeenCalledWith(enrichedEvent);

        });

        it('should skip invalid event without processing', async () => {

            const invalidEvent = {
                timestamp: new Date().toISOString(),
                payload: undefined,
            } as unknown as IncomingGatewayEvent;

            await service.handleEvent(invalidEvent);

            expect(logger.warn).toHaveBeenCalledWith('Skipped invalid event payload', invalidEvent);

            expect(enrichSvc.enrich).not.toHaveBeenCalled();

            expect(dedupSvc.shouldProcess).not.toHaveBeenCalled();

            expect(dispatcherSvc.dispatch).not.toHaveBeenCalled();
        });

        it('should stop processing when deduplication rejects the event', async () => {

            enrichSvc.enrich.mockResolvedValue(enrichedEvent);

            dedupSvc.shouldProcess.mockResolvedValue(false);

            await service.handleEvent(launchEvent);

            expect(enrichSvc.enrich).toHaveBeenCalledWith(launchEvent);

            expect(dedupSvc.shouldProcess).toHaveBeenCalledWith(enrichedEvent);

            expect(dispatcherSvc.dispatch).not.toHaveBeenCalled();
        });

        it('should swallow enrichment errors and log failure', async () => {

            const error = new Error('enrichment failed');

            enrichSvc.enrich.mockRejectedValue(error);

            await service.handleEvent(launchEvent);

            expect(logger.error).toHaveBeenCalledWith('enrichment failed', `[Gateway] handleEvent failed for ${launchEvent.event}`);

            expect(dedupSvc.shouldProcess).not.toHaveBeenCalled();

            expect(dispatcherSvc.dispatch).not.toHaveBeenCalled();
        });

        it('should swallow deduplication errors and log failure', async () => {

            enrichSvc.enrich.mockResolvedValue(enrichedEvent);

            const error = new Error('dedup failed');

            dedupSvc.shouldProcess.mockRejectedValue(error);

            await service.handleEvent(launchEvent);

            expect(logger.error).toHaveBeenCalledWith('dedup failed', `[Gateway] handleEvent failed for ${launchEvent.event}`);
            
            expect(dispatcherSvc.dispatch).not.toHaveBeenCalled();
        });

        it('should swallow dispatch errors and log failure', async () => {

            enrichSvc.enrich.mockResolvedValue(enrichedEvent);

            dedupSvc.shouldProcess.mockResolvedValue(true);

            const error = new Error('dispatch failed');

            dispatcherSvc.dispatch.mockRejectedValue(error);

            await service.handleEvent(launchEvent);

            expect(logger.error).toHaveBeenCalledWith('dispatch failed', `[Gateway] handleEvent failed for ${launchEvent.event}`);
        });

        it('should handle non Error exceptions gracefully', async () => {

            enrichSvc.enrich.mockRejectedValue('unexpected');

            await service.handleEvent(launchEvent);

            expect(logger.error).toHaveBeenCalledWith(undefined, `[Gateway] handleEvent failed for ${launchEvent.event}`);

        });

    });

});