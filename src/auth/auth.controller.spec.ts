import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RegisterDto } from './dtos/register.dto';
import { LoginDto } from './dtos/login.dto';
import { ResendConfirmationDto } from './dtos/resend-confirmation.dto';
import { ForgotPasswordDto } from './dtos/forgot-password.dto';
import { ResetPasswordDto } from './dtos/reset-password.dto';
import { SetNewPassword } from './dtos/set-new-password.dto';
import { SocialLoginDto } from './dtos/social-login.dto';

import { HttpStatus } from '@nestjs/common';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            register: jest.fn().mockResolvedValue({ message: 'success' }),
            checkEmailAvailability: jest.fn().mockResolvedValue({ message: 'available' }),
            login: jest.fn().mockResolvedValue({ token: 'test-token' }),
            verifyEmail: jest.fn().mockResolvedValue({ message: 'verified' }),
            resendConfirmationEmail: jest.fn().mockResolvedValue({ message: 'resent' }),
            refreshToken: jest.fn().mockResolvedValue({ token: 'new-token' }),
            forgotPassword: jest.fn().mockResolvedValue({ message: 'email sent' }),
            resetPassword: jest.fn().mockResolvedValue({ message: 'valid token' }),
            setNewPassword: jest.fn().mockResolvedValue({ message: 'password updated' }),
            googleLogin: jest.fn().mockResolvedValue({ token: 'google-token' }),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should call authService.register with the DTO', async () => {
      const registerDto: RegisterDto = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'password123',
        captchaToken: 'test-token',
      };

      await controller.register(registerDto);
      expect(authService.register).toHaveBeenCalledWith(registerDto);
    });
  });

  describe('checkEmail', () => {
    it('should call authService.checkEmailAvailability with email', async () => {
      const dto = { email: 'test@example.com' };
      await controller.checkEmail(dto);
      expect(authService.checkEmailAvailability).toHaveBeenCalledWith(dto);
    });
  });

  describe('login', () => {
    it('should call authService.login with the DTO', async () => {
      const loginDto: LoginDto = {
        email: 'john@example.com',
        password: 'password123',
      };

      await controller.login(loginDto);
      expect(authService.login).toHaveBeenCalledWith(loginDto);
    });
  });

  describe('verifyEmail', () => {
    it('should call authService.verifyEmail with token', async () => {
      const token = 'test-token';
      await controller.verifyEmail(token);
      expect(authService.verifyEmail).toHaveBeenCalledWith({ token });
    });
  });

  describe('resendConfirmation', () => {
    it('should call authService.resendConfirmationEmail with DTO', async () => {
      const dto: ResendConfirmationDto = {
        email: 'test@example.com',
        type: 'verifyEmail',
      };
      await controller.resendConfirmation(dto);
      expect(authService.resendConfirmationEmail).toHaveBeenCalledWith(dto);
    });
  });

  describe('refresh', () => {
    it('should call authService.refreshToken with refresh token', async () => {
      const dto = { refreshToken: 'test-refresh-token' };
      await controller.refresh(dto);
      expect(authService.refreshToken).toHaveBeenCalledWith(dto);
    });
  });

  describe('forgotPassword', () => {
    it('should call authService.forgotPassword with DTO', async () => {
      const dto: ForgotPasswordDto = {
        email: 'test@example.com',
        isAndroid: false,
      };
      await controller.forgotPassword(dto);
      expect(authService.forgotPassword).toHaveBeenCalledWith(dto);
    });
  });

  describe('resetPassword', () => {
    it('should call authService.resetPassword with DTO', async () => {
      const dto: ResetPasswordDto = { token: 'test-token' };
      await controller.resetPassword(dto);
      expect(authService.resetPassword).toHaveBeenCalledWith(dto);
    });
  });

  describe('setNewPassword', () => {
    it('should call authService.setNewPassword with DTO', async () => {
      const dto: SetNewPassword = {
        email: 'test@example.com',
        newPassword: 'new-password',
      };
      await controller.setNewPassword(dto);
      expect(authService.setNewPassword).toHaveBeenCalledWith(dto);
    });
  });

  describe('googleLogin', () => {
    it('should call authService.googleLogin with DTO', async () => {
      const dto: SocialLoginDto = {
        idToken: 'google-id-token',
        isAndroid: false,
      };
      await controller.googleLogin(dto);
      expect(authService.googleLogin).toHaveBeenCalledWith(dto);
    });
  });
});