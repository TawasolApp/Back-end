import { Test, TestingModule } from '@nestjs/testing';
import { ProfilesService } from './profiles.service';
import { getModelToken } from '@nestjs/mongoose';
import { Profile } from './infrastructure/database/schemas/profile.schema';
import {  Model, Types } from 'mongoose';
import { NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { ProfilesController } from './profiles.controller';
import { JwtService } from '@nestjs/jwt';
import {  Visibility, EmploymentType, LocationType, PlanType } from './infrastructure/database/enums/profile-enums';


import { CreateProfileDto } from './dto/create-profile.dto';
import { toGetProfileDto } from './dto/profile.mapper';

import { UpdateProfileDto } from './dto/update-profile.dto';
import { SkillDto } from './dto/skill.dto';
import { EducationDto } from './dto/education.dto';
import { CertificationDto } from './dto/certification.dto';

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
  visibility: Visibility.PUBLIC,
  connection_count: 0,
  education: [{ _id: new Types.ObjectId(), school: 'Test University', degree: 'BSc' ,field:'science',start_date: new Date(),end_date: new Date(),grade:'4',description:'easy'}],
  certification: [{ _id: new Types.ObjectId(), name: 'AWS Certified',company:'',issue_date: new Date()}],
  work_experience: [],
  plan_details: 
    {
      plan_type: PlanType.MONTHLY,
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
    it('should throw BadRequestException when profile creation fails', async () => {
      // Mock `create` to throw a generic error (not a duplicate key error)
      jest.spyOn(profileModel, 'create').mockRejectedValue(new Error('Database error'));
  
      const id = new Types.ObjectId();
      const createProfileDto = { name: 'John Doe', bio: 'Software Engineer' };
  
      await expect(service.createProfile(id, createProfileDto)).rejects.toThrow(
        new BadRequestException('Failed to create profile'),
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
    it('should throw NotFoundException when updated profile is not found', async () => {
      const id = new Types.ObjectId();
      const field = 'bio';
  
      // Mock `findById().exec()` to return a profile (valid profile)
      jest.spyOn(profileModel, 'findById').mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue({ _id: id, [field]: 'Software Engineer' }),
      } as any);
  
      // Mock `findOneAndUpdate().exec()` to return null (simulating update failure)
      jest.spyOn(profileModel, 'findOneAndUpdate').mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue(null),
      } as any);      
      jest.spyOn(profileModel, 'findById').mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue(null),
      } as any);
  
      await expect(service.deleteProfileField(id, field)).rejects.toThrow(
        new NotFoundException('Updated Profile not found'),
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
      ).rejects.toThrow(ConflictException);
    });
    it('should throw BadRequestException if ObjectId is invalid', async () => {
      const invalidId = '12345'; // Not a valid MongoDB ObjectId
    
      await expect(service.addSkill({ skillName: 'JavaScript' },invalidId as any)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException when updated profile is not found after adding skill', async () => {
      const id = new Types.ObjectId();
      const skill: SkillDto = { skillName: 'JavaScript' };
  
      // Mock `findById().exec()` to return a profile (valid profile)
      jest.spyOn(profileModel, 'findById').mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue({ _id: id, skills: [] }),
      } as any);
  
      // Mock `findOneAndUpdate().exec()` to return null (simulating update failure)
      jest.spyOn(profileModel, 'findOneAndUpdate').mockResolvedValue(null);
  
      await expect(service.addSkill(skill, id)).rejects.toThrow(
        new NotFoundException('updated Profile not found'),
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
          skills: mockProfile.skills.map(skill => ({ skillName: skill.skill_name, endorsements: skill.endorsements })),
          education: mockProfile.education.map(education => ({ _id:mockProfile._id ,school: education.school, degree: education.degree, field: education.field, start_date: education.start_date, end_date: education.end_date, grade: education.grade, description: education.description })),
          certification: mockProfile.certification.map(certification => ({ _id:mockProfile._id ,name: certification.name, company: certification.company, issueDate: certification.issue_date })),
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
          skills: mockProfile.skills.map(skill => ({ skillName: skill.skill_name, endorsements: skill.endorsements })),
          education: mockProfile.education.map(education => ({ _id:mockProfile._id ,school: education.school, degree: education.degree, field: education.field, start_date: education.start_date, end_date: education.end_date, grade: education.grade, description: education.description })),
          certification: mockProfile.certification.map(certification => ({ _id:mockProfile._id ,name: certification.name, company: certification.company, issueDate: certification.issue_date })),
    
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
          skills: mockProfile.skills.map(skill => ({ skillName: skill.skill_name, endorsements: skill.endorsements })),
          education: mockProfile.education.map(education => ({ _id:mockProfile._id ,school: education.school, degree: education.degree, field: education.field, start_date: education.start_date, end_date: education.end_date, grade: education.grade, description: education.description })),
          certification: mockProfile.certification.map(certification => ({ _id:mockProfile._id ,name: certification.name, company: certification.company, issueDate: certification.issue_date })),
    
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
          skills: mockProfile.skills.map(skill => ({ skillName: skill.skill_name, endorsements: skill.endorsements })),
          education: mockProfile.education.map(education => ({ _id:mockProfile._id ,school: education.school, degree: education.degree, field: education.field, start_date: education.start_date, end_date: education.end_date, grade: education.grade, description: education.description })),
          certification: mockProfile.certification.map(certification => ({ _id:mockProfile._id ,name: certification.name, company: certification.company, issueDate: certification.issue_date })),
    
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
          skills: mockProfile.skills.map(skill => ({ skillName: skill.skill_name, endorsements: skill.endorsements })),
          education: mockProfile.education.map(education => ({ _id:mockProfile._id ,school: education.school, degree: education.degree, field: education.field, start_date: education.start_date, end_date: education.end_date, grade: education.grade, description: education.description })),
          certification: mockProfile.certification.map(certification => ({ _id:mockProfile._id ,name: certification.name, company: certification.company, issueDate: certification.issue_date })),
    
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
          skills: mockProfile.skills.map(skill => ({ skillName: skill.skill_name, endorsements: skill.endorsements })),
          education: mockProfile.education.map(education => ({ _id:mockProfile._id ,school: education.school, degree: education.degree, field: education.field, start_date: education.start_date, end_date: education.end_date, grade: education.grade, description: education.description })),
          certification: mockProfile.certification.map(certification => ({ _id:mockProfile._id ,name: certification.name, company: certification.company, issueDate: certification.issue_date })),
    
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
          skills: mockProfile.skills.map(skill => ({ skillName: skill.skill_name, endorsements: skill.endorsements })),
          education: mockProfile.education.map(education => ({ _id:mockProfile._id ,school: education.school, degree: education.degree, field: education.field, start_date: education.start_date, end_date: education.end_date, grade: education.grade, description: education.description })),
          certification: mockProfile.certification.map(certification => ({ _id:mockProfile._id ,name: certification.name, company: certification.company, issueDate: certification.issue_date })),
    
        });
  
      await service.deleteResume(mockProfile._id);
      expect(deleteProfileFieldSpy).toHaveBeenCalledWith(mockProfile._id, 'resume');
    });
  });
  describe('addEducation', () => {
    it('should add an education entry to profile', async () => {
      jest.spyOn(profileModel, 'findById').mockResolvedValue(mockProfile);
      jest.spyOn(profileModel, 'findOneAndUpdate').mockResolvedValue({
        ...mockProfile,
        education: [...mockProfile.education, { 
          school: 'New Uni', 
          degree: 'MSc', 
          field: '', 
          startDate: new Date(), 
          grade: '', 
          description: '' 
        }],
      });
  
      const result = await service.addEducation(
        { 
          school: 'New Uni', 
          degree: 'MSc', 
          field: '', 
          startDate: new Date(), 
          grade: '', 
          description: '' 
        }, 
        mockProfile._id
      );
  
      expect(result.education?.length).toBe(2);
    });
  
    it('should throw NotFoundException if profile is not found', async () => {
      jest.spyOn(profileModel, 'findById').mockResolvedValue(null);
  
      await expect(service.addEducation(
        { 
          school: 'New Uni', 
          degree: 'MSc', 
          field: '', 
          startDate: new Date(), 
          grade: '', 
          description: '' 
        }, 
        new Types.ObjectId()
      )).rejects.toThrow(NotFoundException);
    });
  
   
    it('should throw BadRequestException if ObjectId is invalid', async () => {
      const invalidId = '12345'; // Not a valid MongoDB ObjectId
  
      await expect(service.addEducation(
        { 
          school: 'New Uni', 
          degree: 'MSc', 
          field: '', 
          startDate: new Date(), 
          grade: '', 
          description: '' 
        }, 
        invalidId as any
      )).rejects.toThrow(BadRequestException);
    });
  
    it('should throw NotFoundException when updated profile is not found after adding education', async () => {
      const id = new Types.ObjectId();
      const education: EducationDto = { 
        school: 'New Uni', 
        degree: 'MSc', 
        field: '', 
        startDate: new Date(), 
        grade: '', 
        description: '' 
      };
  
      // Mock `findById().exec()` to return a profile
      jest.spyOn(profileModel, 'findById').mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue({ _id: id, education: [] }),
      } as any);
  
      // Mock `findOneAndUpdate().exec()` to return null (simulating update failure)
      jest.spyOn(profileModel, 'findOneAndUpdate').mockResolvedValue(null);
  
      await expect(service.addEducation(education, id)).rejects.toThrow(
        new NotFoundException('Updated Profile not found'),
      );
    });
  
  });
  

  describe('editEducation', () => {
    it('should edit an education entry successfully', async () => {
      jest.spyOn(profileModel, 'findById').mockResolvedValue(mockProfile);
      jest.spyOn(profileModel, 'findOneAndUpdate').mockResolvedValue({
        ...mockProfile,
        education: [
          { ...mockProfile.education[0], degree: 'Updated Degree' },
        ],
      });
  
      const result = await service.editEducation(
        { degree: 'Updated Degree' },
        mockProfile._id,
        mockProfile.education[0]._id
      );
      expect(result.education?.[0]?.degree).toBe('Updated Degree');
    });
  
    it('should throw BadRequestException if profile ID is invalid', async () => {
      await expect(
        service.editEducation({ degree: 'Updated' }, 'invalidId' as any, new Types.ObjectId())
      ).rejects.toThrow(BadRequestException);
    });
  
    it('should throw NotFoundException if profile is not found', async () => {
      jest.spyOn(profileModel, 'findById').mockResolvedValue(null);
  
      await expect(
        service.editEducation({ degree: 'Updated' }, new Types.ObjectId(), new Types.ObjectId())
      ).rejects.toThrow(NotFoundException);
    });
  
    it('should throw NotFoundException if education entry is not found in profile', async () => {
      jest.spyOn(profileModel, 'findById').mockResolvedValue(mockProfile);
  
      await expect(
        service.editEducation({ degree: 'Updated' }, mockProfile._id, new Types.ObjectId())
      ).rejects.toThrow(NotFoundException);
    });
  
    it('should throw NotFoundException if updated profile is not found after edit', async () => {
      jest.spyOn(profileModel, 'findById').mockResolvedValue(mockProfile);
      jest.spyOn(profileModel, 'findOneAndUpdate').mockResolvedValue(null);
  
      await expect(
        service.editEducation({ degree: 'Updated' }, mockProfile._id, mockProfile.education[0]._id)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteEducation', () => {
    const educationId = new Types.ObjectId();
    const profileId = new Types.ObjectId();
    
    it('should delete an education entry successfully', async () => {
      const mockProfile = { _id: profileId, education: [{ _id: educationId }] };
  
      jest.spyOn(profileModel, 'findById').mockResolvedValue(mockProfile);
      jest.spyOn(profileModel, 'findOneAndUpdate').mockResolvedValue({
        ...mockProfile,
        education: [], // Simulating education entry removal
      });
  
      const result = await service.deleteEducation(educationId, profileId);
      expect(result?.education?.length).toBe(0);
    });
  
    it('should throw BadRequestException if profile ID is invalid', async () => {
      await expect(service.deleteEducation(educationId, '12345' as any)).rejects.toThrow(
        BadRequestException,
      );
    });
  
    it('should throw NotFoundException if profile is not found', async () => {
      jest.spyOn(profileModel, 'findById').mockResolvedValue(null);
  
      await expect(service.deleteEducation(educationId, profileId)).rejects.toThrow(
        NotFoundException,
      );
    });
  
    it('should throw NotFoundException if education entry is not found', async () => {
      const mockProfile = { _id: profileId, education: [] };
  
      jest.spyOn(profileModel, 'findById').mockResolvedValue(mockProfile);
      jest.spyOn(profileModel, 'findOneAndUpdate').mockResolvedValue(null);
  
      await expect(service.deleteEducation(educationId, profileId)).rejects.toThrow(
        NotFoundException,
      );
    });
  
    it('should throw NotFoundException when updated profile is not found after deletion', async () => {
      jest.spyOn(profileModel, 'findById').mockResolvedValue({ _id: profileId, education: [{ _id: educationId }] });
      jest.spyOn(profileModel, 'findOneAndUpdate').mockResolvedValue(null);
  
      await expect(service.deleteEducation(educationId, profileId)).rejects.toThrow(
        new NotFoundException('Education not found in profile'),
      );
    });
  });
  

  describe('addCertification', () => {
    const profileId = new Types.ObjectId();
    const certification: CertificationDto = {
      name: 'AWS Certified Solutions Architect',
      company: 'Amazon',
      issueDate: new Date(),
    };
  
    it('should add a certification successfully', async () => {
      const mockProfile = { _id: profileId, certification: [] };
  
      jest.spyOn(profileModel, 'findById').mockResolvedValue(mockProfile);
      jest.spyOn(profileModel, 'findOneAndUpdate').mockResolvedValue({
        ...mockProfile,
        certification: [certification], // Simulating addition of certification
      });
  
      const result = await service.addCertification(certification, profileId);
      expect((result.certification ?? []).length).toBe(1);
      expect((result.certification ?? [])[0].name).toBe(certification.name);
    });
  
    it('should throw BadRequestException if profile ID is invalid', async () => {
      await expect(service.addCertification(certification, '12345' as any)).rejects.toThrow(
        BadRequestException,
      );
    });
  
    it('should throw NotFoundException if profile is not found', async () => {
      jest.spyOn(profileModel, 'findById').mockResolvedValue(null);
  
      await expect(service.addCertification(certification, profileId)).rejects.toThrow(
        NotFoundException,
      );
    });
  
    it('should throw NotFoundException when updated profile is not found after adding certification', async () => {
      jest.spyOn(profileModel, 'findById').mockResolvedValue({ _id: profileId, certification: [] });
      jest.spyOn(profileModel, 'findOneAndUpdate').mockResolvedValue(null);
  
      await expect(service.addCertification(certification, profileId)).rejects.toThrow(
        new NotFoundException('Updated Profile not found'),
      );
    });
  });
  

  describe('editCertification', () => {
    const profileId = new Types.ObjectId();
    const certificationId = new Types.ObjectId();
    const updatedCertification: Partial<CertificationDto> = {
      name: 'AWS Certified Developer',
      company: 'Amazon',
      issueDate: new Date(),
    };
  
    it('should edit a certification successfully', async () => {
      const mockProfile = {
        _id: profileId,
        certification: [{ _id: certificationId, name: 'Old Cert', company: 'Old Company', issueDate: new Date() }],
      };
  
      jest.spyOn(profileModel, 'findById').mockResolvedValue(mockProfile);
      jest.spyOn(profileModel, 'findOneAndUpdate').mockResolvedValue({
        ...mockProfile,
        certification: [{ _id: certificationId, ...updatedCertification }],
      });
  
      const result = await service.editCertification(updatedCertification, profileId, certificationId);
      expect((result.certification ?? [])[0]?.name).toBe(updatedCertification.name);
    });
  
    it('should throw BadRequestException if profile ID is invalid', async () => {
      await expect(service.editCertification(updatedCertification, '12345' as any, certificationId)).rejects.toThrow(
        BadRequestException,
      );
    });
  
    it('should throw NotFoundException if profile is not found', async () => {
      jest.spyOn(profileModel, 'findById').mockResolvedValue(null);
  
      await expect(service.editCertification(updatedCertification, profileId, certificationId)).rejects.toThrow(
        NotFoundException,
      );
    });
  
    it('should throw NotFoundException if certification is not found in the profile', async () => {
      const mockProfile = { _id: profileId, certification: [] }; // No certification found
  
      jest.spyOn(profileModel, 'findById').mockResolvedValue(mockProfile);
  
      await expect(service.editCertification(updatedCertification, profileId, certificationId)).rejects.toThrow(
        NotFoundException,
      );
    });
  
    it('should throw NotFoundException when updated profile is not found after updating certification', async () => {
      jest.spyOn(profileModel, 'findById').mockResolvedValue({
        _id: profileId,
        certification: [{ _id: certificationId, name: 'Old Cert', company: 'Old Company', issueDate: new Date() }],
      });
  
      jest.spyOn(profileModel, 'findOneAndUpdate').mockResolvedValue(null);
  
      await expect(service.editCertification(updatedCertification, profileId, certificationId)).rejects.toThrow(
        new NotFoundException('Certification not found in profile'),
      );
    });
  });
  

  describe('deleteCertification', () => {
    const profileId = new Types.ObjectId();
    const certificationId = new Types.ObjectId();
  
    it('should delete a certification successfully', async () => {
      const mockProfile = {
        _id: profileId,
        certification: [{ _id: certificationId, name: 'AWS Certified Developer' }],
      };
  
      jest.spyOn(profileModel, 'findOneAndUpdate').mockResolvedValue({
        ...mockProfile,
        certification: [], // Certification removed
      });
  
      const result = await service.deleteCertification(certificationId, profileId);
      expect((result.certification ?? []).length).toBe(0);
    });
  
    it('should throw BadRequestException if profile ID is invalid', async () => {
      await expect(service.deleteCertification(certificationId, '12345' as any)).rejects.toThrow(
        BadRequestException,
      );
    });
  
    it('should throw NotFoundException if certification is not found in profile', async () => {
      jest.spyOn(profileModel, 'findOneAndUpdate').mockResolvedValue(null);
  
      await expect(service.deleteCertification(certificationId, profileId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
  
});
