import { Test } from '@nestjs/testing';
import { PinoLogger } from 'nestjs-pino';

import { EventDispatcherService } from './event-dispatcher.service';
import { LaunchIdentityService } from './launch-identity.service';
import { EventPersistenceService } from './event-persistence.service';
import { getLaunchFixture } from '../../../test-utils/spacex.fixtures';
import { GatewayEvents } from 'gateway-contracts';
import { EnrichedLaunchBuilder } from '../../../test-utils/enriched-launch.builder';
import { EventPublisherService } from './event-publisher.service';

describe('EventDispatcherService', () => {

    let service: EventDispatcherService;

    let identitySvc: jest.Mocked<LaunchIdentityService>;

    let persistSvc: jest.Mocked<EventPersistenceService>;

    let pubSvc: jest.Mocked<EventPublisherService>;

    let logger: jest.Mocked<PinoLogger>;

    const fixture = getLaunchFixture();

    beforeEach(async () => {

        const module = await Test.createTestingModule({

            providers: [

                EventDispatcherService,

                {
                    provide: LaunchIdentityService,

                    useValue: {

                        getLaunchId: jest.fn(),
                        
                        getEventId: jest.fn()

                    }
                },

                {
                    provide: EventPersistenceService,

                    useValue: {

                        persist: jest.fn()

                    }
                },

                {
                    provide: EventPublisherService,

                    useValue: {

                        publish: jest.fn()

                    }

                },

                {
                    provide: PinoLogger,

                    useValue: {

                        setContext: jest.fn(),

                        info: jest.fn(),

                        warn: jest.fn(),

                        error: jest.fn(),

                        debug: jest.fn()

                    }

                }

            ]

        }).compile();

        service = module.get(EventDispatcherService);

        identitySvc = module.get(LaunchIdentityService);

        persistSvc = module.get(EventPersistenceService);

        pubSvc = module.get(EventPublisherService);

        logger = module.get(PinoLogger);

    });

    describe('dispatch()', () => {

        it('ignores unsupported gateway events', async () => {

            const event = {

                ...new EnrichedLaunchBuilder().buildEvent(),

                event: GatewayEvents.ROCKETS_LOADED

            };

            await service.dispatch(event as any);

            expect(identitySvc.getLaunchId).not.toHaveBeenCalled();

            expect(persistSvc.persist).not.toHaveBeenCalled();

            expect(pubSvc.publish).not.toHaveBeenCalled();

        });



        it('logs warning when launch id cannot be resolved', async () => {

            identitySvc.getLaunchId.mockReturnValue(undefined);

            await service.dispatch(new EnrichedLaunchBuilder().buildEvent());

            expect(logger.warn).toHaveBeenCalledWith(

                expect.stringContaining('missing launch id')

            );

            expect(persistSvc.persist).not.toHaveBeenCalled();

            expect(pubSvc.publish).not.toHaveBeenCalled();

        });

        it('persists event before distributing it', async () => {

            identitySvc.getLaunchId.mockReturnValue(fixture.launch.id);

            const callOrder: string[] = [];

            persistSvc.persist.mockImplementation(async () => {

                callOrder.push('persist');

                return {} as any;

            });

            pubSvc.publish.mockImplementation(async () => {

                callOrder.push('publish');

            });

            await service.dispatch(new EnrichedLaunchBuilder().buildEvent());

            expect(callOrder).toEqual(['persist', 'publish']);

        });

        it('persists the original event payload', async () => {

            const gwEvent = new EnrichedLaunchBuilder().buildEvent();

            identitySvc.getLaunchId.mockReturnValue(fixture.launch.id);

            await service.dispatch(gwEvent);

            expect(persistSvc.persist).toHaveBeenCalledWith(gwEvent, gwEvent.payload);

        });

        it('publishs using resolved launch identity', async () => {

            const event = new EnrichedLaunchBuilder().buildEvent();

            const dedupKey = `event:${fixture.launch.id}`;

            identitySvc.getLaunchId.mockReturnValue(fixture.launch.id);

            await service.dispatch(event);

            expect(pubSvc.publish).toHaveBeenCalledWith(event);

        });

        it('calls LaunchIdentityService with the event payload', async () => {

            identitySvc.getLaunchId.mockReturnValue(fixture.launch.id);

            await service.dispatch(new EnrichedLaunchBuilder().buildEvent());

            expect(identitySvc.getLaunchId).toHaveBeenCalledWith(new EnrichedLaunchBuilder().buildEvent().payload);

        });

        it('does not publish when persistence throws', async () => {

            identitySvc.getLaunchId.mockReturnValue(fixture.launch.id);

            persistSvc.persist.mockRejectedValue(new Error('Mongo unavailable'));

            await expect(service.dispatch(new EnrichedLaunchBuilder().buildEvent())).rejects.toThrow('Mongo unavailable');

            expect(pubSvc.publish).not.toHaveBeenCalled();

        });

        it('propagates distribution errors after persistence succeeds', async () => {

            identitySvc.getLaunchId.mockReturnValue(fixture.launch.id);

            pubSvc.publish.mockRejectedValue(new Error('Redis unavailable'));

            await expect(service.dispatch(new EnrichedLaunchBuilder().buildEvent())).rejects.toThrow('Redis unavailable');

            expect(persistSvc.persist).toHaveBeenCalled();

        });

        it('propagates distribution errors after persistence succeeds', async () => {

            identitySvc.getLaunchId.mockReturnValue(fixture.launch.id);

            pubSvc.publish.mockRejectedValue(new Error('Redis unavailable'));

            await expect(service.dispatch(new EnrichedLaunchBuilder().buildEvent())).rejects.toThrow('Redis unavailable');

            expect(persistSvc.persist).toHaveBeenCalled();

        });

    });

});