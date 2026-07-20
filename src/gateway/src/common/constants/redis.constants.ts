export const REDIS_KEYS = { EVENTS: 'event:*' } as const;

export const REDIS_CHANNELS = { EVENTS: 'events' } as const;

export const REDIS_TTL = { EVENTS: 60 * 60 } as const;