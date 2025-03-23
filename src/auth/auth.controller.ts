import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dtos/register.dto';
import { LoginDto } from './dtos/login.dto';
import { Query, Get } from '@nestjs/common';
import { ResendConfirmationDto } from './dtos/resend-confirmation.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto.email, loginDto.password);
  }

  @Get('verify-email')
  async verifyEmail(@Query('token') token: string) {
  const message = await this.authService.verifyEmail(token);
  return { message };

  }

  @Post('resend-confirmation')
  async resendConfirmation(@Body() { email }: ResendConfirmationDto) {
  const message = await this.authService.resendConfirmationEmail(email);
  return { message };


}
}
