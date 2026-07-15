import { Inject, Injectable, Scope } from "@nestjs/common";
import { REQUEST } from "@nestjs/core";
import { trace } from "@opentelemetry/api";
import { Request } from "express";

@Injectable({ scope: Scope.REQUEST })
export class TelemetryContextService {

    constructor(@Inject(REQUEST) private readonly req: Request) {}

    get traceId(): string | undefined {
        return trace.getActiveSpan()?.spanContext().traceId;
    }

    get spanId(): string | undefined {
        return trace.getActiveSpan()?.spanContext().spanId;
    }

    get request() {
        return {
            method: this.req.method,
            url: this.req.url,
        };
    }

    get logContext() {

        return {
            traceId: this.traceId,
            spanId: this.spanId
        };
    }
}