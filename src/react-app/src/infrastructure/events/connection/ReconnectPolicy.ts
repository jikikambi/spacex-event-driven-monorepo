export interface ReconnectPolicy {

    nextDelay(attempt: number): number;

    reset(): void;
}