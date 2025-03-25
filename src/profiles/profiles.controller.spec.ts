import { Test, TestingModule } from '@nestjs/testing';
import { ProfilesController } from './profiles.controller';
import { ProfilesService } from './profiles.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { SkillDto } from './dto/skill.dto';
import { Types } from 'mongoose';

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
      await controller.updateProfile(dto);
      expect(service.updateProfile).toHaveBeenCalledWith(dto, expect.any(Types.ObjectId));
    });
  });

  describe('deleteProfilePicture', () => {
    it('should call deleteProfilePicture on the service', async () => {
      const req = { user: { sub: 'test-user' } };
      await controller.deleteProfilePicture(req);
      expect(service.deleteProfilePicture).toHaveBeenCalledWith(expect.any(Types.ObjectId));
    });
  });

  describe('deleteCoverPhoto', () => {
    it('should call deleteCoverPhoto on the service', async () => {
      await controller.deleteCoverPhoto();
      expect(service.deleteCoverPhoto).toHaveBeenCalledWith(expect.any(Types.ObjectId));
    });
  });

  describe('deleteResume', () => {
    it('should call deleteResume on the service', async () => {
      await controller.deleteResume();
      expect(service.deleteResume).toHaveBeenCalledWith(expect.any(Types.ObjectId));
    });
  });

  describe('addSkill', () => {
    it('should call addSkill on the service', async () => {
      const skillDto: SkillDto = { skillName: 'NestJS' };
      await controller.addSkill(skillDto);
      expect(service.addSkill).toHaveBeenCalledWith(skillDto, expect.any(Types.ObjectId));
    });
  });

  describe('deleteSkill', () => {
    it('should call deleteSkill on the service', async () => {
      await controller.deleteSkill('NestJS');
      expect(service.deleteSkill).toHaveBeenCalledWith('NestJS', expect.any(Types.ObjectId));
    });
  });
});
