import { PayloadViewModel } from "./PayloadViewModel";
import { RocketViewModel } from "./RocketViewModel";
import { ShipViewModel } from "./ShipViewModel";

export interface LaunchViewModel {

    readonly id: string;

    readonly missionName: string;

    readonly launchDate: Date  | string ;

    readonly success: boolean | null ;

    readonly upcoming: boolean ;

    readonly details: string | null ;

    readonly rocket: RocketViewModel | null;

    readonly payloads: readonly PayloadViewModel[];

    readonly ships: readonly ShipViewModel[];

    readonly patchImageUrl: string | null ;

    readonly webcastUrl: string | null ;

    readonly articleUrl: string | null ;

    readonly wikipediaUrl: string | null ;

}