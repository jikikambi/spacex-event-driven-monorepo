import { useContext } from "react";

import { ApplicationContext } from "./ApplicationContext";

export function useApplication() {

    const container = useContext(ApplicationContext);

    if (!container) throw new Error("useApplication must be used inside ApplicationProvider.");

    return container;
    
}