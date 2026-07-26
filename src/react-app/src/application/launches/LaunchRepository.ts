import { EnrichLaunchEvent, EnrichedGatewayLaunch, IncomingGatewayEvent, GatewayEvents } from "gateway-contracts";
import { EventListener } from "../../infrastructure/events/types/EventListener";
import { EventClient } from "../../infrastructure/events/client";

export class LaunchRepository {

    private readonly launches = new Map<string, EnrichedGatewayLaunch>();

    private readonly listeners = new Set<EventListener>();

    private unsubscribeEventClient?: () => void;

    constructor(private readonly eventClient: EventClient) { }

    /**
     * Starts listening to gateway events.
     * Safe to call multiple times.
     */
    public start(): void {

        if (this.unsubscribeEventClient) return;

        this.unsubscribeEventClient = this.eventClient.subscribe(event => this.handleEvent(event));
    }

    /**
     * Stops listening to gateway events.
     */
    public stop(): void {

        this.unsubscribeEventClient?.();

        this.unsubscribeEventClient = undefined;

    }

    /**
     * Subscribe to repository updates.
     */
    public onChange(listener: EventListener): () => void {

        this.listeners.add(listener);

        return () => this.listeners.delete(listener);

    }

    /**
     * Returns all launches.
     */
    public getAll(): readonly EnrichedGatewayLaunch[] {

        return [...this.launches.values()];

    }

    /**
     * Returns a launch by id.
     */
    public get(id: string): EnrichedGatewayLaunch | undefined {

        return this.launches.get(id);

    }

    /**
     * Checks whether a launch exists.
     */
    public has(id: string): boolean {

        return this.launches.has(id);

    }

    /**
     * Number of cached launches.
     */
    public get size(): number {

        return this.launches.size;

    }

    /**
     * Clears the repository.
     */
    public clear(): void {

        this.launches.clear();

        this.notify();

    }

    private handleEvent(event: IncomingGatewayEvent): void {

        if (event.event !== GatewayEvents.ENRICH_LAUNCHED) return;

        this.upsert(event);

    }

    private upsert(event: EnrichLaunchEvent): void {

        const payload = event.payload;

        this.launches.set(payload.launch.id, payload);

        this.notify();

    }

    private notify(): void {

        this.listeners.forEach(listener => listener());

    }

}