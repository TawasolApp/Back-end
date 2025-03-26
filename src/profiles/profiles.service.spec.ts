import { Test, TestingModule } from '@nestjs/testing';
import { ProfilesService } from './profiles.service';
import { getModelToken } from '@nestjs/mongoose';
import { Profile } from './infrastructure/database/profile.schema';
import {  Model, Types } from 'mongoose';
import { NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { ProfilesController } from './profiles.controller';
import { JwtService } from '@nestjs/jwt';

import { CreateProfileDto } from './dto/create-profile.dto';
import { toGetProfileDto } from './dto/profile.mapper';

import { UpdateProfileDto } from './dto/update-profile.dto';

const mockProfile = {
  _id: new Types.ObjectId(),
  name: 'John Doe',
  headline: 'Software Engineer',
  bio: 'Passionate Developer',
  location: 'Cairo, Egypt',
  industry: 'Technology',
  skills: [{ skill_name: 'JavaScript', endorsements: [] }],
  profile_picture: '',
  cover_photo: '',
  resume: '',
  visibility: 'public',
  connection_count: 0,
  education: [],
  certification: [],
  work_experience: [],
  plan_details: 
    {
      plan_type: 'premium',
      start_date: new Date(),
      expiry_date: new Date(),
      auto_renewal: false,
    },
  
  plan_statistics: 
    {
      statistic_type: 'Connections',
      value: 0,
      message_count: 0,
      application_count: 0,
    },
 
  save: jest.fn(),
  
};

describe('ProfilesService', () => {
  let service: ProfilesService;
  let profileModel: Model<Profile>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProfilesController],
      providers: [
        JwtService,
        
        ProfilesService,
        {
          provide: getModelToken(Profile.name),
          useValue: {
            findById: jest.fn(),
            findOneAndUpdate: jest.fn(),
            create: jest.fn(),
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
  
  describe('createProfile', () => {
    it('should create a profile', async () => {
      const dto: CreateProfileDto = { name: 'John Doe' };
      jest.spyOn(profileModel, 'create').mockResolvedValue(mockProfile as any);
      const result = await service.createProfile(new Types.ObjectId,dto);
      expect(result).toEqual(toGetProfileDto(mockProfile));
    });
    it('should throw ConflictException if profile already exists (duplicate key error)', async () => {
      const dto: CreateProfileDto = { name: 'John Doe' };
      
      // Mock the `create` method to throw a duplicate key error (MongoDB error code 11000)
      jest.spyOn(profileModel, 'create').mockRejectedValue({ code: 11000 });
    
      await expect(service.createProfile(new Types.ObjectId(), dto)).rejects.toThrow(ConflictException);
    });
    it('should throw BadRequestException if ObjectId is invalid', async () => {
      const invalidId = '12345'; // Not a valid MongoDB ObjectId
      const dto: CreateProfileDto = { name: 'John Doe' };
      await expect(service.createProfile(invalidId as any, dto)).rejects.toThrow(
        BadRequestException
      );
    });
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

    it('should throw BadRequestException if ObjectId is invalid', async () => {
      const invalidId = '12345'; // Not a valid MongoDB ObjectId
    
      await expect(service.getProfile(invalidId as any)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('updateProfile', () => {
    it('should update a profile', async () => {
      const dto: UpdateProfileDto = {
        headline: 'Updated Headline',
        name: ''
      };
      jest.spyOn(profileModel, 'findOneAndUpdate').mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockProfile),
      } as any);

      const result = await service.updateProfile(dto, mockProfile._id);
      expect(result).toEqual(toGetProfileDto(mockProfile));
    });

    it('should throw NotFoundException if profile not found', async () => {
      jest.spyOn(profileModel, 'findOneAndUpdate').mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      } as any);
      await expect(service.updateProfile({
        name: ''
      }, new Types.ObjectId())).rejects.toThrow(NotFoundException);
    });
    it('should throw BadRequestException if ObjectId is invalid', async () => {
      const invalidId = '12345'; // Not a valid MongoDB ObjectId
    
      await expect(service.updateProfile({name:'' }, invalidId as any)).rejects.toThrow(
        BadRequestException,
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
    it('should throw BadRequestException if ObjectId is invalid', async () => {
      const invalidId = '12345'; // Not a valid MongoDB ObjectId
    
      await expect(service.deleteProfileField(invalidId as any, 'headline')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('addSkill', () => {
    it('should add a skill to profile', async () => {
      jest.spyOn(profileModel, 'findById').mockResolvedValue(mockProfile);
      jest.spyOn(profileModel, 'findOneAndUpdate').mockResolvedValue({
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
    it('should throw BadRequestException if ObjectId is invalid', async () => {
      const invalidId = '12345'; // Not a valid MongoDB ObjectId
    
      await expect(service.addSkill({ skillName: 'JavaScript' },invalidId as any)).rejects.toThrow(
        BadRequestException,
      );
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
    it('should throw BadRequestException if ObjectId is invalid', async () => {
      const invalidId = '12345'; // Not a valid MongoDB ObjectId
    
      await expect(service.deleteSkill('Python',invalidId as any)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('deleteHeadline', () => {
    it('should call deleteProfileField with "headline"', async () => {
      const deleteProfileFieldSpy = jest
        .spyOn(service, 'deleteProfileField')
        .mockResolvedValue({ 
          ...mockProfile, 
          headline: undefined, 
          skills: mockProfile.skills.map(skill => ({ skillName: skill.skill_name, endorsements: skill.endorsements }))
        });

      await service.deleteHeadline(mockProfile._id);
      expect(deleteProfileFieldSpy).toHaveBeenCalledWith(mockProfile._id, 'headline');
    });
  });

  describe('deleteBio', () => {
    it('should call deleteProfileField with "bio"', async () => {
      const deleteProfileFieldSpy = jest
        .spyOn(service, 'deleteProfileField')
        .mockResolvedValue({ 
          ...mockProfile, 
          bio: undefined, 
          skills: mockProfile.skills.map(skill => ({ skillName: skill.skill_name, endorsements: skill.endorsements }))
        });
      await service.deleteBio(mockProfile._id);
      expect(deleteProfileFieldSpy).toHaveBeenCalledWith(mockProfile._id, 'bio');
    });
  });
  
    describe('deleteLocation', () => {
    it('should call deleteProfileField with "location"', async () => {
      const deleteProfileFieldSpy = jest
        .spyOn(service, 'deleteProfileField')
        .mockResolvedValue({ 
          ...mockProfile, 
          location: undefined, 
          skills: mockProfile.skills.map(skill => ({ skillName: skill.skill_name, endorsements: skill.endorsements }))
        });
      await service.deleteLocation(mockProfile._id);
      expect(deleteProfileFieldSpy).toHaveBeenCalledWith(mockProfile._id, 'location');
    });
  });
  
   describe('deleteIndustry', () => {
    it('should call deleteProfileField with "industry"', async () => {
      const deleteProfileFieldSpy = jest
        .spyOn(service, 'deleteProfileField')
        .mockResolvedValue({ 
          ...mockProfile, 
          industry: undefined, 
          skills: mockProfile.skills.map(skill => ({ skillName: skill.skill_name, endorsements: skill.endorsements }))
        });
      await service.deleteIndustry(mockProfile._id);
      expect(deleteProfileFieldSpy).toHaveBeenCalledWith(mockProfile._id, 'industry');
    });
  });
  
    describe('deleteProfilePicture', () => {
    it('should call deleteProfileField with "profile_picture"', async () => {
      const deleteProfileFieldSpy = jest
        .spyOn(service, 'deleteProfileField')
        .mockResolvedValue({ 
          ...mockProfile, 
          profilePicture: undefined, 
          skills: mockProfile.skills.map(skill => ({ skillName: skill.skill_name, endorsements: skill.endorsements }))
        });
      await service.deleteProfilePicture(mockProfile._id);
      expect(deleteProfileFieldSpy).toHaveBeenCalledWith(mockProfile._id, 'profile_picture');
    });
  });
  
    describe('deleteCoverPhoto', () => {
    it('should call deleteProfileField with "cover_photo"', async () => {
      const deleteProfileFieldSpy = jest
        .spyOn(service, 'deleteProfileField')
        .mockResolvedValue({ 
          ...mockProfile, 
          coverPhoto: undefined, 
          skills: mockProfile.skills.map(skill => ({ skillName: skill.skill_name, endorsements: skill.endorsements }))
        });
  
      await service.deleteCoverPhoto(mockProfile._id);
      expect(deleteProfileFieldSpy).toHaveBeenCalledWith(mockProfile._id, 'cover_photo');
    });
  });
  
    describe('deleteResume', () => {
    it('should call deleteProfileField with "resume"', async () => {
      const deleteProfileFieldSpy = jest
        .spyOn(service, 'deleteProfileField')
        .mockResolvedValue({ 
          ...mockProfile, 
          resume: undefined, 
          skills: mockProfile.skills.map(skill => ({ skillName: skill.skill_name, endorsements: skill.endorsements }))
        });
  
      await service.deleteResume(mockProfile._id);
      expect(deleteProfileFieldSpy).toHaveBeenCalledWith(mockProfile._id, 'resume');
    });
  });
  
});
