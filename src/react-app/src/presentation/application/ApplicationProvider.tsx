import { PropsWithChildren, useMemo } from "react";
import { bootstrapApplication } from "../../app";
import { ApplicationContext } from "./ApplicationContext";

export function ApplicationProvider({ children }: PropsWithChildren) {

    /**
     * Bootstrap the application exactly once.
     */
    const container = useMemo(() => bootstrapApplication(), []);

    return (

        <ApplicationContext.Provider value={container}>

            {children}

        </ApplicationContext.Provider>

    );
    
}