import { GatewayPayload } from "gateway-contracts";
import { PayloadViewModel } from "../PayloadViewModel";

export class PayloadViewModelMapper {

    public map(payload: GatewayPayload): PayloadViewModel {

        return {

            id: payload.id,

            name: payload.name,

            type: payload.type,

            massKg: payload.mass_kg,
        };
    }

    public mapAll(payloads: readonly GatewayPayload[]): PayloadViewModel[] {

        return payloads.map(payload => this.map(payload));
    }
}