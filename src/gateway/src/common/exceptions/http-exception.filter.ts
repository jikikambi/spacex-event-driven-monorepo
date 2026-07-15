import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { PinoLogger } from 'nestjs-pino';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {

    constructor(private readonly logger: PinoLogger) { }

    catch(exception: unknown, host: ArgumentsHost) {

        const ctx = host.switchToHttp();
        const res = ctx.getResponse<Response>();
        const req = ctx.getRequest<Request>();
        const correlationId = req['correlationId'];

        const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
        const message = exception instanceof HttpException ? exception.getResponse() : 'Internal server error';

        const errorResponse = {
            timestamp: new Date().toISOString(),
            path: req.url,
            method: req.method,
            correlationId,
            statusCode: status,
            error: typeof message === 'string' ? message : (message as any)?.message || message
        };

        this.logger.error(errorResponse,'Request failed' );

        res.status(status).json(errorResponse);
    }
}