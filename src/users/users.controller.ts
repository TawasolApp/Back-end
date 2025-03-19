import { 
  Controller, 
  Patch, 
  UseGuards, 
  Body, 
  Req 
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateEmailDto } from './dtos/update-email.dto';
import { Request } from 'express';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // 🔹 Update Email (User ID from Token)
  @Patch('update-email')
  @UseGuards(JwtAuthGuard)
  async updateEmail(
    @Req() req: Request, // Extract user from token
    @Body() updateEmailDto: UpdateEmailDto
  ) {
    const userId = req.user?.['sub']; // Extract user ID from JWT token payload
    return this.usersService.updateEmail(userId, updateEmailDto);
  }
}
