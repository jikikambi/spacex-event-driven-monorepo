import { RocketViewModel } from "../../application/launches/view-models/RocketViewModel";

interface Props {

    rocket: RocketViewModel | null;

}

export function RocketCard({ rocket }: Props) {

    if (!rocket) {

        return null;

    }

    return (

        <section className="mb-5">

            <h4 className="mb-2 font-semibold">

                Rocket

            </h4>

            <div className="flex flex-wrap gap-2">

                <span className="rounded bg-blue-100 px-2 py-1 text-sm text-blue-800">

                    {rocket.name}

                </span>

                <span className="rounded bg-indigo-100 px-2 py-1 text-sm text-indigo-800">

                    {rocket.type}

                </span>

                <span className="rounded bg-yellow-100 px-2 py-1 text-sm text-yellow-800">

                    First Flight {rocket.firstFlight}

                </span>

                <span className="rounded bg-purple-100 px-2 py-1 text-sm text-purple-800">

                    {rocket.massKg} kg

                </span>

            </div>

        </section>

    );

}