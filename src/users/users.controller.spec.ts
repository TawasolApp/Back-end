import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateEmailRequestDto } from './dtos/update-email-request.dto';
import { UpdatePasswordDto } from './dtos/update-password.dto';
import { UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: UsersService;

  const mockRequest = (user?: any): any => (user === undefined ? {} : { user });

  beforeEach(async () => {
    const mockJwtAuthGuard = {
      canActivate: jest.fn(() => true),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: {
            requestEmailUpdate: jest
              .fn()
              .mockResolvedValue({ message: 'success' }),
            confirmEmailChange: jest
              .fn()
              .mockResolvedValue({ message: 'email updated' }),
            updatePassword: jest
              .fn()
              .mockResolvedValue({ message: 'password updated' }),
            deleteAccount: jest
              .fn()
              .mockResolvedValue({ message: 'account deleted' }),
          },
        },
        Reflector,
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .compile();

    controller = module.get<UsersController>(UsersController);
    usersService = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('requestEmailUpdate', () => {
    const dto: UpdateEmailRequestDto = {
      newEmail: 'new@email.com',
      password: 'password',
    };

    it('should call service with correct parameters', async () => {
      const req = mockRequest({ sub: 'user-id' });
      await controller.requestEmailUpdate(req, dto);
      expect(usersService.requestEmailUpdate).toHaveBeenCalledWith(
        'user-id',
        dto,
      );
    });

    it('should throw UnauthorizedException if no user in request', async () => {
      const req = mockRequest(undefined); 
      await expect(controller.requestEmailUpdate(req, dto)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(usersService.requestEmailUpdate).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if no sub in user', async () => {
      const req = mockRequest({});
      await expect(controller.requestEmailUpdate(req, dto)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(usersService.requestEmailUpdate).not.toHaveBeenCalled();
    });

    it('should handle service errors', async () => {
      const req = mockRequest({ sub: 'user-id' }); 
      const error = new Error('Service error');
      jest.spyOn(usersService, 'requestEmailUpdate').mockRejectedValue(error);

      await expect(controller.requestEmailUpdate(req, dto)).rejects.toThrow(
        error,
      );
    });
  });

  describe('confirmEmailChange', () => {
    it('should call service with token from query', async () => {
      const token = 'test-token';
      await controller.confirmEmailChange(token);
      expect(usersService.confirmEmailChange).toHaveBeenCalledWith(token);
    });

    it('should return service response', async () => {
      const token = 'test-token';
      const result = await controller.confirmEmailChange(token);
      expect(result).toEqual({ message: 'email updated' });
    });

    it('should handle service errors', async () => {
      const token = 'test-token';
      const error = new Error('Service error');
      jest.spyOn(usersService, 'confirmEmailChange').mockRejectedValue(error);

      await expect(controller.confirmEmailChange(token)).rejects.toThrow(error);
    });
  });

  describe('updatePassword', () => {
    const dto: UpdatePasswordDto = {
      currentPassword: 'current',
      newPassword: 'new',
    };

    it('should call service with correct parameters', async () => {
      const req = mockRequest({ sub: 'user-id' });
      await controller.updatePassword(req, dto);
      expect(usersService.updatePassword).toHaveBeenCalledWith('user-id', dto);
    });

    it('should throw UnauthorizedException if no user in request', async () => {
      const req = mockRequest(undefined); 
      await expect(controller.updatePassword(req, dto)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(usersService.updatePassword).not.toHaveBeenCalled();
    });

    it('should return service response', async () => {
      const req = mockRequest({ sub: 'user-id' }); 
      const result = await controller.updatePassword(req, dto);
      expect(result).toEqual({ message: 'password updated' });
    });

    it('should handle service errors', async () => {
      const req = mockRequest({ sub: 'user-id' }); 
      const error = new Error('Service error');
      jest.spyOn(usersService, 'updatePassword').mockRejectedValue(error);

      await expect(controller.updatePassword(req, dto)).rejects.toThrow(error);
    });
  });

  describe('deleteAccount', () => {
    it('should call service with user id', async () => {
      const req = mockRequest({ sub: 'user-id' });
      await controller.deleteAccount(req);
      expect(usersService.deleteAccount).toHaveBeenCalledWith('user-id');
    });

    it('should throw UnauthorizedException if no user in request', async () => {
      const req = mockRequest(undefined);
      await expect(controller.deleteAccount(req)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(usersService.deleteAccount).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if no sub in user', async () => {
      const req = mockRequest({});
      await expect(controller.deleteAccount(req)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(usersService.deleteAccount).not.toHaveBeenCalled();
    });

    it('should return service response', async () => {
      const req = mockRequest({ sub: 'user-id' }); 
      const result = await controller.deleteAccount(req);
      expect(result).toEqual({ message: 'account deleted' });
    });

    it('should handle service errors', async () => {
      const req = mockRequest({ sub: 'user-id' }); 
      const error = new Error('Service error');
      jest.spyOn(usersService, 'deleteAccount').mockRejectedValue(error);

      await expect(controller.deleteAccount(req)).rejects.toThrow(error);
    });
  });

  describe('Guards', () => {
    it('should have JwtAuthGuard on requestEmailUpdate', () => {
      const metadata = Reflect.getMetadata(
        '__guards__',
        UsersController.prototype.requestEmailUpdate,
      );
      expect(metadata[0].name).toBe(JwtAuthGuard.name);
    });

    it('should have JwtAuthGuard on updatePassword', () => {
      const metadata = Reflect.getMetadata(
        '__guards__',
        UsersController.prototype.updatePassword,
      );
      expect(metadata[0].name).toBe(JwtAuthGuard.name);
    });

    it('should have JwtAuthGuard on deleteAccount', () => {
      const metadata = Reflect.getMetadata(
        '__guards__',
        UsersController.prototype.deleteAccount,
      );
      expect(metadata[0].name).toBe(JwtAuthGuard.name);
    });
  });
});
