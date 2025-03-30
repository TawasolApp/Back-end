import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: UsersService;

  beforeEach(async () => {
    const mockUsersService = {
      requestEmailUpdate: jest.fn(),
      confirmEmailChange: jest.fn(),
      updatePassword: jest.fn(),
    };

    const mockJwtAuthGuard = {
      canActivate: jest.fn(() => true), // Mock the guard to always allow access
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard) // Override the guard with the mock
      .compile();

    controller = module.get<UsersController>(UsersController);
    usersService = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('requestEmailUpdate', () => {
    it('should call UsersService.requestEmailUpdate and return the result', async () => {
      const mockResult = {
        message: 'Please check your new email to confirm the change.',
      };
      jest
        .spyOn(usersService, 'requestEmailUpdate')
        .mockResolvedValue(mockResult);

      const req = { user: { sub: 'userId' } } as unknown as Request;
      const dto = { newEmail: 'new@example.com', password: 'password123' };

      const result = await controller.requestEmailUpdate(req, dto);

      expect(result).toEqual(mockResult);
      expect(usersService.requestEmailUpdate).toHaveBeenCalledWith(
        'userId',
        dto,
      );
    });

    it('should throw UnauthorizedException if user is not authenticated', async () => {
      const req = { user: undefined } as unknown as Request; // Mock req.user as undefined
      const dto = { newEmail: 'new@example.com', password: 'password123' };

      await expect(controller.requestEmailUpdate(req, dto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw BadRequestException for invalid input', async () => {
      jest
        .spyOn(usersService, 'requestEmailUpdate')
        .mockRejectedValue(new BadRequestException('Invalid input'));

      const req = { user: { sub: 'userId' } } as unknown as Request;
      const dto = { newEmail: '', password: '' }; // Invalid input

      await expect(controller.requestEmailUpdate(req, dto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('confirmEmailChange', () => {
    it('should call UsersService.confirmEmailChange and return the result', async () => {
      const mockResult = { message: 'Email updated successfully.' };
      jest
        .spyOn(usersService, 'confirmEmailChange')
        .mockResolvedValue(mockResult);

      const token = 'valid-token';

      const result = await controller.confirmEmailChange(token);

      expect(result).toEqual(mockResult);
      expect(usersService.confirmEmailChange).toHaveBeenCalledWith(token);
    });

    it('should throw BadRequestException for an invalid token', async () => {
      jest
        .spyOn(usersService, 'confirmEmailChange')
        .mockRejectedValue(new BadRequestException('Invalid token'));

      const token = 'invalid-token';

      await expect(controller.confirmEmailChange(token)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException if user is not found', async () => {
      jest
        .spyOn(usersService, 'confirmEmailChange')
        .mockRejectedValue(new NotFoundException('User not found'));

      const token = 'valid-token';

      await expect(controller.confirmEmailChange(token)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updatePassword', () => {
    it('should call UsersService.updatePassword and return the result', async () => {
      const mockResult = { message: 'Password updated successfully' };
      jest.spyOn(usersService, 'updatePassword').mockResolvedValue(mockResult);

      const req = { user: { sub: 'userId' } } as unknown as Request;
      const dto = {
        currentPassword: 'old-password',
        newPassword: 'new-password',
      };

      const result = await controller.updatePassword(req, dto);

      expect(result).toEqual(mockResult);
      expect(usersService.updatePassword).toHaveBeenCalledWith('userId', dto);
    });

    it('should throw UnauthorizedException if user is not authenticated', async () => {
      const req = { user: undefined } as unknown as Request; // Mock req.user as undefined
      const dto = {
        currentPassword: 'old-password',
        newPassword: 'new-password',
      };

      await expect(controller.updatePassword(req, dto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw NotFoundException if user is not found', async () => {
      jest
        .spyOn(usersService, 'updatePassword')
        .mockRejectedValue(new NotFoundException('User not found'));

      const req = { user: { sub: 'invalid-userId' } } as unknown as Request;
      const dto = {
        currentPassword: 'old-password',
        newPassword: 'new-password',
      };

      await expect(controller.updatePassword(req, dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException for invalid input', async () => {
      jest
        .spyOn(usersService, 'updatePassword')
        .mockRejectedValue(new BadRequestException('Invalid input'));

      const req = { user: { sub: 'userId' } } as unknown as Request;
      const dto = {
        currentPassword: '',
        newPassword: '',
      }; // Invalid input

      await expect(controller.updatePassword(req, dto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
