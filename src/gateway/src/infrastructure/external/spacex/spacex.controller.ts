import { Controller, Get, Inject, NotFoundException, Param } from "@nestjs/common";
import { PinoLogger } from "nestjs-pino";
import { ISpaceXProvider } from "./spacex.provider";
import { SPACEX_PROVIDER_TOKEN } from "../../../common/constants/spacex.constants";

@Controller('launch')
export class SpaceXController {

    constructor(private readonly logger: PinoLogger,
        @Inject(SPACEX_PROVIDER_TOKEN) private readonly provider: ISpaceXProvider) {
        this.logger.setContext(SpaceXController.name);
    }

    @Get(':id')
    async getLaunch(@Param('id') id: string) {

        const launch = await this.provider.fetchLaunch(id);

        if (!launch) {
            throw new NotFoundException(`Launch '${id}' not found`);
        }

        return launch;
    }
}