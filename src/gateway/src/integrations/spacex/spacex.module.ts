import { Module } from "@nestjs/common";
import { SpaceXApiService } from "./spacex-api.service";
import { HttpModule } from "@nestjs/axios";
import { SpaceXController } from "./spacex.controller";
import { MetricsModule } from "../../observability/metrics/metrics.module";
import { TelemetryContextService } from "../../observability/logging/telemetry-context.service";
import { SpaceXMockService } from "./spacex-mock.service";
import { ConfigService } from "@nestjs/config";
import { ModuleRef } from "@nestjs/core";
import { SPACEX_PROVIDER_TOKEN } from "../../common/constants/spacex.constants";
import { ISpaceXProvider } from "./spacex.provider";
import { AsyncLocalStorage } from 'node:async_hooks';
import { ObservabilityModule } from "../../observability/observability.module";

export const AsyncLocalStorageProvider = {

  provide: AsyncLocalStorage,
  useValue: new AsyncLocalStorage<Map<string, string>>(),
};

@Module({

  imports: [HttpModule, ObservabilityModule, MetricsModule],

  controllers: [SpaceXController],

  providers: [TelemetryContextService, SpaceXApiService, SpaceXMockService,
    {
      provide: SPACEX_PROVIDER_TOKEN,
      //scope: Scope.REQUEST,
      inject: [ConfigService, ModuleRef],
      useFactory: async (config: ConfigService, moduleRef: ModuleRef): Promise<ISpaceXProvider> => {

        const provider = config.get<'api' | 'mock'>('SPACEX_PROVIDER');

        return provider === 'mock' ? await moduleRef.resolve(SpaceXMockService) : await moduleRef.resolve(SpaceXApiService);
      }
    }
  ],
  
  exports: [SPACEX_PROVIDER_TOKEN]
})
export class SpaceXModule { }