import { Inject, Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { RedisService } from '../infrastructure/datastore/redis/redis.service';
import { EnrichedGatewayLaunch, mapRocket, mapPayload, mapShip } from 'gateway-contracts';
import { SPACEX_PROVIDER_TOKEN } from '../common/constants/spacex.constants';
import { ISpaceXProvider } from '../infrastructure/external/spacex/spacex.provider';
import { EnrichedGatewayLaunchMapper, EnrichedGatewayLaunchSchema } from '../schemas';

@Injectable()
export class EnrichmentService {

    constructor(private readonly logger: PinoLogger,
        private readonly redisSvc: RedisService,
        @Inject(SPACEX_PROVIDER_TOKEN) private readonly provider: ISpaceXProvider) {

        this.logger.setContext(EnrichmentService.name);

    }

    async buildEnrichedLaunch(id: string): Promise<EnrichedGatewayLaunch> {

        const cacheKey = `enrichedLaunch:${id}`;

        const cached = await this.redisSvc.get(cacheKey);

        if (cached) {

            const cachedLaunch = this.validateCachedLaunch(cacheKey, cached);

            if (cachedLaunch) {

                this.logger.debug({ cacheKey }, "Returning enriched launch from Redis.");

                return cachedLaunch;
            }
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

        await this.redisSvc.set(cacheKey, JSON.stringify(enriched), 300);

        this.logger.debug({ cacheKey }, 'Cached enriched launch.');

        return enriched;

    }

    private validateCachedLaunch(cacheKey: string, json: string): EnrichedGatewayLaunch | null {

        try {

            const raw = JSON.parse(json);

            const result = EnrichedGatewayLaunchSchema.safeParse(raw);

            if (!result.success) {

                this.logger.warn(

                    {
                        cacheKey,

                        issues: result.error.issues

                    }, 
                    
                    "Invalid cached enriched launch. Cache entry will be ignored.");

                // Fire-and-forget.
                void this.redisSvc.delete(cacheKey);

                return null;
            }

            // Boundary crossed.
            return EnrichedGatewayLaunchMapper.toDomain(result.data);

        }
        catch (error) {

            this.logger.warn(

                {
                    cacheKey,

                    error

                }, 
                
                "Corrupted cached enriched launch.");

            void this.redisSvc.delete(cacheKey);

            return null;
        }

    }

}