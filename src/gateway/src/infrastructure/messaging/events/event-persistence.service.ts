import { Injectable } from "@nestjs/common";
import { PinoLogger } from "nestjs-pino";
import { EnrichLaunchEvent, GatewayEventBase } from "gateway-contracts";
import { EnrichedLaunchPayload } from "gateway-contracts";
import { MongoService } from "../../database/mongo/mongo.service";

@Injectable()
export class EventPersistenceService {

    constructor(private readonly mongoSvc: MongoService,
        private readonly logger: PinoLogger) { }

    // async persist(event: GatewayEventBase, payload: EnrichedLaunchPayload) {
    async persist(event: EnrichLaunchEvent, payload: EnrichedLaunchPayload) {

        const collection = this.mongoSvc.getCollection("events");

        const result = await collection.insertOne({ ...payload, event: event.event, receivedAt: new Date() });

        this.logger.info({ insertedId: result.insertedId }, `[MongoDB] Persisted event: ${event.event}`);

        return result;
    }
}