import { Controller, Patch, UseGuards, Body, Req, UnauthorizedException } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateEmailDto } from './dtos/update-email.dto';
import { UpdatePasswordDto } from './dtos/update-password.dto';
import { Request } from 'express';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Patch('update-email')
  @UseGuards(JwtAuthGuard)
  async updateEmail(@Req() req: Request, @Body() updateEmailDto: UpdateEmailDto) {
    if (!req.user) {
      throw new UnauthorizedException('User not authenticated');
    }
    
    console.log("🔹 Extracted User ID from Token:", req.user['sub']);
    return this.usersService.updateEmail(req.user['sub'], updateEmailDto);
  }

  @Patch('update-password')
  @UseGuards(JwtAuthGuard)
  async updatePassword(@Req() req: Request, @Body() updatePasswordDto: UpdatePasswordDto) {
    if (!req.user) {
      throw new UnauthorizedException('User not authenticated');
    }
    
    console.log("🔹 Extracted User ID from Token:", req.user['sub']);
    return this.usersService.updatePassword(req.user['sub'], updatePasswordDto);
  }
}
