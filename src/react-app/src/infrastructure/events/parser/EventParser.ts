import { GatewayEvent } from "gateway-contracts";

export class EventParser {

    public parse(raw: string): GatewayEvent | null {

        try {

            return JSON.parse(raw) as GatewayEvent;

        }
        catch (error) {

            console.error("[EventParser] invalid gateway event", error);
            return null;
        }
    }
}