import { Module } from "@nestjs/common";
import { TestGatewayLifecycleService } from "./test-gateway-lifecycle.service";
import { EventsModule } from "../infrastructure/messaging/events/events.module";
import { RedisModule } from "../infrastructure/datastore/redis/redis.module";
import { RabbitMQModule } from "../infrastructure/messaging/rabbitmq/rabbitmq.module";
import { LoggerModule } from "nestjs-pino";
import pino from 'pino';
import { ConfigModule } from "@nestjs/config";
import { SpaceXModule } from "../infrastructure/external/spacex/spacex.module";
import { HttpModule } from "@nestjs/axios";

@Module({
    imports: [

        LoggerModule.forRoot({

            pinoHttp: {

                level:

                    process.env.NODE_ENV === 'production' ? 'info' : 'debug',

                transport: process.env.NODE_ENV !== 'production' ? {

                    target: 'pino-pretty',

                    options: {

                        colorize: true,

                        singleLine: true

                    }

                } : undefined,

                timestamp: pino.stdTimeFunctions.isoTime

            }

        }),

        ConfigModule.forRoot({

            isGlobal: true,

            envFilePath: '.env.test'

        }),


        HttpModule, EventsModule, RabbitMQModule, RedisModule, SpaceXModule

    ],

    providers: [ TestGatewayLifecycleService  ]

})
export class GatewayE2ETestModule { }