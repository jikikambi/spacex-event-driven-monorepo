import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { Response } from 'express';
import { randomUUID } from 'crypto';
import { REDIS_KEYS } from '../../common/constants/redis.constants';
import { EnrichLaunchEvent } from 'gateway-contracts';
import { RedisService } from '../../infrastructure/datastore/redis/redis.service';

@Injectable()
export class SseGatewayService {

    private readonly clients = new Map<string, Response>();

    constructor(private readonly logger: PinoLogger,
        private readonly redisSvc: RedisService) {

        this.logger.setContext(SseGatewayService.name);
    }

    async registerClient(res: Response): Promise<string> {

        const clientId = randomUUID();

        res.setHeader('Content-Type', 'text/event-stream');

        res.setHeader('Cache-Control', 'no-cache');

        res.setHeader('Connection', 'keep-alive');

        res.flushHeaders();

        this.clients.set(clientId, res);

        this.logger.info({ clientId, clients: this.clients.size }, '[SSE] Client connected');

        return clientId;

    }

    get getClients(): Map<string, Response> {

        return this.clients;

    }

    unregisterClient(clientId: string): void {

        this.clients.delete(clientId);

        this.logger.info({ clientId, clients: this.clients.size }, '[SSE] Client disconnected.');

    }

    async replayCachedEvents(clientId: string): Promise<void> {

        this.logger.info("ReplayCachedEvents called");

        const res = this.clients.get(clientId);

        if (!res) {

            this.logger.warn({ clientId }, '[SSE] Client not found');

            return;

        }

        /** Replay cached Redis events */
        try {

            const keys = await this.redisSvc.keys(REDIS_KEYS.FANOUT);

            if (keys.length > 0) {

                const cachedEvents = await this.redisSvc.mGet(keys);

                cachedEvents
                    .filter((evt): evt is string => evt !== null)
                    .forEach((evt) => res.write(`data: ${evt}\n\n`));

                this.logger.info({ clientId, count: cachedEvents.length }, '[SSE] Replayed cached events');

            }

        }
        catch (error) {

            this.logger.error(error instanceof Error ? error.message ?? error : undefined, '[SSE] Failed to to replay Redis cache for new client');

        }

    }

    /** Broadcast a GatewayEvent to all connected SSE clients */
    broadcast(evt: EnrichLaunchEvent): void {

        if (this.getClients.size === 0) {

            this.logger.debug({ event: evt.event }, 'No clients connected. Skipping broadcast');

            return;
            
        }

        const payload = `data: ${JSON.stringify(evt)}\n\n`;

        for (const [clientId, res] of this.clients) {

            try {

                res.write(payload);

            }
            catch (error) {

                const errorMessage = error instanceof Error ? error.message ?? error : undefined

                this.logger.error({ clientId, error: errorMessage }, '[SSE] Failed to write event');

            }

            this.logger.info({ event: evt.event, clients: this.clients.size }, '[SSE] Broadcast complete');
        }

    }

}