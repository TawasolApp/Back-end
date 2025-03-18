import { Body, Controller, Get, Post, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { ProfilesService } from './profiles.service';
//import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('profile')
export class ProfilesController {
    constructor(private profilesService:ProfilesService) {}

    //@UseGuards(jwt)
    @Post()
    @UsePipes(new ValidationPipe())
    createProfile(@Body () createProfileDto) {
        return this.profilesService.createProfile(createProfileDto);
    }
}
