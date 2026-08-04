import { Module } from '@nestjs/common';
import { SseController } from './sse.controller';
import { SseGatewayService } from './sse-gateway.service';
import { RedisModule } from '../../infrastructure/datastore/redis/redis.module';
import { MongoModule } from '../../infrastructure/datastore/mongo/mongo.module';

@Module({  
    imports:[RedisModule, MongoModule],  
    controllers: [SseController],
    providers: [SseGatewayService],
    exports: [SseGatewayService]
})
export class SseModule { }