import { Controller, Post, Body, Get, Headers } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body('email') email: string) {
    return this.authService.login(email);
  }

  @Get('verify')
  async verify(@Headers('Authorization') token: string) {
    const tokenWithoutBearer = token.split(' ')[1]; 
    const decoded = await this.authService.verifyToken(tokenWithoutBearer);
    return decoded;
  }
}
