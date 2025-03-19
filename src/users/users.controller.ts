import {
  Controller,
  Get,
  Param,
  Patch,
  Body,
  UseGuards,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateEmailDto } from './dtos/update-email.dto';
import { Request } from 'express';

interface AuthenticatedRequest extends Request {
  user?: { userId: string }; 
}

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':email')
  async findByEmail(@Param('email') email: string) {
    return this.usersService.findByEmail(email);
  }

 

@Patch('update-email')
async updateEmail(@Req() req: AuthenticatedRequest, @Body() updateEmailDto: UpdateEmailDto) {
  console.log('Authorization Header:', req.headers.authorization);  // Print the token from the request

  if (!req.user || !req.user.userId) {
    throw new UnauthorizedException('User not found in request');
  }

  return this.usersService.updateEmail(req.user.userId, updateEmailDto);
}

}
