import { Module } from "@nestjs/common";
import { EnrichmentService } from "./enrichment.service";
import { RedisModule } from "../infrastructure/datastore/redis/redis.module";
import { SpaceXModule } from "../infrastructure/external/spacex/spacex.module";

@Module({
    imports:[SpaceXModule, RedisModule],

    providers: [EnrichmentService],
    
    exports: [EnrichmentService]
})
export class EnrichmentModule {}