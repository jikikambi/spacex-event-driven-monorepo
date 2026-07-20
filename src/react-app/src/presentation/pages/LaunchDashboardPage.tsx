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
        !launches.length && (

          <p className="text-gray-500">

            Waiting for launch events...

          </p>

        )}

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">

        {launches.map(launch => (

          <LaunchCard

            key={launch.id}

            launch={launch}

          />

        ))}

      </div>

    </>

  );
}