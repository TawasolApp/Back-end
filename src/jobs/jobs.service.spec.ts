import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { Job } from './infrastructure/database/schemas/job.schema';
import { Application } from './infrastructure/database/schemas/application.schema';
import { Company } from '../companies/infrastructure/database/schemas/company.schema';
import { CompanyManager } from '../companies/infrastructure/database/schemas/company-manager.schema';
import { CompanyEmployer } from './infrastructure/database/schemas/company-employer.schema';
import { Profile } from '../profiles/infrastructure/database/schemas/profile.schema';
import { User } from '../users/infrastructure/database/schemas/user.schema';
import { Notification } from '../notifications/infrastructure/database/schemas/notification.schema';
import { PlanDetail } from '../payments/infrastructure/database/schemas/plan-detail.schema';
import { NotificationGateway } from '../gateway/notification.gateway';
import { PostJobDto } from './dtos/post-job.dto';

describe('JobsService', () => {
  let service: JobsService;

  // Mock models
  const mockJobModel = {
    findById: jest.fn().mockReturnThis(),
    find: jest.fn().mockReturnThis(),
    countDocuments: jest.fn(),
    updateOne: jest.fn(),
    deleteOne: jest.fn(),
    create: jest.fn(),
    lean: jest.fn(),
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    save: jest.fn(),
  };

  const mockApplicationModel = {
    findOne: jest.fn().mockReturnThis(),
    find: jest.fn().mockReturnThis(),
    countDocuments: jest.fn(),
    updateOne: jest.fn(),
    deleteMany: jest.fn(),
    create: jest.fn(),
    lean: jest.fn(),
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
  };

  const mockCompanyModel = {
    findById: jest.fn().mockReturnThis(),
    find: jest.fn().mockReturnThis(),
    lean: jest.fn(),
    select: jest.fn().mockReturnThis(),
  };

  const mockCompanyManagerModel = {
    findOne: jest.fn().mockReturnThis(),
    lean: jest.fn(),
  };

  const mockCompanyEmployerModel = {
    findOne: jest.fn().mockReturnThis(),
    lean: jest.fn(),
  };

  const mockProfileModel = {
    findById: jest.fn().mockReturnThis(),
    updateOne: jest.fn(),
    lean: jest.fn(),
    select: jest.fn().mockReturnThis(),
  };

  const mockUserModel = {
    findById: jest.fn().mockReturnThis(),
    lean: jest.fn(),
    select: jest.fn().mockReturnThis(),
  };

  const mockNotificationModel = {
    create: jest.fn(),
  };

  const mockPlanDetailModel = {
    findOne: jest.fn(),
  };

  const mockNotificationGateway = {
    sendNotification: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobsService,
        {
          provide: getModelToken(Job.name),
          useValue: mockJobModel,
        },
        {
          provide: getModelToken(Application.name),
          useValue: mockApplicationModel,
        },
        {
          provide: getModelToken(Company.name),
          useValue: mockCompanyModel,
        },
        {
          provide: getModelToken(CompanyManager.name),
          useValue: mockCompanyManagerModel,
        },
        {
          provide: getModelToken(CompanyEmployer.name),
          useValue: mockCompanyEmployerModel,
        },
        {
          provide: getModelToken(Profile.name),
          useValue: mockProfileModel,
        },
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
        {
          provide: getModelToken(Notification.name),
          useValue: mockNotificationModel,
        },
        {
          provide: getModelToken(PlanDetail.name),
          useValue: mockPlanDetailModel,
        },
        {
          provide: NotificationGateway,
          useValue: mockNotificationGateway,
        },
      ],
    }).compile();

    service = module.get<JobsService>(JobsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getJob', () => {
    it('should return job details with company info', async () => {
      const jobId = '507f1f77bcf86cd799439013';
      const userId = '507f1f77bcf86cd799439011';
      const mockJob = {
        _id: new Types.ObjectId(jobId),
        company_id: new Types.ObjectId('507f1f77bcf86cd799439012'),
        position: 'Developer',
        saved_by: [new Types.ObjectId(userId)],
      };
      const mockCompany = {
        _id: new Types.ObjectId('507f1f77bcf86cd799439012'),
        name: 'Test Company',
        logo: 'logo.png',
        address: '123 Street',
        description: 'Company description',
      };

      mockJobModel.findById.mockImplementation(() => ({
        lean: jest.fn().mockResolvedValue(mockJob),
      }));
      mockCompanyModel.findById.mockImplementation(() => ({
        lean: jest.fn().mockResolvedValue(mockCompany),
      }));
      mockApplicationModel.findOne.mockImplementation(() => ({
        lean: jest.fn().mockResolvedValue(null),
      }));

      const result = await service.getJob(jobId, userId);
      expect(result).toBeDefined();
      expect(result.companyName).toBe(mockCompany.name);
      expect(result.isSaved).toBe(true);
    });

    it('should throw NotFoundException if job does not exist', async () => {
      const jobId = '507f1f77bcf86cd799439013';
      const userId = '507f1f77bcf86cd799439011';

      mockJobModel.findById.mockImplementation(() => ({
        lean: jest.fn().mockResolvedValue(null),
      }));

      await expect(service.getJob(jobId, userId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should include application status if user has applied', async () => {
      const jobId = '507f1f77bcf86cd799439013';
      const userId = '507f1f77bcf86cd799439011';
      const mockJob = {
        _id: new Types.ObjectId(jobId),
        company_id: new Types.ObjectId('507f1f77bcf86cd799439012'),
        position: 'Developer',
      };
      const mockCompany = {
        _id: new Types.ObjectId('507f1f77bcf86cd799439012'),
        name: 'Test Company',
      };
      const mockApplication = {
        status: 'Pending',
      };

      mockJobModel.findById.mockImplementation(() => ({
        lean: jest.fn().mockResolvedValue(mockJob),
      }));
      mockCompanyModel.findById.mockImplementation(() => ({
        lean: jest.fn().mockResolvedValue(mockCompany),
      }));
      mockApplicationModel.findOne.mockImplementation(() => ({
        lean: jest.fn().mockResolvedValue(mockApplication),
      }));

      const result = await service.getJob(jobId, userId);
      expect(result.status).toBe('Pending');
    });
  });

  describe('getJobs', () => {
    it('should return jobs with filters and pagination', async () => {
      const userId = '507f1f77bcf86cd799439011';
      const filters = {
        keyword: 'developer',
        location: 'remote',
      };
      const mockJobs = [
        {
          _id: new Types.ObjectId('507f1f77bcf86cd799439013'),
          company_id: new Types.ObjectId('507f1f77bcf86cd799439012'),
          position: 'Senior Developer',
          location: 'Remote',
        },
      ];
      const mockCompany = {
        _id: new Types.ObjectId('507f1f77bcf86cd799439012'),
        name: 'Test Company',
        logo: 'logo.png',
        address: '123 Street',
        description: 'Company description',
      };

      mockJobModel.find.mockImplementation(() => ({
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockJobs),
      }));
      mockJobModel.countDocuments.mockResolvedValue(1);
      mockCompanyModel.findById.mockImplementation(() => ({
        lean: jest.fn().mockResolvedValue(mockCompany),
      }));

      const result = await service.getJobs(userId, filters, 1, 10);
      expect(result).toBeDefined();
      expect(result.jobs.length).toBe(1);
      expect(result.totalItems).toBe(1);
      expect(result.jobs[0].companyName).toBe(mockCompany.name);
    });

    it('should handle empty results', async () => {
      const userId = '507f1f77bcf86cd799439011';
      const filters = {};

      mockJobModel.find.mockImplementation(() => ({
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      }));
      mockJobModel.countDocuments.mockResolvedValue(0);

      const result = await service.getJobs(userId, filters, 1, 10);
      expect(result.jobs.length).toBe(0);
      expect(result.totalItems).toBe(0);
    });
  });

  describe('addApplication', () => {
    it('should create a new application', async () => {
      const userId = '507f1f77bcf86cd799439011';
      const applyJobDto = {
        jobId: '507f1f77bcf86cd799439013',
        phoneNumber: '1234567890',
        resumeURL: 'resume.pdf',
      };
      const mockJob = {
        _id: new Types.ObjectId(applyJobDto.jobId),
      };
      const mockProfile = {
        _id: new Types.ObjectId(userId),
        is_premium: true,
        plan_statistics: { application_count: 5 },
      };

      // Mock job exists
      mockJobModel.findById.mockImplementation(() => ({
        lean: jest.fn().mockResolvedValue(mockJob),
      }));

      // Mock no existing application
      mockApplicationModel.findOne.mockImplementation(() => ({
        lean: jest.fn().mockResolvedValue(null),
      }));

      // Mock profile exists
      mockProfileModel.findById.mockImplementation(() => ({
        lean: jest.fn().mockResolvedValue(mockProfile),
      }));

      // Mock application creation
      mockApplicationModel.create.mockResolvedValue({
        _id: new Types.ObjectId(),
        user_id: new Types.ObjectId(userId),
        job_id: new Types.ObjectId(applyJobDto.jobId),
        phone_number: applyJobDto.phoneNumber,
        resume_url: encodeURIComponent(applyJobDto.resumeURL),
        status: 'Pending',
        applied_at: new Date().toISOString(),
      });

      // Mock job update
      mockJobModel.updateOne.mockResolvedValue({ modifiedCount: 1 });

      await service.addApplication(userId, applyJobDto);
      expect(mockApplicationModel.create).toHaveBeenCalled();
      expect(mockJobModel.updateOne).toHaveBeenCalled();
    });

    it('should throw NotFoundException if job does not exist', async () => {
      const userId = '507f1f77bcf86cd799439011';
      const applyJobDto = {
        jobId: '507f1f77bcf86cd799439013',
        phoneNumber: '1234567890',
        resumeURL: 'resume.pdf',
      };

      // Mock job not found
      mockJobModel.findById.mockImplementation(() => ({
        lean: jest.fn().mockResolvedValue(null),
      }));

      await expect(service.addApplication(userId, applyJobDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if already applied', async () => {
      const userId = '507f1f77bcf86cd799439011';
      const applyJobDto = {
        jobId: '507f1f77bcf86cd799439013',
        phoneNumber: '1234567890',
        resumeURL: 'resume.pdf',
      };
      const mockJob = {
        _id: new Types.ObjectId(applyJobDto.jobId),
      };
      const mockApplication = {
        _id: new Types.ObjectId(),
      };

      // Mock job exists
      mockJobModel.findById.mockImplementation(() => ({
        lean: jest.fn().mockResolvedValue(mockJob),
      }));

      // Mock existing application
      mockApplicationModel.findOne.mockImplementation(() => ({
        lean: jest.fn().mockResolvedValue(mockApplication),
      }));

      await expect(service.addApplication(userId, applyJobDto)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('saveJob', () => {
    it('should save a job for the user', async () => {
      const userId = '507f1f77bcf86cd799439011';
      const jobId = '507f1f77bcf86cd799439013';
      const mockJob = { _id: new Types.ObjectId(jobId) };

      mockJobModel.findById.mockImplementation(() => ({
        lean: jest.fn().mockResolvedValue(mockJob),
      }));
      mockJobModel.updateOne.mockResolvedValue({ modifiedCount: 1 });

      await service.saveJob(userId, jobId);
      expect(mockJobModel.findById).toHaveBeenCalledWith(
        new Types.ObjectId(jobId),
      );
      expect(mockJobModel.updateOne).toHaveBeenCalledWith(
        { _id: new Types.ObjectId(jobId) },
        { $addToSet: { saved_by: new Types.ObjectId(userId) } },
      );
    });

    it('should throw NotFoundException if the job does not exist', async () => {
      const userId = '507f1f77bcf86cd799439011';
      const jobId = '507f1f77bcf86cd799439013';

      mockJobModel.findById.mockImplementation(() => ({
        lean: jest.fn().mockResolvedValue(null),
      }));

      await expect(service.saveJob(userId, jobId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('unsaveJob', () => {
    it('should unsave a job for the user', async () => {
      const userId = '507f1f77bcf86cd799439011';
      const jobId = '507f1f77bcf86cd799439013';
      const mockJob = { _id: new Types.ObjectId(jobId) };

      mockJobModel.findById.mockImplementation(() => ({
        lean: jest.fn().mockResolvedValue(mockJob),
      }));
      mockJobModel.updateOne.mockResolvedValue({ modifiedCount: 1 });

      await service.unsaveJob(userId, jobId);
      expect(mockJobModel.findById).toHaveBeenCalledWith(
        new Types.ObjectId(jobId),
      );
      expect(mockJobModel.updateOne).toHaveBeenCalledWith(
        { _id: new Types.ObjectId(jobId) },
        { $pull: { saved_by: new Types.ObjectId(userId) } },
      );
    });

    it('should throw NotFoundException if the job does not exist', async () => {
      const userId = '507f1f77bcf86cd799439011';
      const jobId = '507f1f77bcf86cd799439013';

      mockJobModel.findById.mockImplementation(() => ({
        lean: jest.fn().mockResolvedValue(null),
      }));

      await expect(service.unsaveJob(userId, jobId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('deleteJob', () => {
    it('should delete a job and its applications', async () => {
      const userId = '507f1f77bcf86cd799439011';
      const jobId = '507f1f77bcf86cd799439013';
      const mockJob = {
        _id: new Types.ObjectId(jobId),
        company_id: new Types.ObjectId('507f1f77bcf86cd799439012'),
      };

      mockJobModel.findById.mockImplementation(() => ({
        lean: jest.fn().mockResolvedValue(mockJob),
      }));
      mockCompanyManagerModel.findOne.mockImplementation(() => ({
        lean: jest.fn().mockResolvedValue(true),
      }));
      mockApplicationModel.deleteMany.mockResolvedValue({ deletedCount: 1 });
      mockJobModel.deleteOne.mockResolvedValue({ deletedCount: 1 });

      await service.deleteJob(userId, jobId);
      expect(mockJobModel.findById).toHaveBeenCalledWith(
        new Types.ObjectId(jobId),
      );
      expect(mockApplicationModel.deleteMany).toHaveBeenCalledWith({
        job_id: new Types.ObjectId(jobId),
      });
      expect(mockJobModel.deleteOne).toHaveBeenCalledWith({
        _id: new Types.ObjectId(jobId),
      });
    });

    it('should throw NotFoundException if the job does not exist', async () => {
      const userId = '507f1f77bcf86cd799439011';
      const jobId = '507f1f77bcf86cd799439013';

      mockJobModel.findById.mockImplementation(() => ({
        lean: jest.fn().mockResolvedValue(null),
      }));

      await expect(service.deleteJob(userId, jobId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if the user does not have access', async () => {
      const userId = '507f1f77bcf86cd799439011';
      const jobId = '507f1f77bcf86cd799439013';
      const mockJob = {
        _id: new Types.ObjectId(jobId),
        company_id: new Types.ObjectId('507f1f77bcf86cd799439012'),
      };

      mockJobModel.findById.mockImplementation(() => ({
        lean: jest.fn().mockResolvedValue(mockJob),
      }));
      mockCompanyManagerModel.findOne.mockImplementation(() => ({
        lean: jest.fn().mockResolvedValue(null),
      }));

      await expect(service.deleteJob(userId, jobId)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('getSavedJobs', () => {
    it('should return saved jobs for the user', async () => {
      const userId = '507f1f77bcf86cd799439011';
      const mockJobs = [
        {
          _id: new Types.ObjectId('507f1f77bcf86cd799439013'),
          company_id: new Types.ObjectId('507f1f77bcf86cd799439012'),
          position: 'Developer',
        },
      ];
      const mockCompany = {
        _id: new Types.ObjectId('507f1f77bcf86cd799439012'),
        name: 'Test Company',
        logo: 'logo.png',
        address: '123 Street',
        description: 'Company description',
      };

      mockJobModel.find.mockImplementation(() => ({
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockJobs),
      }));
      mockJobModel.countDocuments.mockResolvedValue(1);
      mockCompanyModel.findById.mockImplementation(() => ({
        lean: jest.fn().mockResolvedValue(mockCompany),
      }));

      const result = await service.getSavedJobs(userId, 1, 10);
      expect(result.jobs.length).toBe(1);
      expect(result.jobs[0].companyName).toBe(mockCompany.name);
    });

    it('should handle empty results', async () => {
      const userId = '507f1f77bcf86cd799439011';

      mockJobModel.find.mockImplementation(() => ({
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      }));
      mockJobModel.countDocuments.mockResolvedValue(0);

      const result = await service.getSavedJobs(userId, 1, 10);
      expect(result.jobs.length).toBe(0);
      expect(result.totalItems).toBe(0);
    });
  });
});
