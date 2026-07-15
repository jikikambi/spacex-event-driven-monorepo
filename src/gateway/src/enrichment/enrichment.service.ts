import { Inject, Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { RedisService } from '../infrastructure/database/redis/redis.service';
import { EnrichedLaunchPayload } from 'gateway-contracts';
import { SPACEX_PROVIDER_TOKEN } from '../common/constants/spacex.constants';
import { ISpaceXProvider } from '../integrations/spacex/spacex.provider';

@Injectable()
export class EnrichmentService {

    constructor(private readonly logger: PinoLogger,
        private readonly redisService: RedisService,
        @Inject(SPACEX_PROVIDER_TOKEN) private readonly provider: ISpaceXProvider) {
        this.logger.setContext(EnrichmentService.name)
    }

    async enrichLaunchWithCache(payload: { id: string } | EnrichedLaunchPayload): Promise<EnrichedLaunchPayload> {

        if ('launch' in payload) return payload;

        const cacheKey = `enrichedLaunch:${payload.id}`;

        const cached = await this.redisService.get(cacheKey);

        if (cached) {
            this.logger.debug({ cacheKey }, 'Returning enriched launch from Redis.');

            return JSON.parse(cached) as EnrichedLaunchPayload;
        }

        const launch = await this.provider.fetchLaunch(payload.id);

        const [rocket, payloads, ships] = await Promise.all([
            this.provider.fetchRocket(launch.rocket),
            this.provider.fetchPayloads(launch.payloads ?? []),
            this.provider.fetchShips(launch.ships ?? []),
        ]);

        const enriched: EnrichedLaunchPayload = { launch, rocket, payloads, ships };

        await this.redisService.set(cacheKey, JSON.stringify(enriched), 300);

        this.logger.debug({ cacheKey }, 'Cached enriched launch.');

        return enriched;
    }
}