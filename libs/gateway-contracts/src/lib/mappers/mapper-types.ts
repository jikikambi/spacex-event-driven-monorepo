import { Launch, Payload, Rocket, Ship } from "spacex-types";
import { GatewayLaunch, GatewayPayload, GatewayRocket, GatewayShip } from "../events/gateway-payloads";

export function mapLaunch(launch: Launch): GatewayLaunch {

    return {

        id: launch.id,

        name: launch.name,

        upcoming: launch.upcoming,

        date_utc: launch.date_utc,

        success: launch.success,

        details: launch.details,

        rocket: launch.rocket,

        payloads: [...launch.payloads],

        ships: [...launch.ships],

        links: {

            patch: {

                small: launch.links.patch.small,

                large: launch.links.patch.large,

            },

            webcast: launch.links.webcast,

            article: launch.links.article,

            wikipedia: launch.links.wikipedia,

        }

    };

}

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