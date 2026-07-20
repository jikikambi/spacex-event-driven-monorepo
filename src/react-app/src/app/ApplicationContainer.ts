import { LaunchRepository } from "../application/launches/LaunchRepository";
import { LaunchStore } from "../application/launches/LaunchStore";
import { LaunchViewModelMapper } from "../application/launches/view-models/mappers/LaunchViewModelMapper";
import { PayloadViewModelMapper } from "../application/launches/view-models/mappers/PayloadViewModelMapper";
import { RocketViewModelMapper } from "../application/launches/view-models/mappers/RocketViewModelMapper";
import { ShipViewModelMapper } from "../application/launches/view-models/mappers/ShipViewModelMapper";
import { ConfigService } from "../config";
import { EventModule } from "./events/EventModule";

export class ApplicationContainer {

     public readonly config = new ConfigService();

     public readonly eventModule = new EventModule(this.config);

     public readonly launchRepo = new LaunchRepository(this.eventModule.client);

     public readonly lvmMapper = new LaunchViewModelMapper(new RocketViewModelMapper(),
          new PayloadViewModelMapper(), new ShipViewModelMapper());

     public readonly launchStore = new LaunchStore(this.launchRepo, this.lvmMapper);

     public start(): void {

          this.eventModule.client.start();

          this.launchRepo.start();

     }

     public stop(): void {

          this.launchRepo.stop();

          this.eventModule.client.stop();

     }

}