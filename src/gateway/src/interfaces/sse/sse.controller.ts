import { Controller, Get, MessageEvent, Query, Req, Res, Sse } from '@nestjs/common';
import type { Request, Response } from 'express';
import { PinoLogger } from 'nestjs-pino';
import { SseGatewayService } from './sse-gateway.service';
import { EnrichLaunchEvent, IncomingGatewayEvent } from 'gateway-contracts';
import { MongoService } from '../../infrastructure/database/mongo/mongo.service';

@Controller('events')
export class SseController {

    constructor(private readonly gateway: SseGatewayService,
        private readonly mongoSvc: MongoService,
        private readonly logger: PinoLogger) {

        this.logger.setContext(SseController.name);
    }

    @Get()
    async stream(@Req() req: Request, @Res() res: Response): Promise<void> {

        // 1. Register client for SSE
        const clientId = await this.gateway.registerClient(res);

        // Replay missed events if client provides a "since" timestamp
        const since = req.query.since ? new Date(req.query.since as string) : null;

        // 2. Replay historical events (Redis/Mongo)
        if (since) {

            // Reconnecting client: replay persistent history
            await this.replayEvents(res, since);

        }
        else {
            // New client: replay recent Redis cache
            await this.gateway.replayCachedEvents(clientId);
        }

        req.on('close', () => {

            this.gateway.unregisterClient(clientId);

            res.end();

        });

    }

    private async replayEvents(res: Response, since: Date): Promise<void> {

        try {

            const collection = this.mongoSvc.getCollection<EnrichLaunchEvent>('events');

            const events = await collection
                .find({ createdAt: { $gt: since } })
                .toArray();

            for (const event of events) {

                const eventData = JSON.stringify(event);

                res.write(`data: ${eventData}\n\n`);

            }
            
        }
        catch (error) {

            this.logger.error({ error }, '[SSE] Failed to replay missed events');

        }

    }

}