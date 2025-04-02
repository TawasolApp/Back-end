import { Test, TestingModule } from '@nestjs/testing';
import { ProfilesController } from './profiles.controller';
import { ProfilesService } from './profiles.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { SkillDto } from './dto/skill.dto';
import { Types } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { BadRequestException, UnauthorizedException, InternalServerErrorException } from '@nestjs/common';
import { EducationDto } from './dto/education.dto';
import { CertificationDto } from './dto/certification.dto';

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

describe('ProfilesController - Education Methods', () => {
  let controller: ProfilesController;
  let service: ProfilesService;

  const mockProfilesService = {
    addEducation: jest.fn(),
    editEducation: jest.fn(),
    deleteEducation: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProfilesController],
      providers: [
        JwtService,
        { provide: ProfilesService, useValue: mockProfilesService },
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
      expect(service.addEducation).toHaveBeenCalledWith(mockEducationDto, mockUserId);
    });

    it('should throw UnauthorizedException if user is not authenticated', async () => {
      const req = { user: null };

      await expect(controller.addEducation(req, mockEducationDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should handle errors using handleException', async () => {
      const error = new Error('Database failure');
      mockProfilesService.addEducation.mockRejectedValue(error);
      controller.handleException = jest.fn();

      const req = { user: { sub: mockUserId } };

      await controller.addEducation(req, mockEducationDto);

      expect(controller.handleException).toHaveBeenCalledWith(error, 'Failed to add education.');
    });
  });

  describe('editEducation', () => {
    it('should edit education successfully', async () => {
      mockProfilesService.editEducation.mockResolvedValue(mockUpdatedEducationDto);
      const req = { user: { sub: mockUserId } };

      const result = await controller.editEducation(req, mockUpdatedEducationDto, mockEducationId as any);

      expect(result).toEqual(mockUpdatedEducationDto);
      expect(service.editEducation).toHaveBeenCalledWith(mockUpdatedEducationDto, mockUserId, mockEducationId);
    });

    it('should throw UnauthorizedException if user is not authenticated', async () => {
      const req = { user: null };

      await expect(
        controller.editEducation(req, mockUpdatedEducationDto, mockEducationId as any),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should handle errors using handleException', async () => {
      const error = new Error('Database failure');
      mockProfilesService.editEducation.mockRejectedValue(error);
      controller.handleException = jest.fn();

      const req = { user: { sub: mockUserId } };

      await controller.editEducation(req, mockUpdatedEducationDto, mockEducationId as any);

      expect(controller.handleException).toHaveBeenCalledWith(error, 'Failed to edit education.');
    });
  });

  describe('deleteEducation', () => {
    it('should delete education successfully', async () => {
      mockProfilesService.deleteEducation.mockResolvedValue({ success: true });
      const req = { user: { sub: mockUserId } };

      const result = await controller.deleteEducation(req, mockEducationId);

      expect(result).toEqual({ success: true });
      expect(service.deleteEducation).toHaveBeenCalledWith(new Types.ObjectId(mockEducationId), mockUserId);
    });

    it('should throw UnauthorizedException if user is not authenticated', async () => {
      const req = { user: null };

      await expect(controller.deleteEducation(req, mockEducationId)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should handle errors using handleException', async () => {
      const error = new Error('Database failure');
      mockProfilesService.deleteEducation.mockRejectedValue(error);
      controller.handleException = jest.fn();

      const req = { user: { sub: mockUserId } };

      await controller.deleteEducation(req, mockEducationId);

      expect(controller.handleException).toHaveBeenCalledWith(error, 'Failed to delete education.');
    });
  });
});

describe('ProfilesController - Certification Methods', () => {
  let controller: ProfilesController;
  let service: ProfilesService;

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
      ],
    }).compile();

    controller = module.get<ProfilesController>(ProfilesController);
    service = module.get<ProfilesService>(ProfilesService);
  });

  const mockCertificationDto: CertificationDto = {
    name: 'AWS Certified Developer',
    company: 'Amazon',
    issueDate: new Date('2023-01-01'),
  };

  const mockCertificationId = new Types.ObjectId().toString();
  const mockUserId = new Types.ObjectId().toString();

  describe('addCertification', () => {
    it('should add certification successfully', async () => {
      mockProfilesService.addCertification.mockResolvedValue(mockCertificationDto);

      const req = { user: { sub: mockUserId } };
      const result = await controller.addCertification(req, mockCertificationDto);

      expect(result).toEqual(mockCertificationDto);
      expect(service.addCertification).toHaveBeenCalledWith(mockCertificationDto, mockUserId);
    });

    it('should throw UnauthorizedException if user is not authenticated', async () => {
      const req = { user: null };
      await expect(controller.addCertification(req, mockCertificationDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should handle errors using handleException', async () => {
      const error = new Error('Database failure');
      mockProfilesService.addCertification.mockRejectedValue(error);
      controller.handleException = jest.fn();

      const req = { user: { sub: mockUserId } };
      await controller.addCertification(req, mockCertificationDto);

      expect(controller.handleException).toHaveBeenCalledWith(error, 'Failed to add certification.');
    });
  });

  describe('editCertification', () => {
    it('should edit certification successfully', async () => {
      const updateDto: Partial<CertificationDto> = { name: 'Updated Certification' };
      mockProfilesService.editCertification.mockResolvedValue(updateDto);

      const req = { user: { sub: mockUserId } };
      const result = await controller.editCertification(req, updateDto, mockCertificationId as any);

      expect(result).toEqual(updateDto);
      expect(service.editCertification).toHaveBeenCalledWith(updateDto, mockUserId, mockCertificationId);
    });

    it('should throw UnauthorizedException if user is not authenticated', async () => {
      const req = { user: null };
      await expect(controller.editCertification(req, {}, mockCertificationId as any)).rejects.toThrow(UnauthorizedException);
    });

    it('should handle errors using handleException', async () => {
      const error = new Error('Database failure');
      mockProfilesService.editCertification.mockRejectedValue(error);
      controller.handleException = jest.fn();

      const req = { user: { sub: mockUserId } };
      await controller.editCertification(req, {}, mockCertificationId as any);

      expect(controller.handleException).toHaveBeenCalledWith(error, 'Failed to edit certification.');
    });
  });

  describe('deleteCertification', () => {
    it('should delete certification successfully', async () => {
      mockProfilesService.deleteCertification.mockResolvedValue({ success: true });

      const req = { user: { sub: mockUserId } };
      const result = await controller.deleteCertification(req, mockCertificationId);

      expect(result).toEqual({ success: true });
      expect(service.deleteCertification).toHaveBeenCalledWith(new Types.ObjectId(mockCertificationId), mockUserId);
    });

    it('should throw UnauthorizedException if user is not authenticated', async () => {
      const req = { user: null };
      await expect(controller.deleteCertification(req, mockCertificationId)).rejects.toThrow(UnauthorizedException);
    });

    it('should handle errors using handleException', async () => {
      const error = new Error('Database failure');
      mockProfilesService.deleteCertification.mockRejectedValue(error);
      controller.handleException = jest.fn();

      const req = { user: { sub: mockUserId } };
      await controller.deleteCertification(req, mockCertificationId);

      expect(controller.handleException).toHaveBeenCalledWith(error, 'Failed to delete certification.');
    });
  });
});
