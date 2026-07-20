import { Payload, Rocket, Ship } from "spacex-types";
import { GatewayPayload, GatewayRocket, GatewayShip } from "../events/gateway-payloads";

export function mapRocket(rocket: Rocket | null): GatewayRocket | null {

    if (!rocket) {
        return null;
    }

    return {

        id: rocket.id,
        name: rocket.name,
        type: rocket.type,
        first_flight: rocket.first_flight,
        mass: {
            kg: rocket.mass.kg,
            lb: rocket.mass.lb
        }
    
    };
}

export function mapPayload(payload: Payload): GatewayPayload {

    return {

        id: payload.id,
        type: payload.type,
        name: payload.name,
        mass_kg: payload.mass_kg
    };
}

export function mapShip(ship: Ship): GatewayShip {

    return {

        id: ship.id,
        name: ship.name,
        mass_kg: ship.mass_kg
    };
}

