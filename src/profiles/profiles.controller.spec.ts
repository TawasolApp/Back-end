import { Test, TestingModule } from '@nestjs/testing';
import { ProfilesController } from './profiles.controller';
import { ProfilesService } from './profiles.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { SkillDto } from './dto/skill.dto';
import { Types } from 'mongoose';
import { JwtService } from '@nestjs/jwt';

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
    it('should call createProfile on the service', async () => {
      const dto: CreateProfileDto = { name: 'Test Name', skills: [{ skillName: 'NestJS' }] };
      await controller.createProfile(dto);
      expect(service.createProfile).toHaveBeenCalledWith(dto);
    });
  });

  describe('getProfile', () => {
    it('should call getProfile on the service with a valid ObjectId', async () => {
      const id = new Types.ObjectId().toHexString();
      await controller.getProfile(id);
      expect(service.getProfile).toHaveBeenCalled();
    });

    it('should return an error if the ObjectId is invalid', async () => {
      const response = await controller.getProfile('invalid-id');
      expect(response).toEqual({ error: 'Invalid profile ID' });
    });
  });

  describe('updateProfile', () => {
    it('should call updateProfile on the service', async () => {
      const dto: UpdateProfileDto = { headline: 'Updated Headline', name: 'Updated Name' };
      const testUserId = new Types.ObjectId(); // Ensure valid ObjectId
      const req = { user: { sub: testUserId } };
      await controller.updateProfile(req, dto);
      expect(service.updateProfile).toHaveBeenCalledWith(dto, testUserId);
    });
  });

  describe('deleteProfilePicture', () => {
    it('should call deleteProfilePicture on the service', async () => {
      const testUserId = new Types.ObjectId(); // Ensure valid ObjectId
      const req = { user: { sub: testUserId } };
  
      await controller.deleteProfilePicture(req);
  
      expect(service.deleteProfilePicture).toHaveBeenCalledWith(testUserId); });
  });

  describe('deleteCoverPhoto', () => {
    it('should call deleteCoverPhoto on the service', async () => {
      const testUserId = new Types.ObjectId(); // Ensure valid ObjectId
      const req = { user: { sub: testUserId } };
      await controller.deleteCoverPhoto(req);
      expect(service.deleteCoverPhoto).toHaveBeenCalledWith(testUserId);
    });
  });

  describe('deleteResume', () => {
    it('should call deleteResume on the service', async () => {
      const testUserId = new Types.ObjectId(); // Ensure valid ObjectId
      const req = { user: { sub: testUserId } };
      await controller.deleteResume(req);
      expect(service.deleteResume).toHaveBeenCalledWith(testUserId);
    });
  });

  describe('addSkill', () => {
    it('should call addSkill on the service', async () => {
      const skillDto: SkillDto = { skillName: 'NestJS' };
      const testUserId = new Types.ObjectId(); // Ensure valid ObjectId
      const req = { user: { sub: testUserId } };
      await controller.addSkill(req, skillDto);
      expect(service.addSkill).toHaveBeenCalledWith(skillDto, testUserId);
    });
  });

  describe('deleteSkill', () => {
    it('should call deleteSkill on the service', async () => {
      const testUserId = new Types.ObjectId(); // Ensure valid ObjectId
      const req = { user: { sub: testUserId } };
      await controller.deleteSkill(req, 'NestJS');
      expect(service.deleteSkill).toHaveBeenCalledWith('NestJS', testUserId);
    });
  });
});
