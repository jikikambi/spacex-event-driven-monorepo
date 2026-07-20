import { ShipViewModel } from "../../application/launches/view-models/ShipViewModel";

interface Props {

    ships: readonly ShipViewModel[];

}

export function ShipList({ ships }: Props) {

    if (!ships.length) {

        return null;

    }

    return (

        <section>

            <h4 className="mb-2 font-semibold">

                Ships

            </h4>

            <ul className="space-y-2">

                {ships.map(ship => (

                    <li key={ship.id}
                        className="flex items-center justify-between rounded border border-gray-200 px-3 py-2">

                        <span>

                            {ship.name}

                        </span>

                        <span className="rounded bg-indigo-100 px-2 py-1 text-xs text-indigo-800">

                            {ship.massKg ?? "N/A"} kg

                        </span>

                    </li>

                ))}

            </ul>

        </section>

    );

}