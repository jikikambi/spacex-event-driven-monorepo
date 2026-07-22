import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LoggerModule } from "nestjs-pino";
import pino from 'pino';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { HealthModule } from '../health/health.module';
import { SpaceXModule } from '../integrations/spacex/spacex.module';
import { HttpExceptionFilter } from '../common/exceptions/http-exception.filter';
import { MetricsModule } from '../observability/metrics/metrics.module';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { MetricsInterceptor } from '../observability/metrics/metrics.Interceptor';
import { OpenTelemetryService } from '../observability/telemetry/opentelemetry.service';
import { GatewayLifecycleService } from '../bootstrap/gateway-lifecycle.service';
import { RedisModule } from '../infrastructure/database/redis/redis.module';
import { RabbitMQModule } from '../infrastructure/messaging/rabbitmq/rabbitmq.module';
import { EventsModule } from '../infrastructure/messaging/events/events.module';
import { ObservabilityModule } from '../observability/observability.module';
import { LaunchBootstrapService } from '../bootstrap/launch-bootstrap.service';

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
            singleLine: true,
          }
        } : undefined,
        timestamp: pino.stdTimeFunctions.isoTime,
      },
    }),

    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    HttpModule, HealthModule, ObservabilityModule, MetricsModule, RabbitMQModule, EventsModule, RedisModule, SpaceXModule],

  controllers: [AppController],

  providers: [AppService, LaunchBootstrapService, GatewayLifecycleService, HttpExceptionFilter, OpenTelemetryService,
    {
      provide: APP_INTERCEPTOR,
      useClass: MetricsInterceptor,
    }],
    
  exports: []
})
export class AppModule { }
