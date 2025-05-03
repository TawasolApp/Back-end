import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getModelToken } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { MailerService } from '../common/services/mailer.service';
import * as bcrypt from 'bcrypt';
import { Types } from 'mongoose';
import {
  ConflictException,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';

describe('UsersService', () => {
  let service: UsersService;
  let mockUserModel: any;
  let mockProfileModel: any;
  let mockPostModel: any;
  let mockSaveModel: any;
  let mockReactModel: any;
  let mockCommentModel: any;
  let mockShareModel: any;
  let mockUserConnectionModel: any;
  let mockCompanyConnectionModel: any;
  let mockCompanyManagerModel: any;
  let mockApplicationModel: any;
  let mockJobModel: any;
  let mockJwtService: any;
  let mockMailerService: any;

  beforeEach(async () => {
    mockUserModel = {
      findById: jest.fn(),
      findOne: jest.fn(),
      deleteOne: jest.fn(),
    };
    mockProfileModel = { deleteOne: jest.fn() };
    mockPostModel = {
      deleteMany: jest.fn(),
      updateOne: jest.fn(),
      find: jest.fn(),
    };
    mockSaveModel = { deleteMany: jest.fn() };
    mockReactModel = {
      find: jest.fn(),
      deleteMany: jest.fn(),
    };
    mockCommentModel = {
      find: jest.fn(),
      deleteMany: jest.fn(),
      updateOne: jest.fn(),
    };
    mockShareModel = { deleteMany: jest.fn() };
    mockUserConnectionModel = { deleteMany: jest.fn() };
    mockCompanyConnectionModel = { deleteMany: jest.fn() };
    mockCompanyManagerModel = { deleteMany: jest.fn() };
    mockApplicationModel = {
      find: jest.fn(),
      deleteMany: jest.fn(),
    };
    mockJobModel = { updateOne: jest.fn() };
    mockJwtService = {
      sign: jest.fn(),
      verify: jest.fn(),
    };
    mockMailerService = {
      sendEmailChangeConfirmation: jest.fn(),
    };

    jest
      .spyOn(bcrypt, 'compare')
      .mockImplementation(() => Promise.resolve(true));
    jest
      .spyOn(bcrypt, 'hash')
      .mockImplementation(() => Promise.resolve('hashedPassword'));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getModelToken('User'),
          useValue: mockUserModel,
        },
        {
          provide: getModelToken('Profile'),
          useValue: mockProfileModel,
        },
        {
          provide: getModelToken('Post'),
          useValue: mockPostModel,
        },
        {
          provide: getModelToken('Save'),
          useValue: mockSaveModel,
        },
        {
          provide: getModelToken('React'),
          useValue: mockReactModel,
        },
        {
          provide: getModelToken('Comment'),
          useValue: mockCommentModel,
        },
        {
          provide: getModelToken('Share'),
          useValue: mockShareModel,
        },
        {
          provide: getModelToken('UserConnection'),
          useValue: mockUserConnectionModel,
        },
        {
          provide: getModelToken('CompanyConnection'),
          useValue: mockCompanyConnectionModel,
        },
        {
          provide: getModelToken('CompanyManager'),
          useValue: mockCompanyManagerModel,
        },
        {
          provide: getModelToken('Application'),
          useValue: mockApplicationModel,
        },
        {
          provide: getModelToken('Job'),
          useValue: mockJobModel,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: MailerService,
          useValue: mockMailerService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('requestEmailUpdate', () => {
    it('should throw NotFoundException if user not found', async () => {
      mockUserModel.findById.mockResolvedValue(null);

      await expect(
        service.requestEmailUpdate('userId', {
          newEmail: 'new@email.com',
          password: 'password',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if password is incorrect', async () => {
      const mockUser = { password: 'hashedPassword' };
      mockUserModel.findById.mockResolvedValue(mockUser);
      jest
        .spyOn(bcrypt, 'compare')
        .mockImplementationOnce(() => Promise.resolve(false));

      await expect(
        service.requestEmailUpdate('userId', {
          newEmail: 'new@email.com',
          password: 'wrongPassword',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException if email already exists', async () => {
      const mockUser = { password: 'hashedPassword' };
      mockUserModel.findById.mockResolvedValue(mockUser);
      mockUserModel.findOne.mockResolvedValue({ email: 'existing@email.com' });

      await expect(
        service.requestEmailUpdate('userId', {
          newEmail: 'existing@email.com',
          password: 'password',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should send confirmation email if all checks pass', async () => {
      const mockUser = { password: 'hashedPassword' };
      mockUserModel.findById.mockResolvedValue(mockUser);
      mockUserModel.findOne.mockResolvedValue(null);
      mockJwtService.sign.mockReturnValue('token');

      const result = await service.requestEmailUpdate('userId', {
        newEmail: 'new@email.com',
        password: 'password',
      });

      expect(
        mockMailerService.sendEmailChangeConfirmation,
      ).toHaveBeenCalledWith('new@email.com', 'token');
      expect(result).toEqual({
        message: 'Please check your new email to confirm the change.',
      });
    });

    it('should throw InternalServerErrorException on unexpected error', async () => {
      mockUserModel.findById.mockRejectedValue(new Error('DB error'));

      await expect(
        service.requestEmailUpdate('userId', {
          newEmail: 'new@email.com',
          password: 'password',
        }),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('confirmEmailChange', () => {
    it('should update email if token is valid', async () => {
      const mockUser = { email: 'old@email.com', save: jest.fn() };
      mockUserModel.findById.mockResolvedValue(mockUser);
      mockJwtService.verify.mockReturnValue({
        userId: 'userId',
        newEmail: 'new@email.com',
      });

      const result = await service.confirmEmailChange('validToken');

      expect(mockUser.email).toBe('new@email.com');
      expect(mockUser.save).toHaveBeenCalled();
      expect(result).toEqual({ message: 'Email updated successfully.' });
    });

    it('should throw NotFoundException if user not found', async () => {
      mockUserModel.findById.mockResolvedValue(null);
      mockJwtService.verify.mockReturnValue({
        userId: 'userId',
        newEmail: 'new@email.com',
      });

      await expect(service.confirmEmailChange('validToken')).rejects.toThrow(
        NotFoundException, // Fix: Expect NotFoundException
      );
    });

    it('should throw BadRequestException if token is invalid', async () => {
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(service.confirmEmailChange('invalidToken')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('updatePassword', () => {
    const userId = new Types.ObjectId().toString();
    const updatePasswordDto = {
      currentPassword: 'currentPassword',
      newPassword: 'newPassword',
    };

    it('should throw NotFoundException if user not found', async () => {
      mockUserModel.findById.mockResolvedValue(null);

      await expect(
        service.updatePassword(userId, updatePasswordDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if current password is incorrect', async () => {
      const mockUser = { password: 'hashedPassword' };
      mockUserModel.findById.mockResolvedValue(mockUser);
      jest
        .spyOn(bcrypt, 'compare')
        .mockImplementationOnce(() => Promise.resolve(false));

      await expect(
        service.updatePassword(userId, updatePasswordDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if new password is same as current', async () => {
      const mockUser = { password: 'hashedPassword' };
      mockUserModel.findById.mockResolvedValue(mockUser);
      jest
        .spyOn(bcrypt, 'compare')
        .mockImplementationOnce(() => Promise.resolve(true)) // First compare for current password
        .mockImplementationOnce(() => Promise.resolve(true)); // Second compare for same password check

      await expect(
        service.updatePassword(userId, updatePasswordDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should update password if all checks pass', async () => {
      const mockUser = {
        password: 'oldHashedPassword',
        save: jest.fn().mockResolvedValue(true),
      };
      mockUserModel.findById.mockResolvedValue(mockUser);
      jest
        .spyOn(bcrypt, 'compare')
        .mockImplementationOnce(() => Promise.resolve(true)) // First compare for current password
        .mockImplementationOnce(() => Promise.resolve(false)); // Second compare for same password check

      const result = await service.updatePassword(userId, updatePasswordDto);

      expect(bcrypt.hash).toHaveBeenCalledWith('newPassword', 10);
      expect(mockUser.password).toBe('hashedPassword');
      expect(mockUser.save).toHaveBeenCalled();
      expect(result).toEqual({ message: 'Password updated successfully' });
    });

    it('should throw InternalServerErrorException on unexpected error', async () => {
      mockUserModel.findById.mockRejectedValue(new Error('DB error'));

      await expect(
        service.updatePassword(userId, updatePasswordDto),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('findByEmail', () => {
    it('should return user if found by email', async () => {
      const mockUser = { email: 'test@email.com' };
      mockUserModel.findOne.mockResolvedValue(mockUser);

      const result = await service.findByEmail('test@email.com');

      expect(result).toEqual(mockUser);
      expect(mockUserModel.findOne).toHaveBeenCalledWith({
        email: 'test@email.com',
      });
    });

    it('should throw InternalServerErrorException on error', async () => {
      mockUserModel.findOne.mockRejectedValue(new Error('DB error'));

      await expect(service.findByEmail('test@email.com')).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('deleteAccount', () => {
    const userId = new Types.ObjectId().toString();
    const objectId = new Types.ObjectId(userId);

    beforeEach(() => {
      mockUserModel.findById.mockResolvedValue({ _id: objectId });
      mockReactModel.find.mockResolvedValue([]);
      mockCommentModel.find.mockResolvedValue([]);
      mockPostModel.find.mockResolvedValue([]);
      mockApplicationModel.find.mockResolvedValue([]);
    });

    it('should throw NotFoundException if user not found', async () => {
      mockUserModel.findById.mockResolvedValue(null);

      await expect(service.deleteAccount(userId)).rejects.toThrow(
        NotFoundException, // Fix: Expect NotFoundException
      );
    });

    it('should delete all user related data', async () => {
      const result = await service.deleteAccount(userId);

      expect(mockProfileModel.deleteOne).toHaveBeenCalledWith({
        _id: objectId,
      });
      expect(mockPostModel.deleteMany).toHaveBeenCalledWith({
        author_id: objectId,
      });
      expect(mockSaveModel.deleteMany).toHaveBeenCalledWith({
        user_id: objectId,
      });
      expect(mockReactModel.deleteMany).toHaveBeenCalledWith({
        user_id: objectId,
      });
      expect(mockCommentModel.deleteMany).toHaveBeenCalledWith({
        author_id: objectId,
      });
      expect(mockPostModel.deleteMany).toHaveBeenCalledWith({
        author_id: objectId,
        parent_post_id: { $ne: null },
      });
      expect(mockShareModel.deleteMany).toHaveBeenCalledWith({
        user: objectId,
      });
      expect(mockUserConnectionModel.deleteMany).toHaveBeenCalledWith({
        $or: [{ sending_party: objectId }, { receiving_party: objectId }],
      });
      expect(mockCompanyConnectionModel.deleteMany).toHaveBeenCalledWith({
        user_id: objectId,
      });
      expect(mockCompanyManagerModel.deleteMany).toHaveBeenCalledWith({
        manager_id: objectId,
      });
      expect(mockApplicationModel.deleteMany).toHaveBeenCalledWith({
        user_id: objectId,
      });
      expect(mockUserModel.deleteOne).toHaveBeenCalledWith({ _id: objectId });
      expect(result).toEqual({
        message: 'Account and all related data deleted successfully.',
      });
    });

    it('should handle reacts on posts and comments', async () => {
      const mockPostReact = {
        post_id: '67fac9f9086226b1d9cf22da',
        react_type: 'like',
        post_type: 'Post',
      };
      const mockCommentReact = {
        post_id: '67fac9f9086226b1d9cf22db',
        react_type: 'like',
        post_type: 'Comment',
      };

      mockReactModel.find.mockResolvedValue([mockPostReact, mockCommentReact]);

      await service.deleteAccount('67fac9f9086226b1d9cf22d8');

      expect(mockPostModel.updateOne).toHaveBeenCalledWith(
        { _id: mockPostReact.post_id },
        { $inc: { [`react_count.${mockPostReact.react_type}`]: -1 } },
      );
      expect(mockCommentModel.updateOne).toHaveBeenCalledWith(
        { _id: mockCommentReact.post_id },
        { $inc: { [`react_count.${mockCommentReact.react_type}`]: -1 } }, // Fixed react_count update
      );
    });

    it('should handle user comments', async () => {
      const mockComment = {
        _id: new Types.ObjectId(),
        post_id: new Types.ObjectId(),
      };
      mockCommentModel.find.mockResolvedValue([mockComment]);

      await service.deleteAccount(userId);

      expect(mockPostModel.updateOne).toHaveBeenCalledWith(
        { _id: mockComment.post_id },
        { $inc: { comment_count: -1 } },
      );
    });

    it('should handle user reposts', async () => {
      const mockRepost = {
        _id: new Types.ObjectId(),
        parent_post_id: new Types.ObjectId(),
      };
      mockPostModel.find.mockResolvedValue([mockRepost]);

      await service.deleteAccount(userId);

      expect(mockPostModel.updateOne).toHaveBeenCalledWith(
        { _id: mockRepost.parent_post_id },
        { $inc: { share_count: -1 } },
      );
    });

    it('should handle user applications', async () => {
      const mockApplication = {
        _id: new Types.ObjectId(),
        job_id: new Types.ObjectId(),
      };
      mockApplicationModel.find.mockResolvedValue([mockApplication]);

      await service.deleteAccount(userId);

      expect(mockJobModel.updateOne).toHaveBeenCalledWith(
        { _id: mockApplication.job_id },
        { $inc: { applicants: -1 } },
      );
    });

    it('should throw InternalServerErrorException on error', async () => {
      mockUserModel.findById.mockRejectedValue(new Error('DB error'));

      await expect(service.deleteAccount(userId)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });
});
