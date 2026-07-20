import { GatewayRocket } from "gateway-contracts";
import { RocketViewModel } from "../RocketViewModel";

export class RocketViewModelMapper {

    public map(rocket: GatewayRocket | null | undefined): RocketViewModel | null {

        if (!rocket) return null;

        return {

            name: rocket.name,

            type: rocket.type,

            firstFlight: rocket.first_flight,

            massKg: rocket.mass.kg,
        };
    }
}