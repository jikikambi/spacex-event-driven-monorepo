import { Module } from "@nestjs/common";
import { AsyncLocalStorage } from "node:async_hooks";
import { RequestContext } from "../common/middleware/request-context";
import { RequestMetadataService } from "../common/middleware/request-metadata.service";

@Module({
    imports: [],
    providers: [
        {
            provide: AsyncLocalStorage,
            useValue: new AsyncLocalStorage<RequestContext>()
        },
        RequestMetadataService,
    ],
    exports: [RequestMetadataService]
})
export class ObservabilityModule { }