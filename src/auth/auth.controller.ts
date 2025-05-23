import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  HttpCode,
  HttpStatus,
  Patch,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dtos/register.dto';
import { LoginDto } from './dtos/login.dto';
import { ResendConfirmationDto } from './dtos/resend-confirmation.dto';
import { ForgotPasswordDto } from './dtos/forgot-password.dto';
import { ResetPasswordDto } from './dtos/reset-password.dto';
import { SetNewPassword } from './dtos/set-new-password.dto';
import { SocialLoginDto } from './dtos/social-login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('check-email')
  async checkEmail(@Body() dto: { email: string }) {
    return this.authService.checkEmailAvailability(dto);
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Get('verify-email')
  async verifyEmail(@Query('token') token: string) {
    return this.authService.verifyEmail({ token });
  }

  @Post('resend-confirmation')
  async resendConfirmation(@Body() dto: ResendConfirmationDto) {
    return this.authService.resendConfirmationEmail(dto);
  }

  @Post('refresh-token')
  async refresh(@Body() dto: { refreshToken: string }) {
    return this.authService.refreshToken(dto);
  }

  @Post('forgot-password')
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Patch('set-new-password')
  async setNewPassword(@Body() dto: SetNewPassword) {
    return this.authService.setNewPassword(dto);
  }

  @Post('social-login/google')
  async googleLogin(@Body() dto: SocialLoginDto) {
    return this.authService.googleLogin(dto);
  }
}
