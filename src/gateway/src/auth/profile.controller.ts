import { Controller, Get, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "./auth.guard";
import {Request } from 'express';

@Controller('profile')
export class ProfileController {

    @Get()
    @UseGuards(JwtAuthGuard)
    getProfile(@Req() req: Request) {
        return req.user;
    }
}