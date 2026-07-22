import { ConnectionStatus } from "../components/ConnectionStatus";
import { LaunchCard } from "../components/LaunchCard";
import { useLaunches } from "../hooks/useLaunches";

export function LaunchDashboardPage() {

  const launches = useLaunches();

  return (

    <>

      <h2 className="mb-6 text-3xl font-bold">

        Enriched Launches

      </h2>

      {
        launches.length === 0 && (

          <div className="rounded-lg border border-dashed border-gray-300 bg-white p-12 text-center">

            <h3 className="text-lg font-semibold">

              No launches available

            </h3>

            <p className="mt-2 text-gray-500">

              Waiting for launch events from the gateway...

            </p>

          </div>

        )

      }

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">

        {

          launches.map(launch => (

            <LaunchCard

              key={launch.id}

              launch={launch}

            />

          ))

        }

      </div>

    </>

  );
}