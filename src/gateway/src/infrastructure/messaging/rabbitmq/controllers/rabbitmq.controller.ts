import { Controller, Get } from "@nestjs/common";
import { RabbitMQService } from "../rabbitmq.service";
import { RabbitMqHealthDto } from "../dto/rabbitmq-health.dto";

@Controller('rabbitmq')
export class RabbitMQController {

    constructor(private readonly rabbitMqService: RabbitMQService) { }

    @Get('health')
    getHealth(): RabbitMqHealthDto {
        return this.rabbitMqService.getHealth();
    }
}