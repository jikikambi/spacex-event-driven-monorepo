import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'node:async_hooks';
import { RequestContext } from './request-context';

@Injectable()
export class RequestMetadataService {

    constructor(private readonly als: AsyncLocalStorage<RequestContext>) { }

    run = (context: RequestContext, callback: () => void) => this.als.run(context, callback);

    get correlationId(): string | undefined {
        
        return this.als.getStore()?.correlationId;
    }
}