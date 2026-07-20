import { LaunchViewModel } from "../../application/launches/view-models/LaunchViewModel";
import { PayloadList } from "./PayloadList";
import { RocketCard } from "./RocketCard";
import { ShipList } from "./ShipList";

interface Props {

    launch: LaunchViewModel;
    
}

export function LaunchCard({ launch }: Props) {

    return (

        <article className="rounded-lg border border-gray-200 bg-white p-6 shadow transition-shadow hover:shadow-lg">

            <header className="mb-4 flex items-start justify-between">

                <div>

                    <h3 className="text-xl font-bold">

                        {launch.missionName}

                    </h3>

                    <p className="mt-1 text-sm text-gray-500">

                        {new Date(launch.launchDate).toLocaleString()}

                    </p>

                </div>

                <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        launch.success === null
                            ? "bg-gray-200 text-gray-700"
                            : launch.success
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                    }`}
                >
                    {launch.success === null
                        ? "Unknown"
                        : launch.success
                        ? "Success"
                        : "Failure"}
                </span>

            </header>

            <RocketCard rocket={launch.rocket} />

            <PayloadList payloads={launch.payloads} />

            <ShipList ships={launch.ships} />

            {launch.details && (

                <section className="mt-4">

                    <h4 className="mb-2 font-semibold">

                        Mission Details

                    </h4>

                    <p className="text-sm text-gray-700">

                        {launch.details}

                    </p>

                </section>

            )}

        </article>

    );

}