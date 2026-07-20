import { useSyncExternalStore } from "react";

import { LaunchViewModel } from "../../application/launches/view-models/LaunchViewModel";
import { useApplication } from "../application/useApplication";

export function useLaunch(id: string): LaunchViewModel | undefined {

    const { launchStore } = useApplication();

    useSyncExternalStore(

        launchStore.subscribe.bind(launchStore),

        launchStore.getAll.bind(launchStore),

    );

    return launchStore.get(id);
}