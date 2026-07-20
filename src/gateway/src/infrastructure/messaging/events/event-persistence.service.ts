import { Injectable } from "@nestjs/common";
import { PinoLogger } from "nestjs-pino";
import { EnrichLaunchEvent } from "gateway-contracts";
import { EnrichedGatewayLaunch } from "gateway-contracts";
import { MongoService } from "../../database/mongo/mongo.service";

@Injectable()
export class EventPersistenceService {

    constructor(private readonly mongoSvc: MongoService,
        private readonly logger: PinoLogger) { }

    async persist(event: EnrichLaunchEvent, payload: EnrichedGatewayLaunch) {

        const collection = this.mongoSvc.getCollection("events");

        const result = await collection.insertOne({ ...payload, event: event.event, receivedAt: new Date() });

        this.logger.info({ insertedId: result.insertedId }, `[MongoDB] Persisted event: ${event.event}`);

        return result;
    }
}