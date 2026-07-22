export type EventListener<TEvent = void> = (event: TEvent) => void;

export interface Subscription {

    unsubscribe(): void;
}