import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { getModelToken } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { MailerService } from '../common/services/mailer.service';
import { User } from '../users/infrastructure/database/user.schema';
import * as bcrypt from 'bcrypt';
import {
  ConflictException,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import axios from 'axios';

jest.mock('google-auth-library', () => {
  return {
    OAuth2Client: jest.fn().mockImplementation(() => ({
      verifyIdToken: jest.fn(),
    })),
  };
});

describe('AuthService', () => {
  let service: AuthService;
  let userModel: any;
  let jwtService: JwtService;
  let mailerService: MailerService;

  beforeEach(async () => {
    const userModelMock = {
      findOne: jest.fn(),
      findById: jest.fn(),
      save: jest.fn(),
    };

    const userModelClassMock = jest.fn().mockImplementation((userData) => ({
      ...userData,
      save: jest.fn().mockResolvedValue(userData), // Mock save method
    }));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getModelToken(User.name),
          useValue: Object.assign(userModelClassMock, userModelMock), // Combine class and static methods
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(() => 'test-token'),
            verify: jest.fn((token) => {
              if (token === 'valid-token')
                return { email: 'test@example.com', sub: 'userId' };
              throw new Error('Invalid token');
            }),
          },
        },
        {
          provide: MailerService,
          useValue: {
            sendVerificationEmail: jest.fn(),
            sendPasswordResetEmail: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userModel = module.get(getModelToken(User.name));
    jwtService = module.get<JwtService>(JwtService);
    mailerService = module.get<MailerService>(MailerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should throw BadRequestException for invalid CAPTCHA', async () => {
      jest.spyOn(userModel, 'findOne').mockResolvedValue(null);
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashedPass');
      jest.spyOn(axios, 'post').mockResolvedValue({ data: { success: false } });

      await expect(
        service.register({
          firstName: 'John',
          lastName: 'Doe',
          email: 'test@example.com',
          password: 'password123',
          captchaToken: 'invalid-captcha',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should register a new user for valid CAPTCHA', async () => {
      jest.spyOn(userModel, 'findOne').mockResolvedValue(null);
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashedPass');
      jest.spyOn(axios, 'post').mockResolvedValue({ data: { success: true } });

      const result = await service.register({
        firstName: 'John',
        lastName: 'Doe',
        email: 'test@example.com',
        password: 'password123',
        captchaToken: 'valid-captcha',
      });

      expect(result.message).toBe(
        'Registration successful. Please check your email to verify your account.',
      );
      expect(mailerService.sendVerificationEmail).toHaveBeenCalledWith(
        'test@example.com',
        'test-token',
      );
    });

    it('should throw ConflictException if email is already in use', async () => {
      jest
        .spyOn(userModel, 'findOne')
        .mockResolvedValue({ email: 'test@example.com' });

      await expect(
        service.register({
          firstName: 'John',
          lastName: 'Doe',
          email: 'test@example.com',
          password: 'password123',
          captchaToken: 'test-token',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('should return access and refresh tokens for valid credentials', async () => {
      jest.spyOn(userModel, 'findOne').mockResolvedValue({
        email: 'test@example.com',
        password: await bcrypt.hash('password123', 10),
        isVerified: true,
        _id: 'userId',
        role: 'user',
      });
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true); // Mock valid password

      const result = await service.login('test@example.com', 'password123');

      expect(result.token).toBe('test-token');
      expect(result.refreshToken).toBe('test-token');
    });

    it('should throw UnauthorizedException for invalid credentials', async () => {
      jest.spyOn(userModel, 'findOne').mockResolvedValue({
        email: 'test@example.com',
        password: await bcrypt.hash('password123', 10),
        isVerified: true,
      });
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false); // Mock invalid password

      await expect(
        service.login('test@example.com', 'wrong-password'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw BadRequestException if email is not verified', async () => {
      jest.spyOn(userModel, 'findOne').mockResolvedValue({
        email: 'test@example.com',
        password: await bcrypt.hash('password123', 10),
        isVerified: false,
      });
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true); // Mock valid password

      await expect(
        service.login('test@example.com', 'password123'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('verifyEmail', () => {
    it('should verify email and update user', async () => {
      jest.spyOn(userModel, 'findOne').mockResolvedValue({
        email: 'test@example.com',
        isVerified: false,
        save: jest.fn(),
      });

      const result = await service.verifyEmail('valid-token');

      expect(result.message).toBe('Email verified successfully.');
    });

    it('should throw BadRequestException for invalid token', async () => {
      await expect(service.verifyEmail('invalid-token')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('forgotPassword', () => {
    it('should send a password reset email if user exists', async () => {
      jest.spyOn(userModel, 'findOne').mockResolvedValue({
        email: 'test@example.com',
        isVerified: true,
      });

      const result = await service.forgotPassword('test@example.com');

      expect(result.message).toBe(
        'If an account with that email exists, a password reset link has been sent.',
      );
      expect(mailerService.sendPasswordResetEmail).toHaveBeenCalledWith(
        'test@example.com',
        'test-token',
      );
    });

    it('should not throw an error if user does not exist', async () => {
      jest.spyOn(userModel, 'findOne').mockResolvedValue(null);

      const result = await service.forgotPassword('nonexistent@example.com');

      expect(result.message).toBe(
        'If an account with that email exists, a password reset link has been sent.',
      );
    });
  });

  describe('resetPassword', () => {
    it('should throw BadRequestException if new password is the same as the old password', async () => {
      jest.spyOn(userModel, 'findById').mockResolvedValue({
        password: await bcrypt.hash('same-password', 10),
        save: jest.fn(),
      });
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true); // Mock same password comparison

      await expect(
        service.resetPassword('valid-token', 'same-password'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reset the password for a valid token', async () => {
      jest.spyOn(userModel, 'findById').mockResolvedValue({
        password: await bcrypt.hash('old-password', 10),
        save: jest.fn(),
      });
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false); // Mock different password comparison
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('new-hashed-password');

      const result = await service.resetPassword('valid-token', 'new-password');

      expect(result.message).toBe('Password reset successfully');
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      jest.spyOn(jwtService, 'verify').mockReturnValue({ sub: 'userId' });
      jest.spyOn(jwtService, 'sign').mockReturnValue('new-access-token');

      const result = await service.refreshToken('valid-refresh-token');
      expect(result).toEqual({
        token: 'new-access-token',
        refreshToken: 'valid-refresh-token',
      });
    });

    it('should throw BadRequestException for invalid refresh token', async () => {
      jest.spyOn(jwtService, 'verify').mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(
        service.refreshToken('invalid-refresh-token'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('Error Handling', () => {
    it('should throw InternalServerErrorException for unexpected errors', async () => {
      jest.spyOn(userModel, 'findOne').mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      await expect(
        service.register({
          firstName: 'John',
          lastName: 'Doe',
          email: 'test@example.com',
          password: 'password123',
          captchaToken: 'test-token',
        }),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('checkEmailAvailability', () => {
    it('should return a message if the email is available', async () => {
      jest.spyOn(userModel, 'findOne').mockResolvedValue(null);

      const result = await service.checkEmailAvailability('test@example.com');
      expect(result).toEqual({ message: 'Email is available' });
    });

    it('should throw ConflictException if the email already exists', async () => {
      jest
        .spyOn(userModel, 'findOne')
        .mockResolvedValue({ email: 'test@example.com' });

      await expect(
        service.checkEmailAvailability('test@example.com'),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('resendConfirmationEmail', () => {
    it('should throw NotFoundException if the email is not found', async () => {
      jest.spyOn(userModel, 'findOne').mockResolvedValue(null);

      await expect(
        service.resendConfirmationEmail('nonexistent@example.com'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should return a message if the email is already verified', async () => {
      jest.spyOn(userModel, 'findOne').mockResolvedValue({
        email: 'test@example.com',
        isVerified: true,
      });

      const result = await service.resendConfirmationEmail('test@example.com');
      expect(result).toEqual({ message: 'Email is already verified' });
    });

    it('should resend a confirmation email if the email is not verified', async () => {
      jest.spyOn(userModel, 'findOne').mockResolvedValue({
        email: 'test@example.com',
        isVerified: false,
      });
      jest.spyOn(jwtService, 'sign').mockReturnValue('test-token');

      const result = await service.resendConfirmationEmail('test@example.com');
      expect(result).toEqual({ message: 'Confirmation email resent' });
      expect(mailerService.sendVerificationEmail).toHaveBeenCalledWith(
        'test@example.com',
        'test-token',
      );
    });
  });

  describe('verifyCaptcha', () => {
    it('should return true for a valid CAPTCHA token', async () => {
      jest
        .spyOn(axios, 'post')
        .mockResolvedValue({ data: { success: true, score: 0.9 } });

      const result = await service['verifyCaptcha']('valid-captcha-token');
      expect(result).toBe(true);
    });

    it('should return false for an invalid CAPTCHA token', async () => {
      jest.spyOn(axios, 'post').mockResolvedValue({ data: { success: false } });

      const result = await service['verifyCaptcha']('invalid-captcha-token');
      expect(result).toBe(false);
    });
  });
});
