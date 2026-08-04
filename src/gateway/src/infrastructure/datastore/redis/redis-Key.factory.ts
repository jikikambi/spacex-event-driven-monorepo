import { Injectable } from "@nestjs/common";
import { REDIS_CHANNELS } from "../../../common/constants/redis.constants";

@Injectable()
export class RedisKeyFactory {

    dedupKey(launchId: string): string {

        return `dedup:${launchId}`;

    }

    fanoutKey(eventId: string): string {

        return `fanout:${eventId}`;

    }

    channelEvents(): string {

        return REDIS_CHANNELS.EVENTS;

    }
    
}