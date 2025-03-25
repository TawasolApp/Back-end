import { Test, TestingModule } from '@nestjs/testing';
import { ProfilesService } from './profiles.service';
import { getModelToken } from '@nestjs/mongoose';
import { Profile } from './infrastructure/database/profile.schema';
import { Model, Types } from 'mongoose';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ProfilesController } from './profiles.controller';

const mockProfile = {
  _id: new Types.ObjectId(),
  name: 'John Doe',
  headline: 'Software Engineer',
  bio: 'Passionate Developer',
  location: 'Cairo, Egypt',
  industry: 'Technology',
  skills: [{ skill_name: 'JavaScript', endorsements: [] }],
  save: jest.fn(),
};

describe('ProfilesService', () => {
  let service: ProfilesService;
  let profileModel: Model<Profile>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProfilesController],
      providers: [
        
        ProfilesService,
        {
          provide: getModelToken(Profile.name),
          useValue: {
            findById: jest.fn(),
            findOneAndUpdate: jest.fn(),
            findByIdAndUpdate: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ProfilesService>(ProfilesService);
    profileModel = module.get<Model<Profile>>(getModelToken(Profile.name));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getProfile', () => {
    it('should return a profile if found', async () => {
      jest.spyOn(profileModel, 'findById').mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockProfile),
      } as any);

      const result = await service.getProfile(mockProfile._id);
      expect(result).toBeDefined();
      expect(result.name).toBe('John Doe');
    });

    it('should throw NotFoundException if profile is not found', async () => {
      jest.spyOn(profileModel, 'findById').mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      } as any);

      await expect(service.getProfile(new Types.ObjectId())).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('deleteProfileField', () => {
    it('should remove a profile field and return updated profile', async () => {
      jest.spyOn(profileModel, 'findById').mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockProfile),
      } as any);

      jest.spyOn(profileModel, 'findOneAndUpdate').mockReturnValue({
        exec: jest.fn().mockResolvedValue({ ...mockProfile, headline: undefined }),
      } as any);

      const result = await service.deleteProfileField(mockProfile._id, 'headline');
      expect(result.headline).toBeNull();
    });

    it('should throw NotFoundException if profile does not exist', async () => {
      jest.spyOn(profileModel, 'findById').mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      } as any);

      await expect(
        service.deleteProfileField(new Types.ObjectId(), 'headline'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if field is already unset', async () => {
      jest.spyOn(profileModel, 'findById').mockReturnValue({
        exec: jest.fn().mockResolvedValue({ _id: mockProfile._id }),
      } as any);

      await expect(
        
        service.deleteProfileField(mockProfile._id, 'headline'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('addSkill', () => {
    it('should add a skill to profile', async () => {
      jest.spyOn(profileModel, 'findById').mockResolvedValue(mockProfile);
      jest.spyOn(profileModel, 'findByIdAndUpdate').mockResolvedValue({
        ...mockProfile,
        skills: [...mockProfile.skills, { skill_name: 'NestJS', endorsements: [] }],
      });

      const result = await service.addSkill({ skillName: 'NestJS' }, mockProfile._id);
      expect(result.skills?.length).toBe(2);
    });

    it('should throw NotFoundException if profile is not found', async () => {
      jest.spyOn(profileModel, 'findById').mockResolvedValue(null);

      await expect(service.addSkill({ skillName: 'NestJS' }, new Types.ObjectId())).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if skill already exists', async () => {
      jest.spyOn(profileModel, 'findById').mockResolvedValue(mockProfile);

      await expect(
        service.addSkill({ skillName: 'JavaScript' }, mockProfile._id),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('deleteSkill', () => {
    it('should delete a skill from the profile', async () => {
      jest.spyOn(profileModel, 'findOneAndUpdate').mockResolvedValue({
        ...mockProfile,
        skills: [],
      });

      const result = await service.deleteSkill('JavaScript', mockProfile._id);
      expect(result.skills?.length).toBe(0);
    });

    it('should throw NotFoundException if skill is not found', async () => {
      jest.spyOn(profileModel, 'findOneAndUpdate').mockResolvedValue(null);

      await expect(service.deleteSkill('Python', mockProfile._id)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
