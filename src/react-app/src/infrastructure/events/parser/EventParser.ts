import { IncomingGatewayEvent } from "gateway-contracts";

export class EventParser {

    public parse(raw: string): IncomingGatewayEvent | null {

        try {

            return JSON.parse(raw) as IncomingGatewayEvent;

        }
        catch (error) {

            console.error("[EventParser] invalid gateway event", error);
            return null;
        }
    }
}