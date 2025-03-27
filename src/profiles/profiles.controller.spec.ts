import { Test, TestingModule } from '@nestjs/testing';
import { ProfilesController } from './profiles.controller';
import { ProfilesService } from './profiles.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { SkillDto } from './dto/skill.dto';
import { Types } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { BadRequestException, UnauthorizedException, InternalServerErrorException } from '@nestjs/common';

describe('ProfilesController', () => {
  let controller: ProfilesController;
  let service: ProfilesService;

  const mockProfilesService = {
    createProfile: jest.fn(),
    getProfile: jest.fn(),
    updateProfile: jest.fn(),
    deleteProfilePicture: jest.fn(),
    deleteCoverPhoto: jest.fn(),
    deleteResume: jest.fn(),
    deleteHeadline: jest.fn(),
    deleteBio: jest.fn(),
    deleteLocation: jest.fn(),
    deleteIndustry: jest.fn(),
    addSkill: jest.fn(),
    deleteSkill: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProfilesController],
      providers: [
        JwtService,
        {
          provide: ProfilesService,
          useValue: mockProfilesService,
        },
      ],
    }).compile();

    controller = module.get<ProfilesController>(ProfilesController);
    service = module.get<ProfilesService>(ProfilesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createProfile', () => {
    it('should create a profile successfully', async () => {
      const dto: CreateProfileDto = { name: 'Test Name', skills: [{ skillName: 'NestJS' }] };
      const userId = new Types.ObjectId();
      await controller.createProfile({ user: { sub: userId } }, dto);
      expect(service.createProfile).toHaveBeenCalledWith(userId, dto);
    });

    it('should throw UnauthorizedException when user is not authenticated', async () => {
      await expect(controller.createProfile({}, {} as CreateProfileDto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('getProfile', () => {
    it('should get profile successfully with valid ObjectId', async () => {
      const id = new Types.ObjectId().toHexString();
      await controller.getProfile(id);
      expect(service.getProfile).toHaveBeenCalled();
    });

    it('should throw BadRequestException for invalid ObjectId', async () => {
      await expect(controller.getProfile('invalid-id')).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateProfile', () => {
    it('should update a profile successfully', async () => {
      const dto: UpdateProfileDto = { headline: 'Updated Headline', name: 'Updated Name' };
      const testUserId = new Types.ObjectId();
      const req = { user: { sub: testUserId } };
      await controller.updateProfile(req, dto);
      expect(service.updateProfile).toHaveBeenCalledWith(dto, testUserId);
    });

    it('should throw UnauthorizedException when user is not authenticated', async () => {
      await expect(controller.updateProfile({}, {} as UpdateProfileDto)).rejects.toThrow(UnauthorizedException);
    });
  });

  const deleteFunctions = [
    { name: 'deleteProfilePicture', method: 'deleteProfilePicture' },
    { name: 'deleteCoverPhoto', method: 'deleteCoverPhoto' },
    { name: 'deleteResume', method: 'deleteResume' },
    { name: 'deleteHeadline', method: 'deleteHeadline' },
    { name: 'deleteBio', method: 'deleteBio' },
    { name: 'deleteLocation', method: 'deleteLocation' },
    { name: 'deleteIndustry', method: 'deleteIndustry' },
  ];

  deleteFunctions.forEach(({ name, method }) => {
    describe(name, () => {
      it(`should call ${method} on the service`, async () => {
        const testUserId = new Types.ObjectId();
        const req = { user: { sub: testUserId } };
        await controller[method](req);
        expect(service[method]).toHaveBeenCalledWith(testUserId);
      });

      it(`should throw UnauthorizedException for ${method} if user is not authenticated`, async () => {
        const req = {}; // Instead of { user: null }
        await expect(controller[method](req)).rejects.toThrow(UnauthorizedException);
      });
      
    });
  });

  describe('addSkill', () => {
    it('should add skill successfully', async () => {
      const skillDto: SkillDto = { skillName: 'NestJS' };
      const testUserId = new Types.ObjectId();
      const req = { user: { sub: testUserId } };
      await controller.addSkill(req, skillDto);
      expect(service.addSkill).toHaveBeenCalledWith(skillDto, testUserId);
    });

    it('should throw UnauthorizedException when user is not authenticated', async () => {
      await expect(controller.addSkill({}, {} as SkillDto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('deleteSkill', () => {
    it('should delete skill successfully', async () => {
      const testUserId = new Types.ObjectId();
      const req = { user: { sub: testUserId } };
      await controller.deleteSkill(req, 'NestJS');
      expect(service.deleteSkill).toHaveBeenCalledWith('NestJS', testUserId);
    });

    it('should throw UnauthorizedException when user is not authenticated', async () => {
      await expect(controller.deleteSkill({}, 'NestJS')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('Error Handling', () => {
    it('should throw InternalServerErrorException on service failure', async () => {
      (service.createProfile as jest.Mock).mockImplementation(() => {
        throw new Error('Unexpected error');
      });
      const userId = new Types.ObjectId();
      const dto: CreateProfileDto = { name: 'Test Name', skills: [{ skillName: 'NestJS' }] };
      await expect(controller.createProfile({ user: { sub: userId } }, dto)).rejects.toThrow(InternalServerErrorException);
    });
  });
});