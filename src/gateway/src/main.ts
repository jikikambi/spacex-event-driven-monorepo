/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from './app/app.module';
import { ConfigService } from '@nestjs/config';
import { HttpExceptionFilter } from './common/exceptions/http-exception.filter';
import { correlationMiddleware } from './common/middleware/correlation-middleware';
import { sdk  } from './observability/tracing/tracing';
import { GatewayLifecycleService } from './bootstrap/gateway-lifecycle.service';
import { RequestMetadataService } from './common/middleware/request-metadata.service';

async function bootstrap() {

  const logger = new Logger('Bootstrap');

  await sdk.start();

  logger.log(`OpenTelemetry started: ${process.env.OTEL_SERVICE_NAME}`);

  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  const config = app.get(ConfigService);

  app.get(GatewayLifecycleService);

  // Global prefix
  app.setGlobalPrefix('api');

  // Security
  app.use(helmet());

  // CORS (adjust later for production domains)
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // Validation (important for DTOs)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const requestMetadata = app.get(RequestMetadataService);
  app.use(correlationMiddleware(requestMetadata));

  // Global exception filter
  app.useGlobalFilters(app.get(HttpExceptionFilter));

  // Graceful shutdown
  app.enableShutdownHooks();

  const port = config.get<number>('PORT') ?? 3001;
  const host = '0.0.0.0'; // IMPORTANT for Docker

  await app.listen(port, host);

  logger.log(`Gateway running at http://localhost:${port}/api`);
}

bootstrap();