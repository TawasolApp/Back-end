import {
  Controller,
  Patch,
  UseGuards,
  Get,
  Query,
  Body,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateEmailRequestDto } from './dtos/update-email-request.dto';
import { UpdatePasswordDto } from './dtos/update-password.dto';
import { Request } from 'express';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Patch('request-email-update')
  @UseGuards(JwtAuthGuard)
  async requestEmailUpdate(@Req() req, @Body() dto: UpdateEmailRequestDto) {
    return this.usersService.requestEmailUpdate(req.user.sub, dto);
  }

  @Get('confirm-email-change')
  async confirmEmailChange(@Query('token') token: string) {
    return this.usersService.confirmEmailChange(token);
  }

  @Patch('update-password')
  @UseGuards(JwtAuthGuard)
  async updatePassword(
    @Req() req: Request,
    @Body() updatePasswordDto: UpdatePasswordDto,
  ) {
    if (!req.user) {
      throw new UnauthorizedException('User not authenticated');
    }

    console.log('🔹 Extracted User ID from Token:', req.user['sub']);
    return this.usersService.updatePassword(req.user['sub'], updatePasswordDto);
  }
}
