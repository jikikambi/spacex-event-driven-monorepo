import { Module } from '@nestjs/common';
import { RabbitMQService } from './rabbitmq.service';
import { RabbitMQController } from './controllers/rabbitmq.controller';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule], 

  controllers: [RabbitMQController],

  providers: [RabbitMQService],
  
  exports: [RabbitMQService],
})
export class RabbitMQModule { }