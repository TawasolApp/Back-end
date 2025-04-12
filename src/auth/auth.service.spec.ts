import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { getModelToken } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { MailerService } from '../common/services/mailer.service';
import * as bcrypt from 'bcrypt';
import axios from 'axios';
import { OAuth2Client } from 'google-auth-library';
import {
  ConflictException,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';

jest.mock('axios');
jest.mock('bcrypt');
jest.mock('google-auth-library');

describe('AuthService', () => {
  let service: AuthService;
  let userModel: any;
  let jwtService: any;
  let mailerService: any;

  const mockUser = {
    _id: '507f1f77bcf86cd799439011',
    first_name: 'John',
    last_name: 'Doe',
    email: 'john@example.com',
    password: 'hashedPassword',
    is_verified: true, // Changed from isVerified to is_verified
    is_social_login: false, // Changed from isSocialLogin to is_social_login
    role: 'user',
    save: jest.fn().mockResolvedValue(true),
  };

  const mockNewSocialUser = {
    _id: '507f1f77bcf86cd799439012',
    first_name: 'Google',
    last_name: 'User',
    email: 'google@example.com',
    password: 'hashedPassword',
    is_verified: true, // Changed from isVerified to is_verified
    is_social_login: true, // Changed from isSocialLogin to is_social_login
    role: 'user',
    save: jest.fn().mockResolvedValue(true),
  };

  // Mock console.error to suppress error logs during tests
  const consoleErrorMock = jest
    .spyOn(console, 'error')
    .mockImplementation(() => {});

  beforeEach(async () => {
    const mockUserModel = {
      findOne: jest.fn(),
      findById: jest.fn(),
      create: jest.fn().mockImplementation((doc) => ({
        ...doc,
        save: jest
          .fn()
          .mockResolvedValue({ ...doc, _id: mockNewSocialUser._id }),
      })),
    };

    const mockMailerService = {
      sendVerificationEmail: jest.fn().mockResolvedValue(true),
      resendConfirmationEmail: jest.fn().mockResolvedValue(true),
      sendPasswordResetEmail: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getModelToken('User'),
          useValue: mockUserModel,
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('token'),
            verify: jest.fn(),
          },
        },
        {
          provide: MailerService,
          useValue: mockMailerService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userModel = module.get(getModelToken('User'));
    jwtService = module.get<JwtService>(JwtService);
    mailerService = module.get<MailerService>(MailerService);

    // Mock verifyCaptcha to return true by default
    jest
      .spyOn(service as any, 'verifyCaptcha')
      .mockImplementation(async (token) => {
        if (token === 'test-token') return true;
        if (token === 'invalid-captcha') return false;
        return true;
      });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    // Restore console.error after all tests
    consoleErrorMock.mockRestore();
  });

  describe('register', () => {
    const registerDto = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      password: 'password123',
      captchaToken: 'valid-captcha',
    };

    it('should register successfully', async () => {
      userModel.findOne.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');

      const result = await service.register(registerDto);
      expect(result).toEqual({
        message:
          'Registration successful. Please check your email to verify your account.',
      });
      expect(userModel.create).toHaveBeenCalled();
      expect(mailerService.sendVerificationEmail).toHaveBeenCalled();
    });

    it('should throw ConflictException if email exists', async () => {
      userModel.findOne.mockResolvedValue(mockUser);
      await expect(
        service.register({
          ...registerDto,
          captchaToken: 'test-token', // Bypass captcha check
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw BadRequestException if CAPTCHA invalid', async () => {
      await expect(
        service.register({
          ...registerDto,
          captchaToken: 'invalid-captcha',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw InternalServerErrorException if user save fails', async () => {
      userModel.findOne.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      userModel.create.mockImplementationOnce(() => ({
        save: jest.fn().mockRejectedValue(new Error('Save failed')),
      }));

      await expect(
        service.register({
          ...registerDto,
          captchaToken: 'test-token', // Bypass captcha check
        }),
      ).rejects.toThrow(InternalServerErrorException);
    });

    it('should throw InternalServerErrorException if email sending fails', async () => {
      userModel.findOne.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      userModel.create.mockResolvedValue(mockUser);
      mailerService.sendVerificationEmail.mockRejectedValue(
        new InternalServerErrorException('Email sending failed'),
      );

      await expect(
        service.register({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          password: 'password123',
          captchaToken: 'test-token',
        }),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('login', () => {
    const loginDto = {
      email: 'john@example.com',
      password: 'password123',
    };

    it('should login successfully', async () => {
      userModel.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login(loginDto);
      expect(result).toEqual({
        token: 'token',
        refreshToken: 'token',
        is_social_login: false, // Updated to match snake_case
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      userModel.findOne.mockResolvedValue(null);
      await expect(service.login(loginDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if password is invalid', async () => {
      userModel.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      await expect(service.login(loginDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw ForbiddenException if email not verified', async () => {
      userModel.findOne.mockResolvedValue({ ...mockUser, is_verified: false });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      await expect(service.login(loginDto)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('checkEmailAvailability', () => {
    it('should return available message if email is not in use', async () => {
      userModel.findOne.mockResolvedValue(null);
      const result = await service.checkEmailAvailability({
        email: 'new@example.com',
      });
      expect(result).toEqual({ message: 'Email is available' });
    });

    it('should throw ConflictException if email is already in use', async () => {
      userModel.findOne.mockResolvedValue(mockUser);
      await expect(
        service.checkEmailAvailability({ email: 'john@example.com' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('verifyEmail', () => {
    it('should verify email successfully', async () => {
      jwtService.verify.mockReturnValue({ email: 'john@example.com' });
      userModel.findOne.mockResolvedValue({ ...mockUser, is_verified: false });

      const result = await service.verifyEmail({ token: 'valid-token' });
      expect(result).toEqual({ message: 'Email verified successfully.' });
      expect(mockUser.save).toHaveBeenCalled();
    });

    it('should return already verified message', async () => {
      jwtService.verify.mockReturnValue({ email: 'john@example.com' });
      userModel.findOne.mockResolvedValue(mockUser);

      const result = await service.verifyEmail({ token: 'valid-token' });
      expect(result).toEqual({ message: 'Email is already verified.' });
    });

    it('should throw BadRequestException for invalid token', async () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });
      await expect(
        service.verifyEmail({ token: 'invalid-token' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if user not found', async () => {
      jwtService.verify.mockReturnValue({ email: 'nonexistent@example.com' });
      userModel.findOne.mockResolvedValue(null);
      await expect(
        service.verifyEmail({ token: 'valid-token' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('resendConfirmationEmail', () => {
    const verifyEmailDto = {
      email: 'john@example.com',
      type: 'verifyEmail' as const,
    };
    const forgotPasswordDto = {
      email: 'john@example.com',
      type: 'forgotPassword' as const,
    };
    const emailUpdateDto = {
      email: 'john@example.com',
      type: 'emailUpdate' as const,
    };

    it('should resend verifyEmail confirmation email successfully', async () => {
      userModel.findOne.mockResolvedValue({ ...mockUser, is_verified: false });
      const result = await service.resendConfirmationEmail(verifyEmailDto);
      expect(result).toEqual({
        message: 'verifyEmail email resent successfully',
      });
      expect(mailerService.resendConfirmationEmail).toHaveBeenCalled();
    });

    it('should resend forgotPassword confirmation email successfully', async () => {
      userModel.findOne.mockResolvedValue(mockUser);
      const result = await service.resendConfirmationEmail(forgotPasswordDto);
      expect(result).toEqual({
        message: 'forgotPassword email resent successfully',
      });
      expect(mailerService.resendConfirmationEmail).toHaveBeenCalled();
    });

    it('should resend emailUpdate confirmation email successfully', async () => {
      userModel.findOne.mockResolvedValue(mockUser);
      const result = await service.resendConfirmationEmail(emailUpdateDto);
      expect(result).toEqual({
        message: 'emailUpdate email resent successfully',
      });
      expect(mailerService.resendConfirmationEmail).toHaveBeenCalled();
    });

    it('should return already verified message for verifyEmail type', async () => {
      userModel.findOne.mockResolvedValue(mockUser);
      const result = await service.resendConfirmationEmail(verifyEmailDto);
      expect(result).toEqual({ message: 'Email is already verified' });
    });

    it('should throw NotFoundException if email is not found', async () => {
      userModel.findOne.mockResolvedValue(null);
      await expect(
        service.resendConfirmationEmail(verifyEmailDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw InternalServerErrorException if email sending fails', async () => {
      userModel.findOne.mockResolvedValue(mockUser);
      mailerService.resendConfirmationEmail.mockRejectedValue(
        new Error('Email failed'),
      );
      await expect(
        service.resendConfirmationEmail(forgotPasswordDto),
      ).rejects.toThrow(InternalServerErrorException);
    });

    const dto = { email: 'john@example.com', type: 'verifyEmail' as const };

    it('should handle unexpected errors during email sending', async () => {
      userModel.findOne.mockResolvedValue({ ...mockUser, is_verified: false });
      mailerService.resendConfirmationEmail.mockRejectedValue(
        new Error('Unexpected error'),
      );

      await expect(service.resendConfirmationEmail(dto)).rejects.toThrow(
        InternalServerErrorException,
      );
      expect(mailerService.resendConfirmationEmail).toHaveBeenCalledWith(
        dto.email,
        dto.type,
        expect.any(String),
      );
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      jwtService.verify.mockReturnValue({ sub: mockUser._id });
      userModel.findById.mockResolvedValue(mockUser);

      const result = await service.refreshToken({
        refreshToken: 'valid-token',
      });
      expect(result).toEqual({ token: 'token', refreshToken: 'valid-token' });
    });

    it('should throw NotFoundException if user is not found', async () => {
      jwtService.verify.mockReturnValue({ sub: mockUser._id });
      userModel.findById.mockResolvedValue(null);
      await expect(
        service.refreshToken({ refreshToken: 'valid-token' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for invalid token', async () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });
      await expect(
        service.refreshToken({ refreshToken: 'invalid-token' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if refresh token is malformed', async () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error('Malformed token');
      });

      await expect(
        service.refreshToken({ refreshToken: 'malformed-token' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('forgotPassword', () => {
    it('should send password reset email for verified user', async () => {
      userModel.findOne.mockResolvedValue(mockUser);
      const result = await service.forgotPassword({
        email: 'john@example.com',
        isAndroid: false, // Use camelCase for DTO
      });
      expect(result).toEqual({
        message:
          'If an account with that email exists, a password reset link has been sent.',
      });
      expect(mailerService.sendPasswordResetEmail).toHaveBeenCalled();
    });

    it('should not send email for unverified user', async () => {
      userModel.findOne.mockResolvedValue({ ...mockUser, is_verified: false });
      const result = await service.forgotPassword({
        email: 'john@example.com',
        isAndroid: false,
      });
      expect(result).toEqual({
        message:
          'If an account with that email exists, a password reset link has been sent.',
      });
      expect(mailerService.sendPasswordResetEmail).not.toHaveBeenCalled();
    });

    it('should throw InternalServerErrorException if email sending fails', async () => {
      userModel.findOne.mockResolvedValue(mockUser);
      mailerService.sendPasswordResetEmail.mockRejectedValue(
        new Error('Email failed'),
      );
      await expect(
        service.forgotPassword({
          email: 'john@example.com',
          isAndroid: false,
        }),
      ).rejects.toThrow(InternalServerErrorException);
    });

    it('should not send email if user is not found', async () => {
      userModel.findOne.mockResolvedValue(null);

      const result = await service.forgotPassword({
        email: 'nonexistent@example.com',
        isAndroid: false,
      });

      expect(result).toEqual({
        message:
          'If an account with that email exists, a password reset link has been sent.',
      });
      expect(mailerService.sendPasswordResetEmail).not.toHaveBeenCalled();
    });
  });

  describe('resetPassword', () => {
    it('should validate reset password token', async () => {
      jwtService.verify.mockReturnValue({ sub: mockUser._id });
      userModel.findById.mockResolvedValue(mockUser);

      const result = await service.resetPassword({ token: 'valid-token' });
      expect(result).toEqual({ message: 'Token is valid' });
    });

    it('should throw NotFoundException if user is not found', async () => {
      jwtService.verify.mockReturnValue({ sub: mockUser._id });
      userModel.findById.mockResolvedValue(null);
      await expect(
        service.resetPassword({ token: 'valid-token' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for invalid token', async () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });
      await expect(
        service.resetPassword({ token: 'invalid-token' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('setNewPassword', () => {
    const dto = { email: 'john@example.com', newPassword: 'newPassword123' };

    it('should set new password successfully', async () => {
      userModel.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      (bcrypt.hash as jest.Mock).mockResolvedValue('newHashedPassword');

      const result = await service.setNewPassword(dto);
      expect(result).toEqual({ message: 'Password reset successfully' });
      expect(bcrypt.hash).toHaveBeenCalledWith(dto.newPassword, 10);
      expect(mockUser.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if user is not found', async () => {
      userModel.findOne.mockResolvedValue(null);
      await expect(service.setNewPassword(dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if new password is the same as the old one', async () => {
      userModel.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      await expect(service.setNewPassword(dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw InternalServerErrorException if password reset fails', async () => {
      userModel.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      mockUser.save.mockRejectedValueOnce(new Error('Save failed'));
      await expect(service.setNewPassword(dto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('should throw InternalServerErrorException if hashing the new password fails', async () => {
      userModel.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      (bcrypt.hash as jest.Mock).mockRejectedValue(new Error('Hashing failed'));

      await expect(
        service.setNewPassword({
          email: 'john@example.com',
          newPassword: 'newPassword123',
        }),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('verifyCaptcha', () => {
    beforeEach(() => {
      (service as any).verifyCaptcha.mockRestore();
      (axios.post as jest.Mock).mockReset();
    });

    it('should return true for test token', async () => {
      const result = await service['verifyCaptcha']('test-token');
      expect(result).toBe(true);
    });

    it('should return true if CAPTCHA verification succeeds', async () => {
      (axios.post as jest.Mock).mockResolvedValue({
        data: { success: true },
      });

      const result = await service['verifyCaptcha']('valid-token');
      expect(result).toBe(true);
    });

    it('should return false if CAPTCHA verification fails', async () => {
      (axios.post as jest.Mock).mockResolvedValue({
        data: { success: false },
      });

      const result = await service['verifyCaptcha']('invalid-token');
      expect(result).toBe(false);
    });

    it('should return false on API error', async () => {
      (axios.post as jest.Mock).mockRejectedValue(new Error('API error'));

      const result = await service['verifyCaptcha']('error-token');
      expect(result).toBe(false);
    });
  });

  describe('googleLogin', () => {
    const socialLoginDto = { idToken: 'google-token', isAndroid: false }; // Use camelCase for DTO
    const googleProfile = {
      email: 'google@example.com',
      given_name: 'Google',
      family_name: 'User',
    };

    beforeEach(() => {
      // Reset all mocks before each test
      jest.clearAllMocks();

      // Mock Google client
      (service as any).googleClientFrontend = {
        getTokenInfo: jest
          .fn()
          .mockResolvedValue({ email: googleProfile.email }),
      };

      // Mock axios for profile retrieval
      (axios.get as jest.Mock).mockResolvedValue({ data: googleProfile });

      // Mock bcrypt
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
    });

    it('should create new user if not exists', async () => {
      userModel.findOne.mockResolvedValue(null);

      const result = await service.googleLogin(socialLoginDto);

      expect(userModel.findOne).toHaveBeenCalledWith({
        email: googleProfile.email,
      });
      expect(userModel.create).toHaveBeenCalledWith({
        first_name: googleProfile.given_name,
        last_name: googleProfile.family_name,
        email: googleProfile.email,
        password: expect.any(String),
        is_verified: true,
        is_social_login: true, // Updated to match snake_case
      });
      expect(result).toEqual({
        token: 'token',
        refreshToken: 'token',
        email: googleProfile.email,
        is_social_login: true, // Updated to match snake_case
        isNewUser: true,
        message: 'Login successful',
      });
    });

    it('should return existing user if found', async () => {
      userModel.findOne.mockResolvedValue(mockUser);

      const result = await service.googleLogin(socialLoginDto);

      expect(userModel.findOne).toHaveBeenCalledWith({
        email: googleProfile.email,
      });
      expect(userModel.create).not.toHaveBeenCalled();
      expect(result).toEqual({
        token: 'token',
        refreshToken: 'token',
        email: mockUser.email,
        is_social_login: mockUser.is_social_login, // Updated to match snake_case
        isNewUser: false,
        message: 'Login successful',
      });
    });

    it('should handle unexpected error during user creation', async () => {
      userModel.findOne.mockResolvedValue(null);
      userModel.create.mockImplementation(() => ({
        save: jest.fn().mockRejectedValue(new Error('Unexpected save error')),
      }));

      await expect(service.googleLogin(socialLoginDto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('should handle error when Google token info retrieval fails', async () => {
      (service as any).googleClientFrontend.getTokenInfo.mockRejectedValue(
        new Error('Token info error'),
      );

      await expect(service.googleLogin(socialLoginDto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('should handle error when Google user profile retrieval fails', async () => {
      (axios.get as jest.Mock).mockRejectedValue(new Error('Profile error'));

      await expect(service.googleLogin(socialLoginDto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('should throw BadRequestException if Google profile lacks email', async () => {
      (axios.get as jest.Mock).mockResolvedValue({
        data: { given_name: 'Test' },
      });

      await expect(service.googleLogin(socialLoginDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should use the Android Google client when isAndroid is true', async () => {
      const androidGoogleClientMock = {
        getTokenInfo: jest
          .fn()
          .mockResolvedValue({ email: googleProfile.email }),
      };
      (service as any).googleClientAndroid = androidGoogleClientMock;

      userModel.findOne.mockResolvedValue(mockUser);

      const result = await service.googleLogin({
        ...socialLoginDto,
        isAndroid: true, // Use camelCase for DTO
      });

      expect(androidGoogleClientMock.getTokenInfo).toHaveBeenCalledWith(
        'google-token',
      );
      expect(result).toEqual({
        token: 'token',
        refreshToken: 'token',
        email: mockUser.email,
        is_social_login: mockUser.is_social_login, // Keep snake_case for database fields
        isNewUser: false,
        message: 'Login successful',
      });
    });

    it('should handle unexpected error during token generation', async () => {
      userModel.findOne.mockResolvedValue(mockUser);
      jwtService.sign.mockImplementation(() => {
        throw new Error('Token generation error');
      });

      await expect(service.googleLogin(socialLoginDto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('should handle case where user creation fails after model.create', async () => {
      userModel.findOne.mockResolvedValue(null);
      userModel.create.mockImplementation(() => ({
        save: jest.fn().mockRejectedValue(new Error('Save failed')),
      }));

      await expect(service.googleLogin(socialLoginDto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('should handle unexpected error during password hashing', async () => {
      userModel.findOne.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockRejectedValue(new Error('Hashing error'));

      await expect(service.googleLogin(socialLoginDto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('should handle error when user.save fails', async () => {
      userModel.findOne.mockResolvedValue(null);
      userModel.create.mockImplementation(() => ({
        save: jest.fn().mockRejectedValue(new Error('Save failed')),
      }));

      await expect(service.googleLogin(socialLoginDto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('should handle error when bcrypt.hash fails', async () => {
      userModel.findOne.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockRejectedValue(new Error('Hashing error'));

      await expect(service.googleLogin(socialLoginDto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('should handle unexpected error during token generation', async () => {
      userModel.findOne.mockResolvedValue(mockUser);
      jwtService.sign.mockImplementation(() => {
        throw new Error('Token generation error');
      });

      await expect(service.googleLogin(socialLoginDto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('should handle case where Google profile is missing given_name and family_name', async () => {
      (axios.get as jest.Mock).mockResolvedValue({
        data: { email: googleProfile.email },
      });

      userModel.findOne.mockResolvedValue(null);

      const result = await service.googleLogin(socialLoginDto);

      expect(userModel.create).toHaveBeenCalledWith({
        first_name: '',
        last_name: '',
        email: googleProfile.email,
        password: expect.any(String),
        isVerified: true,
        isSocialLogin: true,
      });
      expect(result).toEqual({
        token: 'token',
        refreshToken: 'token',
        email: googleProfile.email,
        isSocialLogin: true,
        isNewUser: true,
        message: 'Login successful',
      });
    });

    it('should handle case where Google profile retrieval returns an empty object', async () => {
      (axios.get as jest.Mock).mockResolvedValue({ data: {} });

      await expect(service.googleLogin(socialLoginDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should handle case where Google token info retrieval returns an empty object', async () => {
      (service as any).googleClientFrontend.getTokenInfo.mockResolvedValue({});

      await expect(service.googleLogin(socialLoginDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should handle case where Google token info retrieval throws an error', async () => {
      (service as any).googleClientFrontend.getTokenInfo.mockRejectedValue(
        new Error('Token info error'),
      );

      await expect(service.googleLogin(socialLoginDto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('should handle case where Google profile retrieval throws an error', async () => {
      (axios.get as jest.Mock).mockRejectedValue(new Error('Profile error'));

      await expect(service.googleLogin(socialLoginDto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('should handle case where user creation fails after model.create', async () => {
      userModel.findOne.mockResolvedValue(null);
      userModel.create.mockImplementation(() => ({
        save: jest.fn().mockRejectedValue(new Error('Save failed')),
      }));

      await expect(service.googleLogin(socialLoginDto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('should handle case where bcrypt.hash fails during password hashing', async () => {
      userModel.findOne.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockRejectedValue(new Error('Hashing error'));

      await expect(service.googleLogin(socialLoginDto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('should handle case where token generation fails', async () => {
      userModel.findOne.mockResolvedValue(mockUser);
      jwtService.sign.mockImplementation(() => {
        throw new Error('Token generation error');
      });

      await expect(service.googleLogin(socialLoginDto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('should generate tokens for the user', async () => {
      userModel.findOne.mockResolvedValue(mockUser);

      const result = await service.googleLogin(socialLoginDto);

      expect(jwtService.sign).toHaveBeenCalledTimes(2); // Covers line 404
      expect(result).toEqual({
        token: 'token',
        refreshToken: 'token',
        email: mockUser.email,
        is_social_login: mockUser.is_social_login, // Changed from isSocialLogin to is_social_login
        isNewUser: false,
        message: 'Login successful',
      });
    });

    it('should throw InternalServerErrorException for unexpected errors', async () => {
      userModel.findOne.mockResolvedValue(mockUser);
      jwtService.sign.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      await expect(service.googleLogin(socialLoginDto)).rejects.toThrow(
        InternalServerErrorException, // Covers line 447
      );
    });

    it('should use the Android Google client when isAndroid is true', async () => {
      const androidGoogleClientMock = {
        getTokenInfo: jest
          .fn()
          .mockResolvedValue({ email: googleProfile.email }),
      };
      (service as any).googleClientAndroid = androidGoogleClientMock;

      userModel.findOne.mockResolvedValue(mockUser);

      const result = await service.googleLogin({
        ...socialLoginDto,
        isAndroid: true, // Use camelCase for DTO
      });

      expect(androidGoogleClientMock.getTokenInfo).toHaveBeenCalledWith(
        'google-token',
      );
      expect(result).toEqual({
        token: 'token',
        refreshToken: 'token',
        email: mockUser.email,
        is_social_login: mockUser.is_social_login, // Changed from isSocialLogin to is_social_login
        isNewUser: false,
        message: 'Login successful',
      }); // Covers branch for isAndroid=true
    });

    it('should throw BadRequestException if Google profile lacks email', async () => {
      (axios.get as jest.Mock).mockResolvedValue({
        data: { given_name: 'Test' },
      });

      await expect(service.googleLogin(socialLoginDto)).rejects.toThrow(
        BadRequestException,
      ); // Covers branch where profile.email is missing
    });

    it('should handle unexpected error during Google API call', async () => {
      (axios.get as jest.Mock).mockRejectedValue(new Error('API error'));

      await expect(service.googleLogin(socialLoginDto)).rejects.toThrow(
        InternalServerErrorException,
      ); // Covers branch for unexpected API error
    });

    it('should handle case where user creation fails after model.create', async () => {
      userModel.findOne.mockResolvedValue(null);
      userModel.create.mockImplementation(() => ({
        save: jest.fn().mockRejectedValue(new Error('Save failed')),
      }));

      await expect(service.googleLogin(socialLoginDto)).rejects.toThrow(
        InternalServerErrorException,
      ); // Covers branch for user.save failure
    });
  });
});
