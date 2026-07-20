import { ApplicationContainer } from "./ApplicationContainer";

export function bootstrapApplication(): ApplicationContainer {

    const container = new ApplicationContainer();

    container.start();

    return container;

}