import { ReconnectPolicy } from "./ReconnectPolicy";

export class DefaultReconnectPolicy implements ReconnectPolicy {

    private attempt = 0;

    constructor(private readonly initial = 1000, private readonly max = 30000) { }

    nextDelay(): number {

        const delay = Math.min(this.initial * 2 ** this.attempt++, this.max);

        return delay;
    }

    reset(): void {

        this.attempt = 0;
    }
}