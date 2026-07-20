import { createContext } from "react";
import { ApplicationContainer } from "../../app";

export const ApplicationContext = createContext<ApplicationContainer | null>(null);