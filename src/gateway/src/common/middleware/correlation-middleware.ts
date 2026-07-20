import { Request, Response, NextFunction } from 'express';
import { v4 as uuid } from 'uuid';
import { trace } from '@opentelemetry/api';
import { RequestMetadataService } from './request-metadata.service';

export function correlationMiddleware(requestMetadata: RequestMetadataService) {
    return (req: Request, res: Response, next: NextFunction) => {

        const incoming = req.headers['x-correlation-id'];

        const correlationId = Array.isArray(incoming) ? incoming[0] : incoming || uuid();

        req.correlationId = correlationId;

        res.setHeader('x-correlation-id', correlationId);

        const span = trace.getActiveSpan();
        
        span?.setAttribute('correlation.id', correlationId);

        requestMetadata.run({ correlationId }, next);
    };
}