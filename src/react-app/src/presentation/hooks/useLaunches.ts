import { useSyncExternalStore } from "react";

import { LaunchViewModel } from "../../application/launches/view-models/LaunchViewModel";
import { useApplication } from "../application/useApplication";

export function useLaunches(): readonly LaunchViewModel[] {

    const { launchStore } = useApplication();

    return useSyncExternalStore(

        launchStore.subscribe.bind(launchStore),

        launchStore.getAll.bind(launchStore),

    );
}