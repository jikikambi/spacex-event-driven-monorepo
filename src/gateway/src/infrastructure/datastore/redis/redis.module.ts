import { Global, Module } from '@nestjs/common';
import { RedisService } from './redis.service';
import { RedisKeyFactory } from './redis-Key.factory';

@Module({
    imports:[],
    
    providers: [RedisService, RedisKeyFactory],

    exports: [RedisService, RedisKeyFactory]
})
export class RedisModule {}