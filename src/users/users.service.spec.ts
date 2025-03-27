import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getModelToken } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { MailerService } from '../common/services/mailer.service';
import { User } from './infrastructure/database/user.schema';
import * as bcrypt from 'bcrypt';
import {
  ConflictException,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';

describe('UsersService', () => {
  let service: UsersService;
  let userModel: any;
  let jwtService: JwtService;
  let mailerService: MailerService;

  beforeEach(async () => {
    const userModelMock = {
      findById: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getModelToken(User.name),
          useValue: userModelMock,
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(() => 'test-token'),
            verify: jest.fn(),
          },
        },
        {
          provide: MailerService,
          useValue: {
            sendEmailChangeConfirmation: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userModel = module.get(getModelToken(User.name));
    jwtService = module.get<JwtService>(JwtService);
    mailerService = module.get<MailerService>(MailerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('requestEmailUpdate', () => {
    it('should send email change confirmation for valid input', async () => {
      jest.spyOn(userModel, 'findById').mockResolvedValue({
        password: await bcrypt.hash('password123', 10),
      });
      jest.spyOn(userModel, 'findOne').mockResolvedValue(null);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);

      const result = await service.requestEmailUpdate('userId', {
        newEmail: 'new@example.com',
        password: 'password123',
      });

      expect(result.message).toBe(
        'Please check your new email to confirm the change.',
      );
      expect(mailerService.sendEmailChangeConfirmation).toHaveBeenCalledWith(
        'new@example.com',
        'test-token',
      );
    });

    it('should throw NotFoundException if user is not found', async () => {
      jest.spyOn(userModel, 'findById').mockResolvedValue(null);

      await expect(
        service.requestEmailUpdate('userId', {
          newEmail: 'new@example.com',
          password: 'password123',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for incorrect password', async () => {
      jest.spyOn(userModel, 'findById').mockResolvedValue({
        password: await bcrypt.hash('password123', 10),
      });
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false);

      await expect(
        service.requestEmailUpdate('userId', {
          newEmail: 'new@example.com',
          password: 'wrong-password',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException if email already exists', async () => {
      jest.spyOn(userModel, 'findById').mockResolvedValue({
        password: await bcrypt.hash('password123', 10),
      });
      jest
        .spyOn(userModel, 'findOne')
        .mockResolvedValue({ email: 'new@example.com' });
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);

      await expect(
        service.requestEmailUpdate('userId', {
          newEmail: 'new@example.com',
          password: 'password123',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('confirmEmailChange', () => {
    it('should update the email for a valid token', async () => {
      jest.spyOn(jwtService, 'verify').mockReturnValue({
        userId: 'userId',
        newEmail: 'new@example.com',
      });
      jest.spyOn(userModel, 'findById').mockResolvedValue({
        email: 'old@example.com',
        save: jest.fn(),
      });

      const result = await service.confirmEmailChange('valid-token');

      expect(result.message).toBe('Email updated successfully.');
    });

    it('should throw NotFoundException if user is not found', async () => {
      jest.spyOn(jwtService, 'verify').mockReturnValue({
        userId: 'userId',
        newEmail: 'new@example.com',
      });
      jest.spyOn(userModel, 'findById').mockResolvedValue(null);

      await expect(service.confirmEmailChange('valid-token')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException for an invalid token', async () => {
      jest.spyOn(jwtService, 'verify').mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(service.confirmEmailChange('invalid-token')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('updatePassword', () => {
    it('should update the password for valid input', async () => {
      jest.spyOn(userModel, 'findById').mockResolvedValue({
        password: await bcrypt.hash('old-password', 10),
        save: jest.fn(),
      });
      jest
        .spyOn(bcrypt, 'compare')
        .mockImplementationOnce(() => Promise.resolve(true)) // Mock current password comparison
        .mockImplementationOnce(() => Promise.resolve(false)); // Mock new password comparison
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('new-hashed-password');

      const result = await service.updatePassword('507f1f77bcf86cd799439011', {
        currentPassword: 'old-password',
        newPassword: 'new-password',
      });

      expect(result.message).toBe('Password updated successfully');
    });

    it('should throw NotFoundException if user is not found', async () => {
      jest.spyOn(userModel, 'findById').mockResolvedValue(null);

      await expect(
        service.updatePassword('507f1f77bcf86cd799439011', {
          // Valid ObjectId
          currentPassword: 'old-password',
          newPassword: 'new-password',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for incorrect current password', async () => {
      jest.spyOn(userModel, 'findById').mockResolvedValue({
        password: await bcrypt.hash('old-password', 10),
      });
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false);

      await expect(
        service.updatePassword('507f1f77bcf86cd799439011', {
          // Valid ObjectId
          currentPassword: 'wrong-password',
          newPassword: 'new-password',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if new password matches the current password', async () => {
      jest.spyOn(userModel, 'findById').mockResolvedValue({
        password: await bcrypt.hash('same-password', 10),
      });
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);

      await expect(
        service.updatePassword('507f1f77bcf86cd799439011', {
          // Valid ObjectId
          currentPassword: 'same-password',
          newPassword: 'same-password',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findByEmail', () => {
    it('should return a user if email exists', async () => {
      const mockUser = { email: 'test@example.com' };
      jest.spyOn(userModel, 'findOne').mockResolvedValue(mockUser);

      const result = await service.findByEmail('test@example.com');
      expect(result).toEqual(mockUser);
    });

    it('should return null if email does not exist', async () => {
      jest.spyOn(userModel, 'findOne').mockResolvedValue(null);

      const result = await service.findByEmail('nonexistent@example.com');
      expect(result).toBeNull();
    });

    it('should throw InternalServerErrorException on database error', async () => {
      jest.spyOn(userModel, 'findOne').mockImplementation(() => {
        throw new Error('Database error');
      });

      await expect(service.findByEmail('test@example.com')).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });
});
