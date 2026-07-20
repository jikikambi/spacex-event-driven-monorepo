import { Module } from "@nestjs/common";
import { SpaceXModule } from "../integrations/spacex/spacex.module";
import { EnrichmentService } from "./enrichment.service";
import { RedisModule } from "../infrastructure/database/redis/redis.module";

@Module({
    imports:[SpaceXModule, RedisModule],

    providers: [EnrichmentService],
    
    exports: [EnrichmentService]
})
export class EnrichmentModule {}