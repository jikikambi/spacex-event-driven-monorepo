import { Inject, Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { RedisService } from '../infrastructure/database/redis/redis.service';
import { EnrichedGatewayLaunch, mapRocket, mapPayload, mapShip } from 'gateway-contracts';
import { SPACEX_PROVIDER_TOKEN } from '../common/constants/spacex.constants';
import { ISpaceXProvider } from '../integrations/spacex/spacex.provider';

@Injectable()
export class EnrichmentService {

    constructor(private readonly logger: PinoLogger,
        private readonly redisSvc: RedisService,
        @Inject(SPACEX_PROVIDER_TOKEN) private readonly provider: ISpaceXProvider) {

        this.logger.setContext(EnrichmentService.name)
    }

    async buildEnrichedLaunch(id: string): Promise<EnrichedGatewayLaunch> {

        const cacheKey = `enrichedLaunch:${id}`;

        const cached = await this.redisSvc.get(cacheKey);

        if (cached) {

            this.logger.debug({ cacheKey }, 'Returning enriched launch from Redis.');

            return JSON.parse(cached) as EnrichedGatewayLaunch;
        }

        const launch = await this.provider.fetchLaunch(id);

        const [rocket, payloads, ships] = await Promise.all([

            this.provider.fetchRocket(launch.rocket),

            this.provider.fetchPayloads(launch.payloads ?? []),

            this.provider.fetchShips(launch.ships ?? [])
        ]);

        const enriched: EnrichedGatewayLaunch =
        {
            launch: launch,
            rocket: mapRocket(rocket),
            payloads: payloads.map(mapPayload),
            ships: ships.map(mapShip)
        };

        console.log("--- EnrichmentService ---", enriched)

        await this.redisSvc.set(cacheKey, JSON.stringify(enriched), 300);

        this.logger.debug({ cacheKey }, 'Cached enriched launch.');

        return enriched;
    }
}