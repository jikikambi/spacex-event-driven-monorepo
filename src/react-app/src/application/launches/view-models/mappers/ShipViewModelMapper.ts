import { GatewayShip } from "gateway-contracts";
import { ShipViewModel } from "../ShipViewModel";

export class ShipViewModelMapper {

    public map(ship: GatewayShip): ShipViewModel {

        return {

            id: ship.id,

            name: ship.name,

            massKg: ship.mass_kg,
        };

    }

    public mapAll(ships: readonly GatewayShip[]): ShipViewModel[] {

        return ships.map(ship => this.map(ship));

    }
    
}