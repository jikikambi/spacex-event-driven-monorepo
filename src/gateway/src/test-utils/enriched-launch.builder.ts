import { cloneDeep } from 'lodash';

import { randomUUID } from 'crypto';
import { getLaunchFixture } from './spacex.fixtures';
import { EnrichLaunchEvent, GatewayEvents } from 'gateway-contracts';

export class EnrichedLaunchBuilder {

    private readonly fixture = cloneDeep(getLaunchFixture());

    buildPayload() {

        return {

            launch: cloneDeep(this.fixture.launch),

            rocket: cloneDeep(this.fixture.rocket),

            payloads: cloneDeep(this.fixture.payloads),

            ships: cloneDeep(this.fixture.ships)

        };

    }

    private source = 'gateway';

    withSource(source: string): this {

        this.source = source;

        return this;
        
    }

    buildEvent(): EnrichLaunchEvent {

        return {

            event: GatewayEvents.ENRICH_LAUNCHED,

            eventId: randomUUID(),

            timestamp: new Date().toISOString(),

            source: this.source,

            payload: this.buildPayload()

        };

    }
    
}