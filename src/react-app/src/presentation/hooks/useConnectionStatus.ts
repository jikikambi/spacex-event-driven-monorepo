import { useSyncExternalStore } from "react";
import { useApplication } from "../application/useApplication";
import { ConnectionHealth } from "../../infrastructure/health/ConnectionHealth";

export function useConnectionStatus(): ConnectionHealth  {

    const { health } = useApplication();

    const state = useSyncExternalStore(
        health.subscribe.bind(health),
        health.getState.bind(health)
    );

    console.log("HOOK", state);

    return state;
}