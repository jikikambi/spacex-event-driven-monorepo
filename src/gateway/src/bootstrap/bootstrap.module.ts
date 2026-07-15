import { Module } from "@nestjs/common";
import { GatewayLifecycleService } from "./gateway-lifecycle.service";

@Module({
  providers: [GatewayLifecycleService],
  exports: [GatewayLifecycleService],
})
export class BootstrapModule {}