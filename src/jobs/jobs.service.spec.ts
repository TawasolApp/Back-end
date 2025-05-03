import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import {
  ForbiddenException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { JobsService } from './jobs.service';
import { Job } from './infrastructure/database/schemas/job.schema';
import { Application } from './infrastructure/database/schemas/application.schema';
import { CompanyEmployer } from './infrastructure/database/schemas/company-employer.schema';
import { Company } from '../companies/infrastructure/database/schemas/company.schema';
import { CompanyManager } from '../companies/infrastructure/database/schemas/company-manager.schema';
import { Profile } from '../profiles/infrastructure/database/schemas/profile.schema';
import { User } from '../users/infrastructure/database/schemas/user.schema';
import {
  Notification,
  NotificationDocument,
} from '../notifications/infrastructure/database/schemas/notification.schema';
import { PlanDetail } from '../payments/infrastructure/database/schemas/plan-detail.schema';
import { NotificationGateway } from '../gateway/notification.gateway';
import { PostJobDto } from './dtos/post-job.dto';
import { LocationType } from './enums/location-type.enum';
import { EmploymentType } from './enums/employment-type.enum';
import { handleError } from '../common/utils/exception-handler';
import * as notificationHelper from '../notifications/helpers/notification.helper'; // Import the helper module

// Mock data
const mockJobs = [
  {
    _id: new Types.ObjectId('507f1f77bcf86cd799439013'),
    company_id: new Types.ObjectId('507f1f77bcf86cd799439012'),
    position: 'Developer',
    locationType: LocationType.Remote,
    employmentType: EmploymentType.FullTime,
    saved_by: [new Types.ObjectId('507f1f77bcf86cd799439011')],
  },
];

const mockCompanies = [
  {
    _id: new Types.ObjectId('507f1f77bcf86cd799439012'),
    name: 'Test Company',
    logo: 'logo.png',
    address: '123 Street',
    description: 'Company description',
  },
];

const mockProfiles = [
  {
    _id: new Types.ObjectId('507f1f77bcf86cd799439011'),
    is_premium: true,
    plan_statistics: { application_count: 5 },
  },
  {
    _id: new Types.ObjectId('507f1f77bcf86cd799439012'),
    is_premium: false,
    plan_statistics: { application_count: 0 },
  },
];

const mockCompanyManagers = [
  {
    manager_id: new Types.ObjectId('507f1f77bcf86cd799439011'),
    company_id: new Types.ObjectId('507f1f77bcf86cd799439012'),
  },
];

const mockCompanyEmployers = [
  {
    employer_id: new Types.ObjectId('507f1f77bcf86cd799439011'),
    company_id: new Types.ObjectId('507f1f77bcf86cd799439012'),
  },
];

const mockApplications = [
  {
    _id: new Types.ObjectId(),
    user_id: new Types.ObjectId('507f1f77bcf86cd799439011'),
    job_id: new Types.ObjectId('507f1f77bcf86cd799439013'),
    status: 'Pending',
  },
];

const mockUsers = [
  {
    _id: new Types.ObjectId('507f1f77bcf86cd799439011'),
    first_name: 'John',
    last_name: 'Doe',
    email: 'john.doe@example.com',
  },
];

jest.mock('../common/utils/exception-handler', () => ({
  handleError: jest.fn(),
}));

jest.mock('../notifications/helpers/notification.helper', () => ({
  addNotification: jest.fn(), // Mock the addNotification function
}));

describe('JobsService', () => {
  let service: JobsService;
  let jobModel: any;
  let applicationModel: any;
  let companyModel: any;
  let companyManagerModel: any;
  let companyEmployerModel: any;
  let userModel: any;
  let profileModel: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobsService,
        {
          provide: getModelToken(Job.name),
          useValue: {
            findById: jest.fn().mockReturnThis(),
            find: jest.fn().mockReturnThis(),
            save: jest.fn(),
            create: jest.fn(),
            countDocuments: jest.fn(),
            updateOne: jest.fn(),
            deleteOne: jest.fn(),
            lean: jest.fn(),
            skip: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            sort: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
          },
        },
        {
          provide: getModelToken(Application.name),
          useValue: {
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
            aggregate: jest.fn(),
          },
        },
        {
          provide: getModelToken(Company.name),
          useValue: {
            findById: jest.fn().mockReturnThis(),
            find: jest.fn().mockReturnThis(),
            lean: jest.fn(),
            select: jest.fn().mockReturnThis(),
          },
        },
        {
          provide: getModelToken(CompanyManager.name),
          useValue: {
            findOne: jest.fn().mockReturnThis(),
            lean: jest.fn(),
          },
        },
        {
          provide: getModelToken(CompanyEmployer.name),
          useValue: {
            findOne: jest.fn().mockReturnThis(),
            lean: jest.fn(),
          },
        },
        {
          provide: getModelToken(Profile.name),
          useValue: {
            findById: jest.fn().mockReturnThis(),
            updateOne: jest.fn(),
            lean: jest.fn(),
            select: jest.fn().mockReturnThis(),
            find: jest.fn(),
          },
        },
        {
          provide: getModelToken(User.name),
          useValue: {
            findById: jest.fn().mockReturnThis(),
            lean: jest.fn(),
            select: jest.fn().mockReturnThis(),
          },
        },
        {
          provide: getModelToken(Notification.name),
          useValue: {
            create: jest.fn(),
          },
        },
        {
          provide: getModelToken(PlanDetail.name),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: NotificationGateway,
          useValue: {
            sendNotification: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<JobsService>(JobsService);
    jobModel = module.get(getModelToken(Job.name));
    applicationModel = module.get(getModelToken(Application.name));
    companyModel = module.get(getModelToken(Company.name));
    companyManagerModel = module.get(getModelToken(CompanyManager.name));
    companyEmployerModel = module.get(getModelToken(CompanyEmployer.name));
    userModel = module.get(getModelToken(User.name));
    profileModel = module.get(getModelToken(Profile.name));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('checkAccess', () => {
    it('should return true if the user is an admin', async () => {
      const userId = mockProfiles[0]._id.toString();
      const companyId = mockCompanies[0]._id.toString();

      userModel.findById.mockImplementation(() => ({
        lean: jest.fn().mockResolvedValueOnce({
          _id: new Types.ObjectId(userId),
          role: 'admin',
        }),
      }));

      const result = await service.checkAccess(userId, companyId);
      expect(result).toBe(true);
      expect(userModel.findById).toHaveBeenCalledWith(
        new Types.ObjectId(userId),
      );
    });

    it('should return true if the user is a manager of the company', async () => {
      const userId = mockProfiles[0]._id.toString();
      const companyId = mockCompanies[0]._id.toString();

      userModel.findById.mockImplementation(() => ({
        lean: jest.fn().mockResolvedValueOnce({
          _id: new Types.ObjectId(userId),
          role: 'user',
        }),
      }));
      companyManagerModel.findOne.mockImplementation(() => ({
        lean: jest.fn().mockResolvedValueOnce(mockCompanyManagers[0]),
      }));

      const result = await service.checkAccess(userId, companyId);
      expect(result).toBe(true);
      expect(companyManagerModel.findOne).toHaveBeenCalledWith({
        manager_id: new Types.ObjectId(userId),
        company_id: new Types.ObjectId(companyId),
      });
    });

    it('should return true if the user is an employer of the company', async () => {
      const userId = mockProfiles[0]._id.toString();
      const companyId = mockCompanies[0]._id.toString();

      userModel.findById.mockImplementation(() => ({
        lean: jest.fn().mockResolvedValueOnce({
          _id: new Types.ObjectId(userId),
          role: 'user',
        }),
      }));
      companyManagerModel.findOne.mockImplementation(() => ({
        lean: jest.fn().mockResolvedValueOnce(null),
      }));
      companyEmployerModel.findOne.mockImplementation(() => ({
        lean: jest.fn().mockResolvedValueOnce(mockCompanyEmployers[0]),
      }));

      const result = await service.checkAccess(userId, companyId);
      expect(result).toBe(true);
      expect(companyEmployerModel.findOne).toHaveBeenCalledWith({
        employer_id: new Types.ObjectId(userId),
        company_id: new Types.ObjectId(companyId),
      });
    });

    it('should return false if the user is neither a manager nor an employer of the company', async () => {
      const userId = mockProfiles[0]._id.toString();
      const companyId = mockCompanies[0]._id.toString();

      userModel.findById.mockImplementation(() => ({
        lean: jest.fn().mockResolvedValueOnce({
          _id: new Types.ObjectId(userId),
          role: 'user',
        }),
      }));
      companyManagerModel.findOne.mockImplementation(() => ({
        lean: jest.fn().mockResolvedValueOnce(null),
      }));
      companyEmployerModel.findOne.mockImplementation(() => ({
        lean: jest.fn().mockResolvedValueOnce(null),
      }));

      const result = await service.checkAccess(userId, companyId);
      expect(result).toBe(false);
      expect(companyManagerModel.findOne).toHaveBeenCalledWith({
        manager_id: new Types.ObjectId(userId),
        company_id: new Types.ObjectId(companyId),
      });
      expect(companyEmployerModel.findOne).toHaveBeenCalledWith({
        employer_id: new Types.ObjectId(userId),
        company_id: new Types.ObjectId(companyId),
      });
    });
  });

  describe('postJob', () => {
    const postJobDto = {
      position: 'Marketing Intern',
      locationType: LocationType.Hybrid,
      employmentType: EmploymentType.Internship,
      location: 'Cairo',
    };

    it('should successfully post a job when user has access', async () => {
      const userId = mockProfiles[0]._id.toString();
      const companyId = mockCompanies[0]._id.toString();
      companyModel.findById.mockReturnValueOnce({
        lean: jest.fn().mockResolvedValueOnce(mockCompanies[0]),
      });
      jest.spyOn(service, 'checkAccess').mockResolvedValueOnce(true);
      const savedJob = {
        _id: new Types.ObjectId(),
        company_id: new Types.ObjectId(companyId),
        applicants: 0,
        open: true,
        ...postJobDto,
      };
      const saveMock = jest.fn().mockResolvedValueOnce(savedJob);
      const jobConstructorMock = jest.fn(() => ({ save: saveMock }));
      (service as any).jobModel = jobConstructorMock;
      const result = await service.postJob(userId, companyId, postJobDto);
      expect(jobConstructorMock).toHaveBeenCalledWith(
        expect.objectContaining({
          company_id: expect.any(Types.ObjectId),
          position: postJobDto.position,
        }),
      );
      expect(saveMock).toHaveBeenCalled();
      expect(result.position).toBe(postJobDto.position);
    });

    it('should throw InternalServerErrorException when company does not exist', async () => {
      const userId = mockProfiles[0]._id.toString();
      const invalidCompanyId = new Types.ObjectId().toString();
      companyModel.findById.mockReturnValueOnce({
        lean: jest.fn().mockResolvedValueOnce(null),
      });

      await expect(
        service.postJob(userId, invalidCompanyId, postJobDto),
      ).rejects.toThrow(InternalServerErrorException);
    });

    it('should throw InternalServerErrorException when user has no access', async () => {
      const userId = mockProfiles[2]?._id.toString() || 'invalid-id';
      const companyId = mockCompanies[0]._id.toString();
      companyModel.findById.mockReturnValueOnce({
        lean: jest.fn().mockResolvedValueOnce(mockCompanies[0]),
      });
      jest.spyOn(service, 'checkAccess').mockResolvedValueOnce(false);

      await expect(
        service.postJob(userId, companyId, postJobDto),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('getJob', () => {
    it('should return job details with company info', async () => {
      const jobId = mockJobs[0]._id.toString();
      const userId = mockProfiles[0]._id.toString();

      jobModel.findById.mockImplementation(() => ({
        lean: jest.fn().mockResolvedValue(mockJobs[0]),
      }));

      companyModel.findById.mockImplementation(() => ({
        lean: jest.fn().mockResolvedValue(mockCompanies[0]),
      }));

      applicationModel.findOne.mockImplementation(() => ({
        lean: jest.fn().mockResolvedValue(null),
      }));

      const result = await service.getJob(jobId, userId);
      expect(result).toBeDefined();
      expect(result.companyName).toBe(mockCompanies[0].name);
      expect(result.isSaved).toBe(true);
    });

    it('should throw NotFoundException if job does not exist', async () => {
      const jobId = new Types.ObjectId().toString();
      const userId = mockProfiles[0]._id.toString();

      // More explicit mock setup
      const mockLean = jest.fn().mockResolvedValue(null);
      const mockFind = {
        lean: mockLean,
      };
      jobModel.findById.mockReturnValue(mockFind);

      await expect(service.getJob(jobId, userId)).rejects.toThrow(
        new NotFoundException('Job not found'),
      );
      expect(jobModel.findById).toHaveBeenCalledWith(new Types.ObjectId(jobId));
      expect(mockLean).toHaveBeenCalled();
    });

    it('should include application status if user has applied', async () => {
      const jobId = mockJobs[0]._id.toString();
      const userId = mockProfiles[0]._id.toString();

      jobModel.findById.mockImplementation(() => ({
        lean: jest.fn().mockResolvedValue(mockJobs[0]),
      }));

      companyModel.findById.mockImplementation(() => ({
        lean: jest.fn().mockResolvedValue(mockCompanies[0]),
      }));

      applicationModel.findOne.mockImplementation(() => ({
        lean: jest.fn().mockResolvedValue({ status: 'Pending' }),
      }));

      const result = await service.getJob(jobId, userId);
      expect(result.status).toBe('Pending');
    });
  });

  describe('getJobApplicants', () => {
    const page = 1;
    const limit = 5;

    it('should return job applicants for job when accessed by manager', async () => {
      const jobId = mockJobs[0]._id.toString();
      const userId = mockProfiles[0]._id.toString();

      jobModel.findById.mockReturnValueOnce({
        lean: jest.fn().mockResolvedValueOnce(mockJobs[0]),
      });

      jest.spyOn(service, 'checkAccess').mockResolvedValueOnce(true);

      const mockResponse = {
        applications: [
          {
            _id: new Types.ObjectId(),
            user_id: mockProfiles[1]._id,
            status: 'Pending',
          },
        ],
        totalItems: 1,
        totalPages: 1,
        currentPage: 1,
      };

      applicationModel.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockResponse.applications),
      });

      applicationModel.countDocuments.mockResolvedValue(
        mockResponse.totalItems,
      );

      userModel.findById.mockImplementation((id) => ({
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockUsers[0]),
      }));

      profileModel.findById.mockImplementation((id) => ({
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockProfiles[1]),
      }));

      const result = await service.getJobApplicants(userId, jobId, page, limit);
      expect(result.applications.length).toBe(1);
      expect(result.totalItems).toBe(1);
    });

    it('should throw InternalServerErrorException if job does not exist', async () => {
      const jobId = new Types.ObjectId().toString();
      const userId = mockProfiles[0]._id.toString();

      jobModel.findById.mockReturnValueOnce({
        lean: jest.fn().mockResolvedValueOnce(null),
      });

      await expect(
        service.getJobApplicants(userId, jobId, page, limit),
      ).rejects.toThrow(InternalServerErrorException);
    });

    it('should throw InternalServerErrorException if user has no access', async () => {
      const jobId = mockJobs[0]._id.toString();
      const userId = mockProfiles[2]?._id.toString() || 'invalid-id';

      jobModel.findById.mockReturnValueOnce({
        lean: jest.fn().mockResolvedValueOnce(mockJobs[0]),
      });
      jest.spyOn(service, 'checkAccess').mockResolvedValueOnce(false);

      await expect(
        service.getJobApplicants(userId, jobId, page, limit),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('getJobs', () => {
    it('should return jobs with filters and pagination', async () => {
      const userId = mockProfiles[0]._id.toString();
      const filters = {
        keyword: 'developer',
        location: 'remote',
      };

      jobModel.find.mockImplementation(() => ({
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([mockJobs[0]]),
      }));

      jobModel.countDocuments.mockResolvedValue(1);

      companyModel.findById.mockImplementation(() => ({
        lean: jest.fn().mockResolvedValue(mockCompanies[0]),
      }));

      const result = await service.getJobs(userId, filters, 1, 10);
      expect(result.jobs.length).toBe(1);
      expect(result.totalItems).toBe(1);
      expect(result.jobs[0].companyName).toBe(mockCompanies[0].name);
    });

    it('should handle empty results', async () => {
      const userId = mockProfiles[0]._id.toString();
      const filters = {};

      jobModel.find.mockImplementation(() => ({
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      }));

      jobModel.countDocuments.mockResolvedValue(0);

      const result = await service.getJobs(userId, filters, 1, 10);
      expect(result.jobs.length).toBe(0);
      expect(result.totalItems).toBe(0);
    });

    it('should handle invalid filters gracefully', async () => {
      const userId = mockProfiles[0]._id.toString();
      const filters = {
        keyword: null,
        location: null,
        industry: null,
        experienceLevel: null,
        company: null,
        minSalary: null,
        maxSalary: null,
      };

      jobModel.find.mockImplementation(() => ({
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      }));

      jobModel.countDocuments.mockResolvedValue(0);

      const result = await service.getJobs(userId, filters, 1, 10);
      expect(result.jobs.length).toBe(0);
      expect(result.totalItems).toBe(0);
    });

    it('should throw InternalServerErrorException if an error occurs', async () => {
      const userId = mockProfiles[0]._id.toString();
      const filters = { keyword: 'developer' };

      jobModel.find.mockImplementation(() => {
        throw new Error('Database error');
      });

      await expect(service.getJobs(userId, filters, 1, 10)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('addApplication', () => {
    it('should create a new application', async () => {
      const userId = mockProfiles[0]._id.toString();
      const applyJobDto = {
        jobId: mockJobs[0]._id.toString(),
        phoneNumber: '1234567890',
        resumeURL: 'resume.pdf',
      };

      jobModel.findById.mockImplementation(() => ({
        lean: jest.fn().mockResolvedValue(mockJobs[0]),
      }));

      applicationModel.findOne.mockImplementation(() => ({
        lean: jest.fn().mockResolvedValue(null),
      }));

      profileModel.findById.mockImplementation(() => ({
        lean: jest.fn().mockResolvedValue(mockProfiles[0]),
      }));

      applicationModel.create.mockResolvedValue({
        _id: new Types.ObjectId(),
        user_id: new Types.ObjectId(userId),
        job_id: new Types.ObjectId(applyJobDto.jobId),
        phone_number: applyJobDto.phoneNumber,
        resume_url: encodeURIComponent(applyJobDto.resumeURL),
        status: 'Pending',
        applied_at: new Date().toISOString(),
      });

      jobModel.updateOne.mockResolvedValue({ modifiedCount: 1 });

      await service.addApplication(userId, applyJobDto);
      expect(applicationModel.create).toHaveBeenCalled();
      expect(jobModel.updateOne).toHaveBeenCalled();
    });

    it('should throw NotFoundException if job does not exist', async () => {
      const userId = mockProfiles[0]._id.toString();
      const applyJobDto = {
        jobId: new Types.ObjectId().toString(),
        phoneNumber: '1234567890',
        resumeURL: 'resume.pdf',
      };

      jobModel.findById.mockImplementation(() => ({
        lean: jest.fn().mockResolvedValue(null),
      }));

      await expect(service.addApplication(userId, applyJobDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if already applied', async () => {
      const userId = mockProfiles[0]._id.toString();
      const applyJobDto = {
        jobId: mockJobs[0]._id.toString(),
        phoneNumber: '1234567890',
        resumeURL: 'resume.pdf',
      };

      jobModel.findById.mockImplementation(() => ({
        lean: jest.fn().mockResolvedValue(mockJobs[0]),
      }));

      applicationModel.findOne.mockImplementation(() => ({
        lean: jest.fn().mockResolvedValue({ _id: new Types.ObjectId() }),
      }));

      await expect(service.addApplication(userId, applyJobDto)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw ForbiddenException if application limit is reached for non-premium users', async () => {
      const userId = mockProfiles[1]._id.toString(); // Non-premium user
      const applyJobDto = {
        jobId: mockJobs[0]._id.toString(),
        phoneNumber: '1234567890',
        resumeURL: 'resume.pdf',
      };

      jobModel.findById.mockImplementation(() => ({
        lean: jest.fn().mockResolvedValue(mockJobs[0]),
      }));

      applicationModel.findOne.mockImplementation(() => ({
        lean: jest.fn().mockResolvedValue(null),
      }));

      profileModel.findById.mockImplementation(() => ({
        lean: jest.fn().mockResolvedValue(mockProfiles[1]), // Non-premium user with 0 application count
      }));

      await expect(service.addApplication(userId, applyJobDto)).rejects.toThrow(
        ForbiddenException,
      );
      expect(profileModel.findById).toHaveBeenCalledWith(
        new Types.ObjectId(userId),
      );
    });

    it('should throw InternalServerErrorException if application count update fails', async () => {
      const userId = mockProfiles[1]._id.toString(); // Non-premium user
      const applyJobDto = {
        jobId: mockJobs[0]._id.toString(),
        phoneNumber: '1234567890',
        resumeURL: 'resume.pdf',
      };

      jobModel.findById.mockImplementation(() => ({
        lean: jest.fn().mockResolvedValue(mockJobs[0]),
      }));

      applicationModel.findOne.mockImplementation(() => ({
        lean: jest.fn().mockResolvedValue(null),
      }));

      profileModel.findById.mockImplementation(() => ({
        lean: jest.fn().mockResolvedValue({
          ...mockProfiles[1],
          plan_statistics: { application_count: 1 }, // Non-premium user with 1 application count
        }),
      }));

      profileModel.updateOne.mockResolvedValue({ modifiedCount: 0 }); // Simulate failure to update application count

      await expect(service.addApplication(userId, applyJobDto)).rejects.toThrow(
        InternalServerErrorException,
      );
      expect(profileModel.updateOne).toHaveBeenCalledWith(
        { _id: new Types.ObjectId(userId) },
        { $inc: { 'plan_statistics.application_count': -1 } },
      );
    });
  });

  describe('saveJob', () => {
    it('should save a job for the user', async () => {
      const userId = mockProfiles[0]._id.toString();
      const jobId = mockJobs[0]._id.toString();

      jobModel.findById.mockImplementation(() => ({
        lean: jest.fn().mockResolvedValue(mockJobs[0]),
      }));

      jobModel.updateOne.mockResolvedValue({ modifiedCount: 1 });

      await service.saveJob(userId, jobId);
      expect(jobModel.findById).toHaveBeenCalledWith(new Types.ObjectId(jobId));
      expect(jobModel.updateOne).toHaveBeenCalledWith(
        { _id: new Types.ObjectId(jobId) },
        { $addToSet: { saved_by: new Types.ObjectId(userId) } },
      );
    });

    it('should throw NotFoundException if the job does not exist', async () => {
      const userId = mockProfiles[0]._id.toString();
      const jobId = new Types.ObjectId().toString();

      jobModel.findById.mockImplementation(() => ({
        lean: jest.fn().mockResolvedValue(null),
      }));

      await expect(service.saveJob(userId, jobId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw InternalServerErrorException if save operation fails', async () => {
      const userId = mockProfiles[0]._id.toString();
      const jobId = mockJobs[0]._id.toString();

      jobModel.findById.mockImplementation(() => ({
        lean: jest.fn().mockResolvedValue(mockJobs[0]),
      }));

      jobModel.updateOne.mockResolvedValue({ modifiedCount: 0 });

      await expect(service.saveJob(userId, jobId)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('unsaveJob', () => {
    it('should unsave a job for the user', async () => {
      const userId = mockProfiles[0]._id.toString();
      const jobId = mockJobs[0]._id.toString();

      jobModel.findById.mockImplementation(() => ({
        lean: jest.fn().mockResolvedValue(mockJobs[0]),
      }));

      jobModel.updateOne.mockResolvedValue({ modifiedCount: 1 });

      await service.unsaveJob(userId, jobId);
      expect(jobModel.findById).toHaveBeenCalledWith(new Types.ObjectId(jobId));
      expect(jobModel.updateOne).toHaveBeenCalledWith(
        { _id: new Types.ObjectId(jobId) },
        { $pull: { saved_by: new Types.ObjectId(userId) } },
      );
    });

    it('should throw NotFoundException if the job does not exist', async () => {
      const userId = mockProfiles[0]._id.toString();
      const jobId = new Types.ObjectId().toString();

      jobModel.findById.mockImplementation(() => ({
        lean: jest.fn().mockResolvedValue(null),
      }));

      await expect(service.unsaveJob(userId, jobId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw InternalServerErrorException if unsave operation fails', async () => {
      const userId = mockProfiles[0]._id.toString();
      const jobId = mockJobs[0]._id.toString();

      jobModel.findById.mockImplementation(() => ({
        lean: jest.fn().mockResolvedValue(mockJobs[0]),
      }));

      jobModel.updateOne.mockResolvedValue({ modifiedCount: 0 });

      await expect(service.unsaveJob(userId, jobId)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('deleteJob', () => {
    it('should delete a job and its applications', async () => {
      const userId = mockProfiles[0]._id.toString();
      const jobId = mockJobs[0]._id.toString();

      jobModel.findById.mockImplementation(() => ({
        lean: jest.fn().mockResolvedValue(mockJobs[0]),
      }));

      companyManagerModel.findOne.mockImplementation(() => ({
        lean: jest.fn().mockResolvedValue(true),
      }));

      applicationModel.deleteMany.mockResolvedValue({ deletedCount: 1 });
      jobModel.deleteOne.mockResolvedValue({ deletedCount: 1 });

      await service.deleteJob(userId, jobId);
      expect(jobModel.findById).toHaveBeenCalledWith(new Types.ObjectId(jobId));
      expect(applicationModel.deleteMany).toHaveBeenCalledWith({
        job_id: new Types.ObjectId(jobId),
      });
      expect(jobModel.deleteOne).toHaveBeenCalledWith({
        _id: new Types.ObjectId(jobId),
      });
    });

    it('should throw NotFoundException if the job does not exist', async () => {
      const userId = mockProfiles[0]._id.toString();
      const jobId = new Types.ObjectId().toString();

      jobModel.findById.mockImplementation(() => ({
        lean: jest.fn().mockResolvedValue(null),
      }));

      await expect(service.deleteJob(userId, jobId)).rejects.toThrow(
        NotFoundException,
      );
      expect(jobModel.findById).toHaveBeenCalledWith(new Types.ObjectId(jobId));
    });

    it('should throw ForbiddenException if the user does not have access', async () => {
      const userId = mockProfiles[0]._id.toString();
      const jobId = mockJobs[0]._id.toString();

      jobModel.findById.mockImplementation(() => ({
        lean: jest.fn().mockResolvedValue(mockJobs[0]),
      }));

      companyManagerModel.findOne.mockImplementation(() => ({
        lean: jest.fn().mockResolvedValue(null),
      }));

      await expect(service.deleteJob(userId, jobId)).rejects.toThrow(
        ForbiddenException,
      );
      expect(companyManagerModel.findOne).toHaveBeenCalledWith({
        manager_id: new Types.ObjectId(userId),
        company_id: new Types.ObjectId(mockJobs[0].company_id),
      });
    });

    it('should throw InternalServerErrorException if associated applications deletion fails', async () => {
      const userId = mockProfiles[0]._id.toString();
      const jobId = mockJobs[0]._id.toString();

      jobModel.findById.mockImplementation(() => ({
        lean: jest.fn().mockResolvedValue(mockJobs[0]),
      }));

      companyManagerModel.findOne.mockImplementation(() => ({
        lean: jest.fn().mockResolvedValue(true),
      }));

      applicationModel.deleteMany.mockResolvedValue({ deletedCount: 0 });

      await expect(service.deleteJob(userId, jobId)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('should throw InternalServerErrorException if job deletion fails', async () => {
      const userId = mockProfiles[0]._id.toString();
      const jobId = mockJobs[0]._id.toString();

      jobModel.findById.mockImplementation(() => ({
        lean: jest.fn().mockResolvedValue(mockJobs[0]),
      }));

      companyManagerModel.findOne.mockImplementation(() => ({
        lean: jest.fn().mockResolvedValue(true),
      }));

      applicationModel.deleteMany.mockResolvedValue({ deletedCount: 1 });
      jobModel.deleteOne.mockResolvedValue({ deletedCount: 0 });

      await expect(service.deleteJob(userId, jobId)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('getSavedJobs', () => {
    it('should return saved jobs for the user', async () => {
      const userId = mockProfiles[0]._id.toString();

      jobModel.find.mockImplementation(() => ({
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([mockJobs[0]]),
      }));

      jobModel.countDocuments.mockResolvedValue(1);

      companyModel.findById.mockImplementation(() => ({
        lean: jest.fn().mockResolvedValue(mockCompanies[0]),
      }));

      const result = await service.getSavedJobs(userId, 1, 10);
      expect(result.jobs.length).toBe(1);
      expect(result.jobs[0].companyName).toBe(mockCompanies[0].name);
    });

    it('should handle empty results', async () => {
      const userId = mockProfiles[0]._id.toString();

      jobModel.find.mockImplementation(() => ({
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      }));

      jobModel.countDocuments.mockResolvedValue(0);

      const result = await service.getSavedJobs(userId, 1, 10);
      expect(result.jobs.length).toBe(0);
      expect(result.totalItems).toBe(0);
    });

    it('should throw InternalServerErrorException if an error occurs', async () => {
      const userId = mockProfiles[0]._id.toString();

      jobModel.find.mockImplementation(() => {
        throw new Error('Database error');
      });

      await expect(service.getSavedJobs(userId, 1, 10)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('getAppliedApplications', () => {
    const page = 1;
    const limit = 5;

    it('should return applied applications with job details', async () => {
      const userId = mockProfiles[0]._id.toString();

      applicationModel.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockApplications),
      });

      applicationModel.countDocuments.mockResolvedValue(1);

      jobModel.find.mockImplementation(() => ({
        lean: jest.fn().mockResolvedValue(mockJobs),
      }));

      companyModel.findById.mockImplementation(() => ({
        lean: jest.fn().mockResolvedValue(mockCompanies[0]),
      }));

      const result = await service.getAppliedApplications(userId, page, limit);
      expect(result.jobs.length).toBe(1);
      expect(result.totalItems).toBe(1);
      expect(result.jobs[0].companyName).toBe(mockCompanies[0].name);
      expect(result.jobs[0].status).toBe('Pending');
    });

    // it('should handle empty results', async () => {
    //   const userId = mockProfiles[0]._id.toString();

    //   applicationModel.find.mockReturnValue({
    //     sort: jest.fn().mockReturnThis(),
    //     skip: jest.fn().mockReturnThis(),
    //     limit: jest.fn().mockReturnThis(),
    //     lean: jest.fn().mockResolvedValue([]),
    //   });

    //   applicationModel.countDocuments.mockResolvedValue(0);

    //   const result = await service.getAppliedApplications(userId, page, limit);
    //   expect(result.jobs.length).toBe(0);
    //   expect(result.totalItems).toBe(0);
    //   expect(result.totalPages).toBe(0);
    //   expect(result.currentPage).toBe(page);
    // });

    // it('should not throw an exception if no applications are found', async () => {
    //   const userId = mockProfiles[0]._id.toString();

    //   applicationModel.find.mockReturnValue({
    //     sort: jest.fn().mockReturnThis(),
    //     skip: jest.fn().mockReturnThis(),
    //     limit: jest.fn().mockReturnThis(),
    //     lean: jest.fn().mockResolvedValue([]),
    //   });

    //   applicationModel.countDocuments.mockResolvedValue(0);

    //   const result = await service.getAppliedApplications(userId, page, limit);
    //   expect(result.jobs).toEqual([]);
    //   expect(result.totalItems).toBe(0);
    //   expect(result.totalPages).toBe(0);
    //   expect(result.currentPage).toBe(page);
    // });

    it('should throw InternalServerErrorException if an error occurs', async () => {
      const userId = mockProfiles[0]._id.toString();

      applicationModel.find.mockImplementation(() => {
        throw new Error('Database error');
      });

      await expect(
        service.getAppliedApplications(userId, page, limit),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('updateApplicationStatus', () => {
    const userId = mockProfiles[0]._id.toString();
    const applicationId = mockApplications[0]._id.toString();
    const status = 'Accepted';

    beforeEach(() => {
      jest.clearAllMocks();

      // Properly mock applicationModel.findById
      applicationModel.findById = jest.fn().mockImplementation(() => ({
        lean: jest.fn().mockResolvedValue(mockApplications[0]),
      }));

      // Properly mock jobModel.findById
      jobModel.findById = jest.fn().mockImplementation(() => ({
        lean: jest.fn().mockResolvedValue(mockJobs[0]),
      }));

      // Properly mock companyModel.findById
      companyModel.findById = jest.fn().mockImplementation(() => ({
        lean: jest.fn().mockResolvedValue(mockCompanies[0]),
      }));

      // Mock checkAccess
      jest.spyOn(service, 'checkAccess').mockResolvedValue(true);

      // Mock applicationModel.updateOne
      applicationModel.updateOne = jest
        .fn()
        .mockResolvedValue({ modifiedCount: 1 });

      // Mock addNotification
      jest
        .spyOn(notificationHelper, 'addNotification')
        .mockResolvedValue({} as any);
    });

    it('should update status successfully', async () => {
      await service.updateApplicationStatus(userId, applicationId, status);

      expect(applicationModel.updateOne).toHaveBeenCalledWith(
        { _id: new Types.ObjectId(applicationId) },
        { $set: { status } },
      );
    });

    it('should throw NotFoundException if application not found', async () => {
      applicationModel.findById = jest.fn().mockImplementation(() => ({
        lean: jest.fn().mockResolvedValue(null),
      }));

      await expect(
        service.updateApplicationStatus(userId, applicationId, status),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if job not found', async () => {
      jobModel.findById = jest.fn().mockImplementation(() => ({
        lean: jest.fn().mockResolvedValue(null),
      }));

      await expect(
        service.updateApplicationStatus(userId, applicationId, status),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if no access', async () => {
      jest.spyOn(service, 'checkAccess').mockResolvedValue(false);

      await expect(
        service.updateApplicationStatus(userId, applicationId, status),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if company not found', async () => {
      companyModel.findById = jest.fn().mockImplementation(() => ({
        lean: jest.fn().mockResolvedValue(null),
      }));

      await expect(
        service.updateApplicationStatus(userId, applicationId, status),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw InternalServerErrorException on update failure', async () => {
      applicationModel.updateOne = jest
        .fn()
        .mockResolvedValue({ modifiedCount: 0 });

      await expect(
        service.updateApplicationStatus(userId, applicationId, status),
      ).rejects.toThrow(InternalServerErrorException);
    });

    it('should throw InternalServerErrorException on unexpected error', async () => {
      applicationModel.findById = jest.fn().mockImplementation(() => {
        throw new Error('Database error');
      });

      await expect(
        service.updateApplicationStatus(userId, applicationId, status),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });
});
