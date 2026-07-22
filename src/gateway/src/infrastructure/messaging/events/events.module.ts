import { Module } from "@nestjs/common";
import { EventHandlerService } from "./event-handler.service";
import { EventPublisherService } from "./event-publisher.service";
import { RabbitMQModule } from "../rabbitmq/rabbitmq.module";
import { EnrichmentModule } from "../../../enrichment/enrichment.module";
import { RedisModule } from "../../cache/redis/redis.module";
import { MongoModule } from "../../database/mongo/mongo.module";
import { RabbitMQConsumer } from "./rabbitmq.consumer";
import { RedisSubscriberService } from "./redis-subscriber.service";
import { EventDeduplicationService } from "./event-deduplication.service";
import { EventDispatcherService } from "./event-dispatcher.service";
import { EventEnrichmentService } from "./event-enrichment.service";
import { EventDistributionService } from "./event-distribution.service";
import { EventPersistenceService } from "./event-persistence.service";
import { LaunchIdentityService } from "./launch-identity.service";
import { SseModule } from "../../../interfaces/sse/sse.module";

@Module({
    imports:[EnrichmentModule, SseModule, RabbitMQModule, RedisModule, MongoModule ],
    providers: [EventEnrichmentService, LaunchIdentityService, EventDeduplicationService, EventDistributionService , EventPersistenceService, EventDispatcherService, EventHandlerService, EventPublisherService, RedisSubscriberService, RabbitMQConsumer],
    exports: [EventHandlerService, EventPublisherService, RedisSubscriberService, RabbitMQConsumer]
})
export class EventsModule {}