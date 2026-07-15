import { Launch, Launchpad, Payload, Rocket, Ship } from "spacex-types";


export interface ISpaceXProvider {

    fetchLaunch(id: string): Promise<Launch>;

    fetchRocket(id: string): Promise<Rocket | null>;

    fetchPayloads(ids: string[]): Promise<Payload[]>;

    fetchShips(ids: string[]): Promise<Ship[]>;

    fetchLaunchpad(id: string): Promise<Launchpad | null>;
}