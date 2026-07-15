import { Module } from '@nestjs/common';
import { SseController } from './sse.controller';
import { SseGatewayService } from './sse-gateway.service';
import { RedisModule } from '../database/redis/redis.module';
import { MongoModule } from '../database/mongo/mongo.module';

@Module({  
    imports:[RedisModule, MongoModule],  
    controllers: [SseController],
    providers: [SseGatewayService],
    exports: [SseGatewayService]
})
export class SseModule { }