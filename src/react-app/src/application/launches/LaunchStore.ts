
import { LaunchRepository } from "./LaunchRepository";
import { LaunchViewModelMapper } from "./view-models/mappers/LaunchViewModelMapper";
import { LaunchViewModel } from "./view-models/LaunchViewModel";
import { EventListener } from "../../infrastructure/events/types/EventListener";

export class LaunchStore {

    private readonly listeners = new Set<EventListener>();

    private unsubscribeRepository?: () => void;

    private launches: readonly LaunchViewModel[] = [];

    constructor(private readonly repo: LaunchRepository, private readonly mapper: LaunchViewModelMapper) {

        this.refresh();

        this.unsubscribeRepository = repo.onChange(() => {

            this.refresh();

            this.notify();
        });

    }

    private refresh(): void {

        this.launches = this.mapper.mapAll(this.repo.getAll());

    }

    public subscribe(listener: EventListener): () => void {

        this.listeners.add(listener);

        return () => this.listeners.delete(listener);

    }

    public getAll(): readonly LaunchViewModel[] {

        return this.launches;

    }

    public get(id: string): LaunchViewModel | undefined {

        const launch = this.repo.get(id);

        return launch ? this.launches.find(x => x.id === id) : undefined;

    }

    public has(id: string): boolean {

        return this.repo.has(id);

    }

    public get size(): number {

        return this.repo.size;

    }

    public notify(): void {

        this.listeners.forEach(listener => listener());

    }

    public destroy(): void {

        this.unsubscribeRepository?.();

        this.unsubscribeRepository = undefined;

    }

}