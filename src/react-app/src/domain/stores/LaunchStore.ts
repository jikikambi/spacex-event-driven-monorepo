import { Launch, Payload, Rocket, Ship } from "gateway-contracts";

export interface LaunchState {

    loading: boolean;

    launch?: Launch;

    rocket?: Rocket;

    payloads: Payload[];

    ships: Ship[];

    error?: string;
}