import { Test, TestingModule } from '@nestjs/testing';
import { ProfilesController } from './profiles.controller';
import { ProfilesService } from './profiles.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { SkillDto } from './dto/skill.dto';
import { Types } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import {
  BadRequestException,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { EducationDto } from './dto/education.dto';
import { CertificationDto } from './dto/certification.dto';
import { handleError } from '../common/utils/exception-handler';
import { CompaniesService } from '../companies/companies.service';
import { EmploymentType, LocationType } from './enums/profile-enums';

describe('ProfilesController', () => {
  let controller: ProfilesController;
  let service: ProfilesService;

  const mockCompaniesService = {
    getCompanyById: jest.fn(),
    createCompany: jest.fn(),
    getFollowedCompanies: jest.fn(),
  };

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
    getSkillEndorsements: jest.fn(),
    editSkillPosition: jest.fn(),
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
        {
          provide: CompaniesService,
          useValue: mockCompaniesService,
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
      const dto: CreateProfileDto = { skills: [{ skillName: 'NestJS' }] };
      const userId = new Types.ObjectId();
      await controller.createProfile({ user: { sub: userId } }, dto);
      expect(service.createProfile).toHaveBeenCalledWith(userId, dto);
    });

    it('should throw UnauthorizedException when user is not authenticated', async () => {
      await expect(
        controller.createProfile({}, {} as CreateProfileDto),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('getProfile', () => {
    const testUserId = new Types.ObjectId();
    const req = { user: { sub: testUserId } };
    it('should get profile successfully with valid ObjectId', async () => {
      const id = new Types.ObjectId().toHexString();
      await controller.getProfile(req, id);
      expect(service.getProfile).toHaveBeenCalled();
    });

    const unauthorizedReq = { user: null };
    it('should throw UnauthorizedException when user is not authenticated', async () => {
      await expect(
        controller.getProfile(unauthorizedReq, 'someId'),
      ).rejects.toThrow(UnauthorizedException);
    });
    it('should throw BadRequestException for invalid ObjectId', async () => {
      await expect(controller.getProfile(req, 'invalid-id')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getMyProfile', () => {
    const testUserId = new Types.ObjectId();
    const req = { user: { sub: testUserId } };
    it('should get profile successfully with valid ObjectId', async () => {
      const id = new Types.ObjectId().toHexString();
      await controller.getMyProfile(req);
      expect(service.getProfile).toHaveBeenCalled(); // This may need to be updated to expect(service.getMyProfile) if the service method is renamed
    });

    const unauthorizedReq = { user: null };
    it('should throw UnauthorizedException when user is not authenticated', async () => {
      await expect(controller.getMyProfile(unauthorizedReq)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('updateProfile', () => {
    it('should update a profile successfully', async () => {
      const dto: UpdateProfileDto = {
        headline: 'Updated Headline',
        firstName: 'Updated Name',
      };
      const testUserId = new Types.ObjectId();
      const req = { user: { sub: testUserId } };
      await controller.updateProfile(req, dto);
      expect(service.updateProfile).toHaveBeenCalledWith(dto, testUserId);
    });

    it('should throw UnauthorizedException when user is not authenticated', async () => {
      await expect(
        controller.updateProfile({}, {} as UpdateProfileDto),
      ).rejects.toThrow(UnauthorizedException);
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
        await expect(controller[method](req)).rejects.toThrow(
          UnauthorizedException,
        );
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
      await expect(controller.addSkill({}, {} as SkillDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
  describe('editSkillPosition', () => {
    const mockSkillName = 'TypeScript';
    const mockPosition = '1';
    const mockUserId = 'user123';

    it('should update skill position successfully', async () => {
      const req = { user: { sub: mockUserId } };
      const expectedResult = { success: true };

      mockProfilesService.editSkillPosition.mockResolvedValue(expectedResult);

      const result = await controller.editSkillPosition(
        req,
        mockSkillName,
        mockPosition,
      );

      expect(result).toEqual(expectedResult);
      expect(mockProfilesService.editSkillPosition).toHaveBeenCalledWith(
        mockSkillName,
        mockPosition,
        mockUserId,
      );
    });

    it('should throw UnauthorizedException if user is not authenticated', async () => {
      const req = { user: null };

      await expect(
        controller.editSkillPosition(req, mockSkillName, mockPosition),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should handle errors using handleError', async () => {
      const req = { user: { sub: mockUserId } };
      const error = new Error('Database failure');

      mockProfilesService.editSkillPosition.mockRejectedValue(error);

      const handleErrorSpy = jest.spyOn(
        require('../common/utils/exception-handler'),
        'handleError',
      );

      await expect(
        controller.editSkillPosition(req, mockSkillName, mockPosition),
      ).rejects.toThrow(InternalServerErrorException);

      expect(handleErrorSpy).toHaveBeenCalledWith(
        error,
        'Failed to add skill.',
      );
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
      await expect(controller.deleteSkill({}, 'NestJS')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('Error Handling', () => {
    it('should throw InternalServerErrorException on service failure', async () => {
      (service.createProfile as jest.Mock).mockImplementation(() => {
        throw new Error('Unexpected error');
      });
      const userId = new Types.ObjectId();
      const dto: CreateProfileDto = { skills: [{ skillName: 'NestJS' }] };
      await expect(
        controller.createProfile({ user: { sub: userId } }, dto),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('Skill Endorsements & Followed Companies', () => {
    const mockUserId = '64b0c123abc456def7890abc';
    const mockObjectId = new Types.ObjectId();
    const skillName = 'TypeScript';

    describe('getSkillEndorsements', () => {
      it('should return skill endorsements successfully', async () => {
        mockProfilesService.getSkillEndorsements.mockResolvedValue([
          'Endorsement1',
          'Endorsement2',
        ]);

        const req = { user: { sub: mockUserId } };
        const result = await controller.getSkillEndorsements(
          req,
          mockObjectId,
          skillName,
        );

        expect(result).toEqual(['Endorsement1', 'Endorsement2']);
        expect(mockProfilesService.getSkillEndorsements).toHaveBeenCalledWith(
          skillName,
          mockObjectId,
        );
      });

      it('should throw UnauthorizedException if user is not authenticated', async () => {
        const req = { user: null };

        await expect(
          controller.getSkillEndorsements(req, mockObjectId, skillName),
        ).rejects.toThrow(UnauthorizedException);
      });

      it('should throw InternalServerErrorException on failure', async () => {
        mockProfilesService.getSkillEndorsements.mockImplementation(() => {
          throw new Error('DB error');
        });

        const req = { user: { sub: mockUserId } };

        await expect(
          controller.getSkillEndorsements(req, mockObjectId, skillName),
        ).rejects.toThrow(InternalServerErrorException);
      });
    });

    describe('getFollowedCompanies', () => {
      it('should return followed companies successfully', async () => {
        mockCompaniesService.getFollowedCompanies.mockResolvedValue([
          'Company1',
          'Company2',
        ]);

        const req = { user: { sub: mockUserId } };
        const result = await controller.getFollowedCompanies(
          'someUserId',
          req,
          1,
          10,
        );

        expect(result).toEqual(['Company1', 'Company2']);
        expect(mockCompaniesService.getFollowedCompanies).toHaveBeenCalledWith(
          'someUserId',
          1,
          10,
        );
      });

      it('should throw UnauthorizedException if user is not authenticated', async () => {
        const req = { user: null };

        await expect(
          controller.getFollowedCompanies('someUserId', req, 1, 10),
        ).rejects.toThrow(UnauthorizedException);
      });

      it('should throw InternalServerErrorException on failure', async () => {
        mockCompaniesService.getFollowedCompanies.mockImplementation(() => {
          throw new Error('Service down');
        });

        const req = { user: { sub: mockUserId } };

        await expect(
          controller.getFollowedCompanies('someUserId', req, 1, 10),
        ).rejects.toThrow(InternalServerErrorException);
      });
    });
  });
});

describe('ProfilesController - Education Methods', () => {
  let controller: ProfilesController;
  let service: ProfilesService;

  const mockProfilesService = {
    addEducation: jest.fn(),
    editEducation: jest.fn(),
    deleteEducation: jest.fn(),
  };
  const mockCompaniesService = {
    getCompanyById: jest.fn(),
    createCompany: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProfilesController],
      providers: [
        JwtService,
        { provide: ProfilesService, useValue: mockProfilesService },
        {
          provide: CompaniesService,
          useValue: mockCompaniesService,
        },
      ],
    }).compile();

    controller = module.get<ProfilesController>(ProfilesController);
    service = module.get<ProfilesService>(ProfilesService);
  });

  const mockEducationDto: EducationDto = {
    school: 'Test University',
    degree: 'BSc',
    field: 'Computer Science',
    startDate: new Date('2020-09-01'),
    endDate: new Date('2024-06-01'),
    grade: 'A',
    description: 'Bachelor in CS',
  };

  const mockUpdatedEducationDto: Partial<EducationDto> = {
    school: 'Updated University',
    degree: 'MSc',
  };

  const mockEducationId = new Types.ObjectId().toString();
  const mockUserId = new Types.ObjectId().toString();

  describe('addEducation', () => {
    it('should add education successfully', async () => {
      mockProfilesService.addEducation.mockResolvedValue(mockEducationDto);
      const req = { user: { sub: mockUserId } };

      const result = await controller.addEducation(req, mockEducationDto);

      expect(result).toEqual(mockEducationDto);
      expect(service.addEducation).toHaveBeenCalledWith(
        mockEducationDto,
        mockUserId,
      );
    });

    it('should throw UnauthorizedException if user is not authenticated', async () => {
      const req = { user: null };

      await expect(
        controller.addEducation(req, mockEducationDto),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should handle errors using handleException', async () => {
      const error = new Error('Database failure');
      mockProfilesService.addEducation.mockRejectedValue(error);
      jest
        .spyOn(require('../common/utils/exception-handler'), 'handleError')
        .mockImplementation((error, message) => {
          throw new InternalServerErrorException(message);
        });

      const req = { user: { sub: mockUserId } };

      await expect(
        controller.addEducation(req, mockEducationDto),
      ).rejects.toThrow(InternalServerErrorException);

      expect(handleError).toHaveBeenCalledWith(
        error,
        'Failed to add education.',
      );
    });
  });

  describe('editEducation', () => {
    it('should edit education successfully', async () => {
      mockProfilesService.editEducation.mockResolvedValue(
        mockUpdatedEducationDto,
      );
      const req = { user: { sub: mockUserId } };

      const result = await controller.editEducation(
        req,
        mockUpdatedEducationDto,
        mockEducationId as any,
      );

      expect(result).toEqual(mockUpdatedEducationDto);
      expect(service.editEducation).toHaveBeenCalledWith(
        mockUpdatedEducationDto,
        mockUserId,
        mockEducationId,
      );
    });

    it('should throw UnauthorizedException if user is not authenticated', async () => {
      const req = { user: null };

      jest
        .spyOn(require('../common/utils/exception-handler'), 'handleError')
        .mockImplementation((error, message) => {
          if (!req.user) {
            throw new UnauthorizedException('User not authenticated');
          }
          throw new InternalServerErrorException(message);
        });

      await expect(
        controller.editEducation(
          req,
          mockUpdatedEducationDto,
          mockEducationId as any,
        ),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should handle errors using handleException', async () => {
      const error = new Error('Database failure');
      mockProfilesService.editEducation.mockRejectedValue(error);
      jest
        .spyOn(require('../common/utils/exception-handler'), 'handleError')
        .mockImplementation((error, message) => {
          if (!mockUserId) {
            throw new UnauthorizedException('User not authenticated');
          }
          throw new InternalServerErrorException(message);
        });

      const req = { user: { sub: mockUserId } };

      await expect(
        controller.editEducation(
          req,
          mockUpdatedEducationDto,
          mockEducationId as any,
        ),
      ).rejects.toThrow(InternalServerErrorException);

      expect(handleError).toHaveBeenCalledWith(
        error,
        'Failed to edit education.',
      );
    });
  });

  describe('deleteEducation', () => {
    it('should delete education successfully', async () => {
      mockProfilesService.deleteEducation.mockResolvedValue({ success: true });
      const req = { user: { sub: mockUserId } };

      const result = await controller.deleteEducation(req, mockEducationId);

      expect(result).toEqual({ success: true });
      expect(service.deleteEducation).toHaveBeenCalledWith(
        new Types.ObjectId(mockEducationId),
        mockUserId,
      );
    });

    it('should throw UnauthorizedException if user is not authenticated', async () => {
      const req = { user: null };

      jest
        .spyOn(require('../common/utils/exception-handler'), 'handleError')
        .mockImplementation((error, message) => {
          if (!req.user) {
            throw new UnauthorizedException('User not authenticated');
          }
          throw new InternalServerErrorException(message);
        });

      await expect(
        controller.deleteEducation(req, mockEducationId),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should handle errors using handleException', async () => {
      const error = new Error('Database failure');
      mockProfilesService.deleteEducation.mockRejectedValue(error);
      jest
        .spyOn(require('../common/utils/exception-handler'), 'handleError')
        .mockImplementation((error, message) => {
          if (!mockUserId) {
            throw new UnauthorizedException('User not authenticated');
          }
          throw new InternalServerErrorException(message);
        });

      const req = { user: { sub: mockUserId } };

      await expect(
        controller.deleteEducation(req, mockEducationId),
      ).rejects.toThrow(InternalServerErrorException);

      expect(handleError).toHaveBeenCalledWith(
        error,
        'Failed to delete education.',
      );
    });
  });
});

describe('ProfilesController - Certification Methods', () => {
  let controller: ProfilesController;
  let service: ProfilesService;
  const mockCompaniesService = {
    getCompanyById: jest.fn(),
    createCompany: jest.fn(),
  };

  const mockProfilesService = {
    addCertification: jest.fn(),
    editCertification: jest.fn(),
    deleteCertification: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProfilesController],
      providers: [
        JwtService,
        { provide: ProfilesService, useValue: mockProfilesService },
        {
          provide: CompaniesService,
          useValue: mockCompaniesService,
        },
      ],
    }).compile();

    controller = module.get<ProfilesController>(ProfilesController);
    service = module.get<ProfilesService>(ProfilesService);
  });

  const mockCertificationDto: CertificationDto = {
    name: 'AWS Certified Developer',
    company: 'Amazon',
    issueDate: new Date('2023-01-01'),
    expiryDate: new Date('2025-01-01'),
    companyId: new Types.ObjectId(),
    companyLogo: 'https://example.com/logo.png',
  };

  const mockCertificationId = new Types.ObjectId().toString();
  const mockUserId = new Types.ObjectId().toString();

  describe('addCertification', () => {
    it('should add certification successfully', async () => {
      mockProfilesService.addCertification.mockResolvedValue(
        mockCertificationDto,
      );

      const req = { user: { sub: mockUserId } };
      const result = await controller.addCertification(
        req,
        mockCertificationDto,
      );

      expect(result).toEqual(mockCertificationDto);
      expect(service.addCertification).toHaveBeenCalledWith(
        mockCertificationDto,
        mockUserId,
      );
    });

    it('should throw UnauthorizedException if user is not authenticated', async () => {
      const req = { user: null };

      jest
        .spyOn(require('../common/utils/exception-handler'), 'handleError')
        .mockImplementation((error, message) => {
          if (!req.user) {
            throw new UnauthorizedException('User not authenticated');
          }
          throw new InternalServerErrorException(message);
        });

      await expect(
        controller.addCertification(req, mockCertificationDto),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should handle errors using handleException', async () => {
      const error = new Error('Database failure');
      mockProfilesService.addCertification.mockRejectedValue(error);
      jest
        .spyOn(require('../common/utils/exception-handler'), 'handleError')
        .mockImplementation((error, message) => {
          if (!req.user) {
            throw new UnauthorizedException('User not authenticated');
          }
          throw new InternalServerErrorException(message);
        });

      const req = { user: { sub: mockUserId } };

      await expect(
        controller.addCertification(req, mockCertificationDto),
      ).rejects.toThrow(InternalServerErrorException);

      expect(handleError).toHaveBeenCalledWith(
        error,
        'Failed to add certification.',
      );
    });
  });

  describe('editCertification', () => {
    it('should edit certification successfully', async () => {
      const updateDto: Partial<CertificationDto> = {
        name: 'Updated Certification',
      };
      mockProfilesService.editCertification.mockResolvedValue(updateDto);

      const req = { user: { sub: mockUserId } };
      const result = await controller.editCertification(
        req,
        updateDto,
        mockCertificationId as any,
      );

      expect(result).toEqual(updateDto);
      expect(service.editCertification).toHaveBeenCalledWith(
        updateDto,
        mockUserId,
        mockCertificationId,
      );
    });

    it('should throw UnauthorizedException if user is not authenticated', async () => {
      const req = { user: null };

      jest
        .spyOn(require('../common/utils/exception-handler'), 'handleError')
        .mockImplementation((error, message) => {
          if (!req.user) {
            throw new UnauthorizedException('User not authenticated');
          }
          throw new InternalServerErrorException(message);
        });

      await expect(
        controller.editCertification(
          req,
          mockCertificationDto,
          mockCertificationId as any,
        ),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should handle errors using handleException', async () => {
      const error = new Error('Database failure');
      mockProfilesService.editCertification.mockRejectedValue(error);
      jest
        .spyOn(require('../common/utils/exception-handler'), 'handleError')
        .mockImplementation((error, message) => {
          throw new InternalServerErrorException(message);
        });

      const req = { user: { sub: mockUserId } };

      await expect(
        controller.editCertification(req, {}, mockCertificationId as any),
      ).rejects.toThrow(InternalServerErrorException);

      expect(handleError).toHaveBeenCalledWith(
        error,
        'Failed to edit certification.',
      );
    });
  });

  describe('deleteCertification', () => {
    it('should delete certification successfully', async () => {
      mockProfilesService.deleteCertification.mockResolvedValue({
        success: true,
      });

      const req = { user: { sub: mockUserId } };
      const result = await controller.deleteCertification(
        req,
        mockCertificationId,
      );

      expect(result).toEqual({ success: true });
      expect(service.deleteCertification).toHaveBeenCalledWith(
        new Types.ObjectId(mockCertificationId),
        mockUserId,
      );
    });

    it('should throw UnauthorizedException if user is not authenticated', async () => {
      const req = { user: null };

      jest
        .spyOn(require('../common/utils/exception-handler'), 'handleError')
        .mockImplementation((error, message) => {
          if (!req.user) {
            throw new UnauthorizedException('User not authenticated');
          }
          throw new InternalServerErrorException(message);
        });

      await expect(
        controller.deleteCertification(req, mockCertificationDto as any),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should handle errors using handleException', async () => {
      const error = new Error('Database failure');
      mockProfilesService.deleteCertification.mockRejectedValue(error);
      jest
        .spyOn(require('../common/utils/exception-handler'), 'handleError')
        .mockImplementation((error, message) => {
          throw new InternalServerErrorException(message);
        });

      const req = { user: { sub: mockUserId } };

      await expect(
        controller.deleteCertification(req, mockCertificationId),
      ).rejects.toThrow(InternalServerErrorException);

      expect(handleError).toHaveBeenCalledWith(
        error,
        'Failed to delete certification.',
      );
    });
  });
});

describe('ProfilesController - Work-Experience Methods', () => {
  let controller: ProfilesController;
  let service: ProfilesService;
  const mockCompaniesService = {
    getCompanyById: jest.fn(),
    createCompany: jest.fn(),
  };

  const mockProfilesService = {
    addWorkExperience: jest.fn(),
    editWorkExperience: jest.fn(),
    deleteWorkExperience: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProfilesController],
      providers: [
        JwtService,
        { provide: ProfilesService, useValue: mockProfilesService },
        {
          provide: CompaniesService,
          useValue: mockCompaniesService,
        },
      ],
    }).compile();

    controller = module.get<ProfilesController>(ProfilesController);
    service = module.get<ProfilesService>(ProfilesService);
  });

  const mockUserId = '64b0c123abc456def7890abc';
  const mockWorkExperienceDto = {
    title: 'Software Engineer',
    company: 'OpenAI',
    startDate: new Date('2021-01-01'),
    endDate: new Date('2023-01-01'),
    description: 'Worked on cool stuff',
    employmentType: EmploymentType.FULL_TIME,
    location: 'Remote',
    locationType: LocationType.REMOTE,
  };

  const mockUpdatedDto = {
    title: 'Senior Software Engineer',
  };

  const mockWorkExperienceId = new Types.ObjectId().toString();

  describe('Work Experience Methods', () => {
    describe('addWorkExperience', () => {
      it('should add work experience successfully', async () => {
        mockProfilesService.addWorkExperience.mockResolvedValue('mockResult');

        const req = { user: { sub: mockUserId } };
        const result = await controller.addWorkExperience(
          req,
          mockWorkExperienceDto,
        );

        expect(result).toBe('mockResult');
        expect(mockProfilesService.addWorkExperience).toHaveBeenCalledWith(
          mockWorkExperienceDto,
          mockUserId,
        );
      });

      it('should throw UnauthorizedException if user is not authenticated', async () => {
        const req = { user: null };

        jest
          .spyOn(require('../common/utils/exception-handler'), 'handleError')
          .mockImplementation((error, message) => {
            if (!req.user) {
              throw new UnauthorizedException('User not authenticated');
            }
            throw new InternalServerErrorException(message);
          });

        await expect(
          controller.addWorkExperience(req, mockWorkExperienceDto),
        ).rejects.toThrow(UnauthorizedException);
      });

      it('should handle errors using handleException', async () => {
        const error = new Error('Database failure');
        mockProfilesService.addWorkExperience.mockRejectedValue(error);
        jest
          .spyOn(require('../common/utils/exception-handler'), 'handleError')
          .mockImplementation((error, message) => {
            if (!mockUserId) {
              throw new UnauthorizedException('User not authenticated');
            }
            throw new InternalServerErrorException(message);
          });

        const req = { user: { sub: mockUserId } };

        await expect(
          controller.addWorkExperience(req, mockWorkExperienceDto),
        ).rejects.toThrow(InternalServerErrorException);

        expect(handleError).toHaveBeenCalledWith(
          error,
          'Failed to add work experience.',
        );
      });
    });

    describe('editWorkExperience', () => {
      it('should edit work experience successfully', async () => {
        mockProfilesService.editWorkExperience.mockResolvedValue(
          'mockEditResult',
        );

        const req = { user: { sub: mockUserId } };
        const result = await controller.editWorkExperience(
          req,
          mockUpdatedDto,
          new Types.ObjectId(mockWorkExperienceId),
        );

        expect(result).toBe('mockEditResult');
        expect(mockProfilesService.editWorkExperience).toHaveBeenCalledWith(
          mockUpdatedDto,
          mockUserId,
          new Types.ObjectId(mockWorkExperienceId),
        );
      });

      it('should throw UnauthorizedException if user is not authenticated', async () => {
        const req = { user: null };

        jest
          .spyOn(require('../common/utils/exception-handler'), 'handleError')
          .mockImplementation((error, message) => {
            if (!req.user) {
              throw new UnauthorizedException('User not authenticated');
            }
            throw new InternalServerErrorException(message);
          });

        await expect(
          controller.editWorkExperience(
            req,
            mockWorkExperienceDto,
            new Types.ObjectId(mockWorkExperienceId),
          ),
        ).rejects.toThrow(UnauthorizedException);
      });
    });

    describe('deleteWorkExperience', () => {
      it('should delete work experience successfully', async () => {
        mockProfilesService.deleteWorkExperience.mockResolvedValue('deleted');

        const req = { user: { sub: mockUserId } };
        const result = await controller.deleteWorkExperience(
          req,
          mockWorkExperienceId,
        );

        expect(result).toBe('deleted');
        expect(mockProfilesService.deleteWorkExperience).toHaveBeenCalledWith(
          expect.any(Types.ObjectId),
          mockUserId,
        );
      });

      it('should throw UnauthorizedException if user is not authenticated', async () => {
        const req = { user: null };

        await expect(
          controller.deleteWorkExperience(req, mockWorkExperienceId),
        ).rejects.toThrow(UnauthorizedException);
      });
    });
  });
});
