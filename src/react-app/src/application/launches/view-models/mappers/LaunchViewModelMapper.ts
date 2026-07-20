import { EnrichedGatewayLaunch } from "gateway-contracts";
import { LaunchViewModel } from "../LaunchViewModel";
import { PayloadViewModelMapper } from "./PayloadViewModelMapper";
import { RocketViewModelMapper } from "./RocketViewModelMapper";
import { ShipViewModelMapper } from "./ShipViewModelMapper";

export class LaunchViewModelMapper {

    constructor(private readonly rocketMapper: RocketViewModelMapper,
        private readonly payloadMapper: PayloadViewModelMapper,
        private readonly shipMapper: ShipViewModelMapper) { }

    public map(launch: EnrichedGatewayLaunch): LaunchViewModel {

        return {

            id: launch.launch.id,

            missionName: launch.launch.name,

            launchDate: launch.launch.date_utc,

            success: launch.launch.success,

            upcoming: launch.launch.upcoming,

            details: launch.launch.details,

            rocket: this.rocketMapper.map(launch.rocket),

            payloads: this.payloadMapper.mapAll(launch.payloads),

            ships: this.shipMapper.mapAll(launch.ships),

            patchImageUrl:
                launch.launch.links.patch.small ??
                launch.launch.links.patch.large,

            webcastUrl: launch.launch.links.webcast,

            articleUrl: launch.launch.links.article,

            wikipediaUrl: launch.launch.links.wikipedia,
        };
    }

    public mapAll(launches: readonly EnrichedGatewayLaunch[]): LaunchViewModel[] {

        return launches.map(launch => this.map(launch));
    }
}