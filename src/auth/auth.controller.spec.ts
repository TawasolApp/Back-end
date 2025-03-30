import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { BadRequestException } from '@nestjs/common';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  beforeEach(async () => {
    const mockAuthService = {
      register: jest.fn(),
      checkEmailAvailability: jest.fn(),
      login: jest.fn(),
      verifyEmail: jest.fn(),
      resendConfirmationEmail: jest.fn(),
      refreshToken: jest.fn(),
      forgotPassword: jest.fn(),
      resetPassword: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('should call AuthService.register and return the result', async () => {
      const mockResult = { message: 'Registration successful' };
      jest.spyOn(authService, 'register').mockResolvedValue(mockResult);

      const dto = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'test@example.com',
        password: 'password123',
        captchaToken: 'valid-captcha',
      };

      const result = await controller.register(dto);

      expect(result).toEqual(mockResult);
      expect(authService.register).toHaveBeenCalledWith(dto);
    });
  });

  describe('checkEmail', () => {
    it('should call AuthService.checkEmailAvailability and return the result', async () => {
      const mockResult = { message: 'Email is available' };
      jest
        .spyOn(authService, 'checkEmailAvailability')
        .mockResolvedValue(mockResult);

      const dto = { email: 'test@example.com' };

      const result = await controller.checkEmail(dto);

      expect(result).toEqual(mockResult);
      expect(authService.checkEmailAvailability).toHaveBeenCalledWith(dto);
    });
  });

  describe('login', () => {
    it('should call AuthService.login and return the result', async () => {
      const mockResult = {
        token: 'access-token',
        refreshToken: 'refresh-token',
      };
      jest.spyOn(authService, 'login').mockResolvedValue(mockResult);

      const dto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const result = await controller.login(dto);

      expect(result).toEqual(mockResult);
      expect(authService.login).toHaveBeenCalledWith(dto);
    });
  });

  describe('verifyEmail', () => {
    it('should call AuthService.verifyEmail and return the result', async () => {
      const mockResult = { message: 'Email verified successfully' };
      jest.spyOn(authService, 'verifyEmail').mockResolvedValue(mockResult);

      const token = 'valid-token';

      const result = await controller.verifyEmail(token); // Pass a plain string
      expect(result).toEqual(mockResult);
      expect(authService.verifyEmail).toHaveBeenCalledWith({ token });
    });
  });

  describe('resendConfirmation', () => {
    it('should call AuthService.resendConfirmationEmail and return the result', async () => {
      const mockResult = { message: 'Confirmation email resent' };
      jest
        .spyOn(authService, 'resendConfirmationEmail')
        .mockResolvedValue(mockResult);

      const dto = { email: 'test@example.com' };

      const result = await controller.resendConfirmation(dto);

      expect(result).toEqual(mockResult);
      expect(authService.resendConfirmationEmail).toHaveBeenCalledWith(dto);
    });
  });

  describe('refresh', () => {
    it('should call AuthService.refreshToken and return the result', async () => {
      const mockResult = {
        token: 'new-access-token',
        refreshToken: 'new-refresh-token',
      };
      jest.spyOn(authService, 'refreshToken').mockResolvedValue(mockResult);

      const dto = { refreshToken: 'valid-refresh-token' };

      const result = await controller.refresh(dto);

      expect(result).toEqual(mockResult);
      expect(authService.refreshToken).toHaveBeenCalledWith(dto);
    });
  });

  describe('forgotPassword', () => {
    it('should call AuthService.forgotPassword and return the result', async () => {
      const mockResult = { message: 'Password reset link sent' };
      jest.spyOn(authService, 'forgotPassword').mockResolvedValue(mockResult);

      const dto = { email: 'test@example.com' };

      const result = await controller.forgotPassword(dto);

      expect(result).toEqual(mockResult);
      expect(authService.forgotPassword).toHaveBeenCalledWith(dto);
    });
  });

  describe('resetPassword', () => {
    it('should call AuthService.resetPassword and return the result', async () => {
      const mockResult = { message: 'Password reset successfully' };
      jest.spyOn(authService, 'resetPassword').mockResolvedValue(mockResult);

      const dto = {
        token: 'valid-token',
        newPassword: 'new-password',
      };

      const result = await controller.resetPassword(dto);

      expect(result).toEqual(mockResult);
      expect(authService.resetPassword).toHaveBeenCalledWith(dto);
    });

    it('should throw BadRequestException for invalid token', async () => {
      jest
        .spyOn(authService, 'resetPassword')
        .mockRejectedValue(new BadRequestException('Invalid token'));

      const dto = {
        token: 'invalid-token',
        newPassword: 'new-password',
      };

      await expect(controller.resetPassword(dto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
