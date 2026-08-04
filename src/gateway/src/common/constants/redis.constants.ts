export const REDIS_KEYS = {

    DEDUP: "dedup:*",

    FANOUT: "fanout:*",

} as const;

export const REDIS_CHANNELS = { EVENTS: 'events' } as const;

export const REDIS_TTL = { EVENTS: 60 * 60 } as const;