import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import {
  mockProfiles,
  mockCompanies,
  mockCompanyConnections,
  mockCompanyEmployers,
  mockCompanyManagers,
  mockJobs,
  mockUserConnections,
  mockUsers,
} from './mock.data';
import { CompaniesService } from './companies.service';
import { Company } from './infrastructure/database/schemas/company.schema';
import { CompanyConnection } from './infrastructure/database/schemas/company-connection.schema';
import { User } from '../users/infrastructure/database/schemas/user.schema';
import { Profile } from '../profiles/infrastructure/database/schemas/profile.schema';
import { UserConnection } from '../connections/infrastructure/database/schemas/user-connection.schema';
import { CompanyManager } from './infrastructure/database/schemas/company-manager.schema';
import { CompanyEmployer } from '../jobs/infrastructure/database/schemas/company-employer.schema';
import { Job } from '../jobs/infrastructure/database/schemas/job.schema';
import { Application } from '../jobs/infrastructure/database/schemas/application.schema';
import { handleError } from '../common/utils/exception-handler';
import { CompanySize } from './enums/company-size.enum';
import { CompanyType } from './enums/company-type.enum';
import { toGetCompanyDto } from './mappers/company.mapper';
import { ConnectionStatus } from '../connections/enums/connection-status.enum';
import { ApplicationStatus } from '../jobs/enums/application-status.enum';
import { NotificationGateway } from '../gateway/notification.gateway';
import * as postHelpers from '../posts/helpers/posts.helpers';
import * as notificationHelpers from '../notifications/helpers/notification.helper';

jest.mock('../common/utils/exception-handler', () => ({
  handleError: jest.fn(),
}));

describe('CompaniesService', () => {
  let service: CompaniesService;
  let companyModel: any;
  let companyConnectionModel: any;
  let companyManagerModel: any;
  let companyEmployerModel: any;
  let userModel: any;
  let profileModel: any;
  let userConnectionModel: any;
  let jobModel: any;
  let applicationModel: any;
  let notificationModelMock: any;
  let notificationGatewayMock;

  const mockCompanyModel = {
    findOne: jest.fn(),
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
    save: jest.fn(),
  };

  const mockCompanyConnectionModel = {
    findOne: jest.fn(),
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
    save: jest.fn(),
  };

  const mockCompanyManagerModel = {
    findOne: jest.fn(),
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
    save: jest.fn(),
  };

  const mockCompanyEmployerModel = {
    findOne: jest.fn(),
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
    save: jest.fn(),
  };

  const mockUserModel = {
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    find: jest.fn(),
  };

  const mockProfileModel = {
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    find: jest.fn(),
  };

  const mockUserConnectionModel = {
    find: jest.fn(),
    findById: jest.fn(),
    findOne: jest.fn(),
  };

  const mockJobModel = {
    find: jest.fn(),
    findById: jest.fn(),
    findOne: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
    save: jest.fn(),
  };

  const mockApplicationModel = {
    find: jest.fn(),
    findById: jest.fn(),
    findOne: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CompaniesService,
        {
          provide: getModelToken(Company.name),
          useValue: mockCompanyModel,
        },
        {
          provide: getModelToken(CompanyConnection.name),
          useValue: mockCompanyConnectionModel,
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
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
        {
          provide: getModelToken(Profile.name),
          useValue: mockProfileModel,
        },
        {
          provide: getModelToken(UserConnection.name),
          useValue: mockUserConnectionModel,
        },
        {
          provide: getModelToken(Job.name),
          useValue: mockJobModel,
        },
        {
          provide: getModelToken(Application.name),
          useValue: mockApplicationModel,
        },
        {
          provide: getModelToken(Notification.name),
          useValue: notificationModelMock,
        }, // Add this mock
        {
          provide: NotificationGateway,
          useValue: notificationGatewayMock,
        },
      ],
    }).compile();

    service = module.get<CompaniesService>(CompaniesService);

    companyModel = module.get(getModelToken(Company.name));
    companyConnectionModel = module.get(getModelToken(CompanyConnection.name));
    companyManagerModel = module.get(getModelToken(CompanyManager.name));
    companyEmployerModel = module.get(getModelToken(CompanyEmployer.name));
    userModel = module.get(getModelToken(User.name));
    profileModel = module.get(getModelToken(Profile.name));
    userConnectionModel = module.get(getModelToken(UserConnection.name));
    jobModel = module.get(getModelToken(Job.name));
    applicationModel = module.get(getModelToken(Application.name));
    jest.clearAllMocks();
    jest.spyOn(notificationHelpers, 'addNotification').mockResolvedValue(null);
    jest
      .spyOn(notificationHelpers, 'deleteNotification')
      .mockResolvedValue(null);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('checkAccess', () => {
    it('should return true if the user is a manager of the company (profileId1 → companyId1)', async () => {
      companyManagerModel.findOne.mockReturnValueOnce({
        lean: jest.fn().mockResolvedValueOnce(mockCompanyManagers[0]),
      });
      const result = await service.checkAccess(
        mockProfiles[0]._id.toString(),
        mockCompanies[0]._id.toString(),
      );
      expect(result).toBe(true);
      expect(companyManagerModel.findOne).toHaveBeenCalledWith({
        manager_id: mockProfiles[0]._id,
        company_id: mockCompanies[0]._id,
      });
    });

    it('should return false if the user is not a manager of the company (profileId2 → companyId4)', async () => {
      companyManagerModel.findOne.mockReturnValueOnce({
        lean: jest.fn().mockResolvedValueOnce(null),
      });
      const result = await service.checkAccess(
        mockProfiles[1]._id.toString(),
        mockCompanies[3]._id.toString(),
      );
      expect(result).toBe(false);
      expect(companyManagerModel.findOne).toHaveBeenCalledWith({
        manager_id: mockProfiles[1]._id,
        company_id: mockCompanies[3]._id,
      });
    });
  });

  describe('createCompany', () => {
    it('should successfully create a company and assign manager role (profileId3)', async () => {
      const createDto = {
        name: 'Unique Company',
        companySize: CompanySize.Small,
        companyType: CompanyType.Government,
        industry: 'Test',
        email: 'test@gmail.com',
        website: 'www.test.com',
        contactNumber: '1234',
      };
      const findOneMock = jest.fn().mockResolvedValueOnce(null);
      companyModel.findOne = findOneMock;
      const savedCompany = { ...createDto, _id: new Types.ObjectId() };
      const saveCompanyMock = jest.fn().mockResolvedValueOnce(savedCompany);
      const saveManagerMock = jest.fn().mockResolvedValueOnce({});
      const companyConstructorMock = jest
        .fn()
        .mockImplementation(() => ({ ...savedCompany, save: saveCompanyMock }));
      const managerConstructorMock = jest
        .fn()
        .mockImplementation(() => ({ save: saveManagerMock }));
      (service as any).companyModel = Object.assign(companyConstructorMock, {
        findOne: findOneMock,
      });
      (service as any).companyManagerModel = managerConstructorMock;
      userModel.findByIdAndUpdate.mockResolvedValueOnce({});
      const result = await service.createCompany(
        mockProfiles[2]._id.toString(),
        createDto,
      );
      expect(findOneMock).toHaveBeenCalledWith({
        $or: [
          { name: createDto.name },
          { website: createDto.website },
          { email: createDto.email },
          { contact_number: createDto.contactNumber },
        ],
      });
      expect(saveCompanyMock).toHaveBeenCalled();
      expect(saveManagerMock).toHaveBeenCalled();
      expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockProfiles[2]._id,
        { $set: { role: 'manager' } },
        { upsert: false },
      );
      expect(result).toEqual(toGetCompanyDto(savedCompany));
    });

    it('should throw ConflictException if company with same name exists', async () => {
      const createDto = {
        name: mockCompanies[0].name,
      };
      (service as any).companyModel = mockCompanyModel;
      companyModel.findOne.mockResolvedValueOnce(mockCompanies[0]);
      await service.createCompany(mockProfiles[0]._id.toString(), createDto);
      expect(companyModel.findOne).toHaveBeenCalledWith({
        $or: [{ name: mockCompanies[0].name }],
      });
      expect(handleError).toHaveBeenCalledWith(
        new ConflictException(
          'Company name, website, email and contact number must be unique.',
        ),
        'Failed to create company.',
      );
    });
  });

  describe('updateCompany', () => {
    it('should successfully update the company name when user has access (profileId1 → companyId1)', async () => {
      const userId = mockProfiles[0]._id.toString();
      const companyId = mockCompanies[0]._id.toString();
      const updateDto = {
        name: 'Updated Company Name',
        email: 'test@gmail.com',
        website: 'www.test.com',
        contactNumber: '1234',
      };
      const updateSchema = {
        name: 'Updated Company Name',
        email: 'test@gmail.com',
        website: 'www.test.com',
        contact_number: '1234',
      };
      companyModel.findById.mockReturnValueOnce({
        lean: jest.fn().mockResolvedValueOnce(mockCompanies[0]),
      });
      jest.spyOn(service, 'checkAccess').mockResolvedValueOnce(true);
      companyModel.findOne.mockResolvedValueOnce(null);
      companyModel.findByIdAndUpdate.mockResolvedValueOnce({
        ...mockCompanies[0],
        ...updateSchema,
      });
      const result = await service.updateCompany(userId, companyId, updateDto);
      expect(result.name).toBe(updateDto.name);
      expect(companyModel.findByIdAndUpdate).toHaveBeenCalledWith(
        new Types.ObjectId(companyId),
        { $set: updateSchema },
        { new: true },
      );
    });

    it('should throw ConflictException if another company with same name exists', async () => {
      const userId = mockProfiles[0]._id.toString();
      const companyId = mockCompanies[0]._id.toString();
      const updateDto = { name: mockCompanies[1].name };
      companyModel.findById.mockReturnValueOnce({
        lean: jest.fn().mockResolvedValueOnce(mockCompanies[0]),
      });
      jest.spyOn(service, 'checkAccess').mockResolvedValueOnce(true);
      companyModel.findOne.mockResolvedValueOnce(mockCompanies[1]);
      await service.updateCompany(userId, companyId, updateDto);
      expect(handleError).toHaveBeenCalledWith(
        new ConflictException(
          'Company name, website, email and contact number must be unique.',
        ),
        'Failed to update company details.',
      );
    });

    it('should throw NotFoundException if the company does not exist', async () => {
      const userId = mockProfiles[0]._id.toString();
      const companyId = new Types.ObjectId().toString();
      const updateDto = { name: 'Test' };
      companyModel.findById.mockReturnValueOnce({
        lean: jest.fn().mockResolvedValueOnce(null),
      });
      await service.updateCompany(userId, companyId, updateDto);
      expect(handleError).toHaveBeenCalledWith(
        new NotFoundException('Company not found.'),
        'Failed to update company details.',
      );
    });

    it('should throw ForbiddenException if user does not have access', async () => {
      const userId = mockProfiles[1]._id.toString();
      const companyId = mockCompanies[0]._id.toString();
      const updateDto = { name: 'No Access Update' };
      companyModel.findById.mockReturnValueOnce({
        lean: jest.fn().mockResolvedValueOnce(mockCompanies[0]),
      });
      jest.spyOn(service, 'checkAccess').mockResolvedValueOnce(false);
      await service.updateCompany(userId, companyId, updateDto);
      expect(handleError).toHaveBeenCalledWith(
        new ForbiddenException(
          'Logged in user does not have management access to this company.',
        ),
        'Failed to update company details.',
      );
    });
  });

  describe('deleteCompany', () => {
    it('should successfully delete a company and related data', async () => {
      const userId = mockProfiles[0]._id.toString();
      const companyId = mockCompanies[0]._id.toString();
      companyModel.findById.mockReturnValueOnce({
        lean: jest.fn().mockResolvedValueOnce(mockCompanies[0]),
      });
      jest.spyOn(service, 'checkAccess').mockResolvedValueOnce(true);
      companyModel.findByIdAndDelete = jest.fn().mockReturnValueOnce({
        lean: jest.fn().mockResolvedValueOnce(mockCompanies[0]),
      });
      companyConnectionModel.deleteMany = jest.fn().mockResolvedValueOnce({});
      companyManagerModel.deleteMany = jest.fn().mockResolvedValueOnce({});
      companyEmployerModel.deleteMany = jest.fn().mockResolvedValueOnce({});
      jobModel.find.mockResolvedValueOnce([mockJobs[0]]);
      jobModel.deleteMany = jest.fn().mockResolvedValueOnce({});
      applicationModel.deleteMany = jest.fn().mockResolvedValueOnce({});
      await expect(
        service.deleteCompany(userId, companyId),
      ).resolves.toBeUndefined();
    });

    it('should throw NotFoundException if the company does not exist', async () => {
      const userId = mockProfiles[0]._id.toString();
      const invalidCompanyId = new Types.ObjectId().toString();
      companyModel.findById.mockReturnValueOnce({
        lean: jest.fn().mockResolvedValueOnce(null),
      });
      await service.deleteCompany(userId, invalidCompanyId);
      expect(handleError).toHaveBeenCalledWith(
        new NotFoundException('Company not found.'),
        'Failed to delete company.',
      );
    });

    it('should throw ForbiddenException if user does not have management access', async () => {
      const userId = mockProfiles[1]._id.toString();
      const companyId = mockCompanies[0]._id.toString();
      companyModel.findById.mockReturnValueOnce({
        lean: jest.fn().mockResolvedValueOnce(mockCompanies[0]),
      });
      jest.spyOn(service, 'checkAccess').mockResolvedValueOnce(false);
      await service.deleteCompany(userId, companyId);
      expect(handleError).toHaveBeenCalledWith(
        new ForbiddenException(
          'Logged in user does not have management access to this company.',
        ),
        'Failed to delete company.',
      );
    });
  });

  describe('getCompanyDetails', () => {
    it('should return company details with isFollowing = true and isManager = true for profileId1 and companyId1', async () => {
      const userId = mockProfiles[0]._id.toString();
      const companyId = mockCompanies[0]._id.toString();
      companyModel.findById.mockReturnValueOnce({
        lean: jest.fn().mockResolvedValueOnce(mockCompanies[0]),
      });
      companyConnectionModel.findOne.mockResolvedValueOnce(
        mockCompanyConnections[0],
      );
      jest.spyOn(service, 'checkAccess').mockResolvedValueOnce(true);
      const result = await service.getCompanyDetails(userId, companyId);
      expect(result.companyId.toString()).toBe(mockCompanies[0]._id.toString());
      expect(result.isFollowing).toBe(true);
      expect(result.isManager).toBe(true);
      expect(companyModel.findById).toHaveBeenCalledWith(
        new Types.ObjectId(companyId),
      );
      expect(companyConnectionModel.findOne).toHaveBeenCalledWith({
        user_id: new Types.ObjectId(userId),
        company_id: new Types.ObjectId(companyId),
      });
    });

    it('should throw NotFoundException if the company does not exist', async () => {
      const userId = mockProfiles[0]._id.toString();
      const invalidCompanyId = new Types.ObjectId().toString();
      companyModel.findById.mockReturnValueOnce({
        lean: jest.fn().mockResolvedValueOnce(null),
      });
      await service.getCompanyDetails(userId, invalidCompanyId);
      expect(handleError).toHaveBeenCalledWith(
        new NotFoundException('Company not found.'),
        'Failed to retrieve company details.',
      );
    });

    it('should catch and handle unexpected errors during getCompanyDetails', async () => {
      const userId = mockProfiles[0]._id.toString();
      const companyId = mockCompanies[0]._id.toString();
      companyModel.findById.mockImplementationOnce(() => {
        throw new Error('Unexpected Error');
      });
      await service.getCompanyDetails(userId, companyId);
      expect(handleError).toHaveBeenCalledWith(
        new Error('Unexpected Error'),
        'Failed to retrieve company details.',
      );
    });
  });

  describe('filterCompanies', () => {
    it('should return companies filtered by industry "ware" with correct isFollowing and isManager flags', async () => {
      const userId = mockProfiles[0]._id.toString();
      const page = 1;
      const limit = 5;
      const industry = 'ware';
      const matchingCompanies = mockCompanies.filter((c) =>
        c.industry.toLowerCase().includes(industry),
      );
      companyModel.find.mockReturnValueOnce({
        select: jest.fn().mockReturnValueOnce({
          sort: jest.fn().mockReturnValueOnce({
            skip: jest.fn().mockReturnValueOnce({
              limit: jest.fn().mockReturnValueOnce({
                lean: jest.fn().mockResolvedValueOnce(matchingCompanies),
              }),
            }),
          }),
        }),
      });
      const connections = mockCompanyConnections.filter(
        (conn) =>
          conn.user_id.toString() === userId &&
          matchingCompanies.some(
            (c) => c._id.toString() === conn.company_id.toString(),
          ),
      );
      companyConnectionModel.find.mockReturnValueOnce({
        lean: jest.fn().mockResolvedValueOnce(connections),
      });
      jest
        .spyOn(service, 'checkAccess')
        .mockImplementation(
          async (uid, cid) =>
            uid === userId && cid === mockCompanies[0]._id.toString(),
        );
      const result = await service.filterCompanies(
        userId,
        page,
        limit,
        undefined,
        industry,
      );
      expect(result).toHaveLength(matchingCompanies.length);
      result.forEach((companyDto) => {
        expect(companyDto.isFollowing).toBe(
          connections.some(
            (conn) =>
              conn.company_id.toString() === companyDto.companyId.toString(),
          ),
        );
        expect(companyDto.isManager).toBe(
          companyDto.companyId.toString() === mockCompanies[0]._id.toString(),
        );
      });
    });

    it('should return companies filtered by name "test" with correct follow and manager flags', async () => {
      const userId = mockProfiles[0]._id.toString();
      const page = 1;
      const limit = 5;
      const name = 'test';
      const matchingCompanies = mockCompanies.filter((c) =>
        c.name.toLowerCase().includes(name),
      );
      companyModel.find.mockReturnValueOnce({
        select: jest.fn().mockReturnValueOnce({
          sort: jest.fn().mockReturnValueOnce({
            skip: jest.fn().mockReturnValueOnce({
              limit: jest.fn().mockReturnValueOnce({
                lean: jest.fn().mockResolvedValueOnce(matchingCompanies),
              }),
            }),
          }),
        }),
      });
      const connections = mockCompanyConnections.filter(
        (conn) =>
          conn.user_id.toString() === userId &&
          matchingCompanies.some(
            (c) => c._id.toString() === conn.company_id.toString(),
          ),
      );
      companyConnectionModel.find.mockReturnValueOnce({
        lean: jest.fn().mockResolvedValueOnce(connections),
      });
      jest
        .spyOn(service, 'checkAccess')
        .mockImplementation(
          async (uid, cid) =>
            uid === userId && cid === mockCompanies[0]._id.toString(),
        );
      const result = await service.filterCompanies(userId, page, limit, name);
      expect(result).toHaveLength(matchingCompanies.length);
      result.forEach((companyDto) => {
        expect(companyDto.isFollowing).toBe(
          connections.some(
            (conn) =>
              conn.company_id.toString() === companyDto.companyId.toString(),
          ),
        );
        expect(companyDto.isManager).toBe(
          companyDto.companyId.toString() === mockCompanies[0]._id.toString(),
        );
      });
    });

    it('should handle and report errors in filterCompanies', async () => {
      const userId = mockProfiles[0]._id.toString();
      const page = 1;
      const limit = 5;
      companyModel.find.mockImplementationOnce(() => {
        throw new Error('Unexpected Error');
      });
      await service.filterCompanies(userId, page, limit);
      expect(handleError).toHaveBeenCalledWith(
        new Error('Unexpected Error'),
        'Failed to retrieve list of companies.',
      );
    });
  });

  describe('getCompanyFollowers', () => {
    it('should throw NotFoundException if company does not exist', async () => {
      const companyId = new Types.ObjectId().toString();
      companyModel.findById.mockReturnValueOnce({
        lean: jest.fn().mockResolvedValueOnce(null),
      });
      await service.getCompanyFollowers(companyId, 1, 10);
      expect(handleError).toHaveBeenCalledWith(
        new NotFoundException('Company not found.'),
        'Failed to retrieve list of followers.',
      );
    });

    it('should handle and report unexpected errors', async () => {
      const companyId = mockCompanies[0]._id.toString();
      companyModel.findById.mockImplementationOnce(() => {
        throw new Error('Unexpected Error');
      });
      await service.getCompanyFollowers(companyId, 1, 10);
      expect(handleError).toHaveBeenCalledWith(
        new Error('Unexpected Error'),
        'Failed to retrieve list of followers.',
      );
    });

    it('should return followers of companyId1 as profileId1 and profileId2', async () => {
      const companyId = mockCompanies[0]._id.toString();
      const page = 1;
      const limit = 5;
      companyModel.findById.mockReturnValueOnce({
        lean: jest.fn().mockResolvedValueOnce(mockCompanies[0]),
      });
      const mockAggregationResult = [mockProfiles[0], mockProfiles[1]];
      companyConnectionModel.aggregate = jest
        .fn()
        .mockResolvedValueOnce(mockAggregationResult);
      const result = await service.getCompanyFollowers(companyId, page, limit);
      expect(result).toHaveLength(2);
      expect(result[0].userId.toString()).toBe(mockProfiles[0]._id.toString());
      expect(result[1].userId.toString()).toBe(mockProfiles[1]._id.toString());
      expect(companyModel.findById).toHaveBeenCalledWith(
        new Types.ObjectId(companyId),
      );
      expect(companyConnectionModel.aggregate).toHaveBeenCalledWith([
        { $match: { company_id: new Types.ObjectId(companyId) } },
        {
          $lookup: {
            from: 'Profiles',
            localField: 'user_id',
            foreignField: '_id',
            as: 'profile',
          },
        },
        { $unwind: '$profile' },
        { $sort: { created_at: -1, _id: 1 } },
        { $skip: 0 },
        { $limit: limit },
        {
          $project: {
            _id: '$profile._id',
            first_name: '$profile.first_name',
            last_name: '$profile.last_name',
            profile_picture: '$profile.profile_picture',
            headline: '$profile.headline',
          },
        },
      ]);
    });
  });

  describe('followCompany', () => {
    it('should successfully follow a company (profileId4 → companyId4)', async () => {
      const userId = mockProfiles[3]._id.toString();
      const companyId = mockCompanies[3]._id.toString();
      companyModel.findById.mockReturnValueOnce({
        lean: jest.fn().mockResolvedValueOnce(mockCompanies[3]),
      });
      companyConnectionModel.findOne.mockReturnValueOnce({
        lean: jest.fn().mockResolvedValueOnce(null),
      });
      const saveMock = jest.fn().mockResolvedValueOnce({});
      const companyConnectionConstructor = jest
        .fn()
        .mockImplementation(() => ({ save: saveMock }));
      const originalFindOne = companyConnectionModel.findOne;
      (service as any).companyConnectionModel = Object.assign(
        companyConnectionConstructor,
        {
          findOne: originalFindOne,
        },
      );
      companyModel.findByIdAndUpdate = jest.fn().mockResolvedValueOnce({});
      await expect(
        service.followCompany(userId, companyId),
      ).resolves.not.toThrow();
      expect(companyConnectionModel.findOne).toHaveBeenCalledWith({
        user_id: new Types.ObjectId(userId),
        company_id: new Types.ObjectId(companyId),
      });
      expect(companyConnectionConstructor).toHaveBeenCalledWith({
        _id: expect.any(Types.ObjectId),
        user_id: new Types.ObjectId(userId),
        company_id: new Types.ObjectId(companyId),
      });
      expect(saveMock).toHaveBeenCalled();
      expect(companyModel.findByIdAndUpdate).toHaveBeenCalledWith(
        new Types.ObjectId(companyId),
        { $inc: { followers: 1 } },
        { new: true },
      );
    });

    it('should throw NotFoundException if the company does not exist', async () => {
      const userId = mockProfiles[0]._id.toString();
      const invalidCompanyId = new Types.ObjectId().toString();
      companyModel.findById.mockReturnValueOnce({
        lean: jest.fn().mockResolvedValueOnce(null),
      });
      await service.followCompany(userId, invalidCompanyId);
      expect(handleError).toHaveBeenCalledWith(
        new NotFoundException('Company not found.'),
        'Failed to follow company.',
      );
    });

    it('should throw ConflictException if the user already follows the company (profileId3 → companyId4)', async () => {
      const userId = mockProfiles[2]._id.toString();
      const companyId = mockCompanies[3]._id.toString();
      companyModel.findById.mockReturnValueOnce({
        lean: jest.fn().mockResolvedValueOnce(mockCompanies[3]),
      });
      companyConnectionModel.findOne.mockReturnValueOnce({
        lean: jest.fn().mockResolvedValueOnce(mockCompanyConnections[3]),
      });
      (service as any).companyConnectionModel = {
        findOne: companyConnectionModel.findOne,
      };
      await service.followCompany(userId, companyId);
      expect(companyConnectionModel.findOne).toHaveBeenCalledWith({
        user_id: new Types.ObjectId(userId),
        company_id: new Types.ObjectId(companyId),
      });
      expect(handleError).toHaveBeenCalledWith(
        new ConflictException('User already follows this company.'),
        'Failed to follow company.',
      );
    });
  });

  describe('unfollowCompany', () => {
    it('should successfully unfollow a company (profileId3 → companyId4)', async () => {
      const userId = mockProfiles[2]._id.toString();
      const companyId = mockCompanies[3]._id.toString();
      companyModel.findById.mockReturnValueOnce({
        lean: jest.fn().mockResolvedValueOnce(mockCompanies[3]),
      });
      const deletedFollowMock = mockCompanyConnections[3];
      companyConnectionModel.findOneAndDelete = jest
        .fn()
        .mockResolvedValueOnce(deletedFollowMock);
      companyModel.findByIdAndUpdate.mockResolvedValueOnce({});
      await expect(
        service.unfollowCompany(userId, companyId),
      ).resolves.not.toThrow();
      expect(companyConnectionModel.findOneAndDelete).toHaveBeenCalledWith({
        user_id: new Types.ObjectId(userId),
        company_id: new Types.ObjectId(companyId),
      });
      expect(companyModel.findByIdAndUpdate).toHaveBeenCalledWith(
        new Types.ObjectId(companyId),
        { $inc: { followers: -1 } },
        { new: true },
      );
    });

    it('should throw NotFoundException if the company does not exist', async () => {
      const userId = mockProfiles[0]._id.toString();
      const invalidCompanyId = new Types.ObjectId().toString();
      companyModel.findById.mockReturnValueOnce({
        lean: jest.fn().mockResolvedValueOnce(null),
      });
      await service.unfollowCompany(userId, invalidCompanyId);
      expect(handleError).toHaveBeenCalledWith(
        new NotFoundException('Company not found.'),
        'Failed to unfollow company.',
      );
    });

    it('should throw NotFoundException if the user is not following the company (profileId1 → companyId5)', async () => {
      const userId = mockProfiles[0]._id.toString();
      const companyId = mockCompanies[4]._id.toString();
      companyModel.findById.mockReturnValueOnce({
        lean: jest.fn().mockResolvedValueOnce(mockCompanies[4]),
      });
      companyConnectionModel.findOneAndDelete = jest
        .fn()
        .mockResolvedValueOnce(null);
      await service.unfollowCompany(userId, companyId);
      expect(handleError).toHaveBeenCalledWith(
        new NotFoundException(
          'Follow record not found. User is not following this company.',
        ),
        'Failed to unfollow company.',
      );
    });
  });

  describe('getSuggestedCompanies', () => {
    // it('should return suggested companies based on industry and size (from companyId1)', async () => {
    //   const userId = mockProfiles[0]._id.toString();
    //   const companyId = mockCompanies[0]._id.toString();
    //   const page = 1;
    //   const limit = 5;
    //   companyModel.findById.mockReturnValueOnce({
    //     select: jest.fn().mockReturnValueOnce({
    //       lean: jest.fn().mockResolvedValueOnce({
    //         industry: mockCompanies[0].industry,
    //         company_size: mockCompanies[0].company_size,
    //       }),
    //     }),
    //   });
    //   const suggestedCompanies = [mockCompanies[1]];
    //   companyModel.find.mockReturnValueOnce({
    //     select: jest.fn().mockReturnValueOnce({
    //       sort: jest.fn().mockReturnValueOnce({
    //         skip: jest.fn().mockReturnValueOnce({
    //           limit: jest.fn().mockReturnValueOnce({
    //             lean: jest.fn().mockResolvedValueOnce(suggestedCompanies),
    //           }),
    //         }),
    //       }),
    //     }),
    //   });
    //   companyConnectionModel.find.mockReturnValueOnce({
    //     lean: jest.fn().mockResolvedValueOnce([]),
    //   });
    //   const result = await service.getSuggestedCompanies(
    //     userId,
    //     companyId,
    //     page,
    //     limit,
    //   );
    //   expect(result).toHaveLength(1);
    //   expect(result[0].companyId.toString()).toBe(
    //     mockCompanies[1]._id.toString(),
    //   );
    //   expect(result[0].industry).toBe(mockCompanies[1].industry);
    //   expect(result[0].isFollowing).toBe(false);
    // });
    it('should return suggested companies based on industry and size (from companyId1)', async () => {
      const userId = mockProfiles[0]._id.toString();
      const companyId = mockCompanies[0]._id.toString();
      const page = 1;
      const limit = 5;
      companyModel.findById.mockReturnValueOnce({
        select: jest.fn().mockReturnValueOnce({
          lean: jest.fn().mockResolvedValueOnce({
            industry: mockCompanies[0].industry,
            company_size: mockCompanies[0].company_size,
          }),
        }),
      });
      const suggestedCompanies = [mockCompanies[1]];
      companyModel.find.mockReturnValueOnce({
        select: jest.fn().mockReturnValueOnce({
          sort: jest.fn().mockReturnValueOnce({
            skip: jest.fn().mockReturnValueOnce({
              limit: jest.fn().mockReturnValueOnce({
                lean: jest.fn().mockResolvedValueOnce(suggestedCompanies),
              }),
            }),
          }),
        }),
      });
      companyConnectionModel.find.mockReturnValueOnce({
        lean: jest.fn().mockResolvedValueOnce([
          {
            user_id: new Types.ObjectId(userId),
            company_id: mockCompanies[1]._id,
          },
        ]),
      });
      const result = await service.getSuggestedCompanies(
        userId,
        companyId,
        page,
        limit,
      );
      expect(result).toHaveLength(1);
      expect(result[0].companyId.toString()).toBe(
        mockCompanies[1]._id.toString(),
      );
      expect(result[0].industry).toBe(mockCompanies[1].industry);
      expect(result[0].isFollowing).toBe(true);
    });

    it('should throw NotFoundException if the company does not exist', async () => {
      const userId = mockProfiles[0]._id.toString();
      const invalidCompanyId = new Types.ObjectId().toString();
      const page = 1;
      const limit = 5;
      companyModel.findById.mockReturnValueOnce({
        select: jest.fn().mockReturnValueOnce({
          lean: jest.fn().mockResolvedValueOnce(null),
        }),
      });
      await service.getSuggestedCompanies(
        userId,
        invalidCompanyId,
        page,
        limit,
      );
      expect(handleError).toHaveBeenCalledWith(
        new NotFoundException('Company not found'),
        'Failed to retrieve list of related companies.',
      );
    });
  });

  describe('getCommonFollowers', () => {
    it('should throw NotFoundException if the company does not exist', async () => {
      const userId = mockProfiles[0]._id.toString();
      const invalidCompanyId = new Types.ObjectId().toString();
      companyModel.findById.mockReturnValueOnce({
        lean: jest.fn().mockResolvedValueOnce(null),
      });
      await service.getCommonFollowers(userId, invalidCompanyId);
      expect(handleError).toHaveBeenCalledWith(
        new NotFoundException('Company not found'),
        'Failed to retrieve list of common followers.',
      );
    });

    it('should correctly map sending and receiving parties and return common followers', async () => {
      const userId = mockProfiles[0]._id.toString();
      const companyId = mockCompanies[0]._id.toString();
      companyModel.findById.mockReturnValueOnce({
        lean: jest.fn().mockResolvedValueOnce(mockCompanies[0]),
      });
      userConnectionModel.find.mockReturnValueOnce({
        select: jest.fn().mockReturnValueOnce({
          lean: jest
            .fn()
            .mockResolvedValueOnce([
              mockUserConnections[0],
              mockUserConnections[1],
            ]),
        }),
      });
      companyConnectionModel.find.mockReturnValueOnce({
        sort: jest.fn().mockReturnValueOnce({
          select: jest.fn().mockReturnValueOnce({
            lean: jest
              .fn()
              .mockResolvedValueOnce([
                { user_id: mockProfiles[1]._id },
                { user_id: mockProfiles[2]._id },
              ]),
          }),
        }),
      });
      profileModel.find.mockReturnValueOnce({
        select: jest.fn().mockReturnValueOnce({
          lean: jest
            .fn()
            .mockResolvedValueOnce([mockProfiles[1], mockProfiles[2]]),
        }),
      });
      const result = await service.getCommonFollowers(userId, companyId);
      expect(result).toHaveLength(2);
      expect(result.map((p) => p.userId.toString())).toEqual(
        expect.arrayContaining([
          mockProfiles[1]._id.toString(),
          mockProfiles[2]._id.toString(),
        ]),
      );
      expect(companyModel.findById).toHaveBeenCalledWith(
        new Types.ObjectId(companyId),
      );
      expect(userConnectionModel.find).toHaveBeenCalledWith({
        $or: [
          {
            sending_party: new Types.ObjectId(userId),
            status: ConnectionStatus.Connected,
          },
          {
            receiving_party: new Types.ObjectId(userId),
            status: ConnectionStatus.Connected,
          },
        ],
      });
      expect(companyConnectionModel.find).toHaveBeenCalled();
      expect(profileModel.find).toHaveBeenCalled();
    });

    // it('should return profileId2 as a common follower of profileId1 and companyId1', async () => {
    //   const userId = mockProfiles[0]._id.toString();
    //   const companyId = mockCompanies[0]._id.toString();
    //   companyModel.findById.mockReturnValueOnce({
    //     lean: jest.fn().mockResolvedValueOnce(mockCompanies[0]),
    //   });
    //   userConnectionModel.find.mockReturnValueOnce({
    //     select: jest.fn().mockReturnValueOnce({
    //       lean: jest.fn().mockResolvedValueOnce([
    //         {
    //           sending_party: mockProfiles[0]._id,
    //           receiving_party: mockProfiles[1]._id,
    //           status: ConnectionStatus.Connected,
    //         },
    //       ]),
    //     }),
    //   });
    //   companyConnectionModel.find.mockReturnValueOnce({
    //     sort: jest.fn().mockReturnValueOnce({
    //       select: jest.fn().mockReturnValueOnce({
    //         lean: jest
    //           .fn()
    //           .mockResolvedValueOnce([{ user_id: mockProfiles[1]._id }]),
    //       }),
    //     }),
    //   });
    //   profileModel.find.mockReturnValueOnce({
    //     select: jest.fn().mockReturnValueOnce({
    //       lean: jest.fn().mockResolvedValueOnce([mockProfiles[1]]),
    //     }),
    //   });
    //   const result = await service.getCommonFollowers(userId, companyId);
    //   expect(result).toBeDefined();
    //   expect(result).toHaveLength(1);
    //   expect(result[0].userId.toString()).toBe(mockProfiles[1]._id.toString());
    // });
  });

  describe('getFollowedCompanies', () => {
    it('should throw BadRequestException if profile ID is invalid', async () => {
      const invalidProfileId = 'invalid_id';
      await service.getFollowedCompanies(invalidProfileId, 1, 10);
      expect(handleError).toHaveBeenCalledWith(
        new BadRequestException('Invalid profile ID format'),
        'Failed to retrieve list of followed companies.',
      );
    });

    it('should return companyId1 and companyId3 as followed companies for profileId1', async () => {
      const profileId = mockProfiles[0]._id.toString();
      const page = 1;
      const limit = 10;
      const matchedConnections = mockCompanyConnections.filter(
        (c) => c.user_id.toString() === profileId,
      );
      const matchedCompanyIds = matchedConnections.map((c) => c.company_id);
      companyConnectionModel.find.mockReturnValueOnce({
        sort: jest.fn().mockReturnValueOnce({
          select: jest.fn().mockReturnValueOnce({
            lean: jest
              .fn()
              .mockResolvedValueOnce(
                matchedConnections.map((c) => ({ company_id: c.company_id })),
              ),
          }),
        }),
      });
      companyModel.find.mockReturnValueOnce({
        select: jest.fn().mockReturnValueOnce({
          sort: jest.fn().mockReturnValueOnce({
            skip: jest.fn().mockReturnValueOnce({
              limit: jest.fn().mockReturnValueOnce({
                lean: jest
                  .fn()
                  .mockResolvedValueOnce(
                    mockCompanies.filter((c) =>
                      matchedCompanyIds.some(
                        (id) => id.toString() === c._id.toString(),
                      ),
                    ),
                  ),
              }),
            }),
          }),
        }),
      });
      const result = await service.getFollowedCompanies(profileId, page, limit);
      expect(result).toHaveLength(2);
      expect(result.map((c) => c.companyId.toString())).toEqual(
        expect.arrayContaining([
          mockCompanies[0]._id.toString(),
          mockCompanies[2]._id.toString(),
        ]),
      );
    });
  });

  describe('getManagedCompanies', () => {
    it('should return companyId1 and companyId2 as managed companies for profileId1', async () => {
      const profileId = mockProfiles[0]._id.toString();
      const matchedManagers = mockCompanyManagers.filter(
        (m) => m.manager_id.toString() === profileId,
      );
      const managedCompanyIds = matchedManagers.map((m) => ({
        company_id: m.company_id,
      }));
      companyManagerModel.find.mockReturnValueOnce({
        select: jest.fn().mockReturnValueOnce({
          lean: jest.fn().mockResolvedValueOnce(managedCompanyIds),
        }),
      });
      const expectedCompanies = mockCompanies.filter((c) =>
        managedCompanyIds.some(
          (m) => m.company_id.toString() === c._id.toString(),
        ),
      );
      companyModel.find.mockReturnValueOnce({
        select: jest.fn().mockReturnValueOnce({
          lean: jest.fn().mockResolvedValueOnce(expectedCompanies),
        }),
      });
      const result = await service.getManagedCompanies(profileId);
      expect(result).toHaveLength(expectedCompanies.length);
      expect(result.map((c) => c.companyId.toString())).toEqual(
        expect.arrayContaining([
          mockCompanies[0]._id.toString(),
          mockCompanies[1]._id.toString(),
        ]),
      );
    });

    it('should catch and handle unexpected errors during getManagedCompanies', async () => {
      const userId = mockProfiles[0]._id.toString();
      companyManagerModel.find.mockImplementationOnce(() => {
        throw new Error('Unexpected Error');
      });
      await service.getManagedCompanies(userId);
      expect(handleError).toHaveBeenCalledWith(
        new Error('Unexpected Error'),
        'Failed to retrieve list of managed companies.',
      );
    });
  });

  describe('getCompanyJobs', () => {
    it('should throw NotFoundException if the company does not exist', async () => {
      const invalidCompanyId = new Types.ObjectId().toString();
      companyModel.findById.mockReturnValueOnce({
        lean: jest.fn().mockResolvedValueOnce(null),
      });
      await service.getCompanyJobs(
        invalidCompanyId,
        mockProfiles[0]._id.toString(),
        1,
        10,
      );
      expect(handleError).toHaveBeenCalledWith(
        new NotFoundException('Company not found.'),
        'Failed to retrieve company jobs.',
      );
    });

    it('should return jobs with correct isSaved and status for companyId1 and userId1', async () => {
      const companyId = mockCompanies[0]._id.toString();
      const userId = mockProfiles[0]._id.toString();
      const page = 1;
      const limit = 10;
      companyModel.findById.mockReturnValueOnce({
        lean: jest.fn().mockResolvedValueOnce(mockCompanies[0]),
      });
      const expectedJobs = mockJobs
        .filter((job) => job.company_id.toString() === companyId)
        .map((job) => ({
          ...job,
          saved_by: [new Types.ObjectId(userId)],
        }));
      jobModel.find.mockReturnValueOnce({
        sort: jest.fn().mockReturnValueOnce({
          skip: jest.fn().mockReturnValueOnce({
            limit: jest.fn().mockReturnValueOnce({
              lean: jest.fn().mockResolvedValueOnce(expectedJobs),
            }),
          }),
        }),
      });
      const applications = expectedJobs.map((job) => ({
        job_id: job._id,
        user_id: new Types.ObjectId(userId),
        status: ApplicationStatus.Accepted,
      }));
      applicationModel.find.mockReturnValueOnce({
        lean: jest.fn().mockResolvedValueOnce(applications),
      });
      const result = await service.getCompanyJobs(
        companyId,
        userId,
        page,
        limit,
      );
      expect(result).toHaveLength(expectedJobs.length);
      result.forEach((jobDto) => {
        expect(jobDto.isSaved).toBe(true);
        expect(jobDto.status).toBe(ApplicationStatus.Accepted);
        expect(jobDto.companyName).toBe(mockCompanies[0].name);
        expect(jobDto.companyLogo).toBe(mockCompanies[0].logo);
        expect(jobDto.companyLocation).toBe(mockCompanies[0].address);
        expect(jobDto.companyDescription).toBe(mockCompanies[0].description);
      });
      expect(companyModel.findById).toHaveBeenCalledWith(
        new Types.ObjectId(companyId),
      );
      expect(jobModel.find).toHaveBeenCalled();
      expect(applicationModel.find).toHaveBeenCalled();
    });

    //   it('should return jobs "Designer" and "Engineer" for companyId1', async () => {
    //     const companyId = mockCompanies[0]._id.toString();
    //     const userId = mockProfiles[0]._id.toString();
    //     const page = 1;
    //     const limit = 10;
    //     companyModel.findById.mockReturnValueOnce({
    //       lean: jest.fn().mockResolvedValueOnce(mockCompanies[0]),
    //     });
    //     const expectedJobs = mockJobs
    //       .filter((job) => job.company_id.toString() === companyId)
    //       .map((job) => ({
    //         ...job,
    //         saved_by: [new Types.ObjectId(userId)],
    //       }));
    //     jobModel.find.mockReturnValueOnce({
    //       sort: jest.fn().mockReturnValueOnce({
    //         skip: jest.fn().mockReturnValueOnce({
    //           limit: jest.fn().mockReturnValueOnce({
    //             lean: jest.fn().mockResolvedValueOnce(expectedJobs),
    //           }),
    //         }),
    //       }),
    //     });
    //     const applications = expectedJobs.map((job) => ({
    //       job_id: job._id,
    //       status: ApplicationStatus.Accepted,
    //     }));

    //     applicationModel.find.mockReturnValueOnce({
    //       lean: jest.fn().mockResolvedValueOnce(applications),
    //     });

    //     const result = await service.getCompanyJobs(
    //       companyId,
    //       userId,
    //       page,
    //       limit,
    //     );

    //     expect(result).toHaveLength(2);
    //     expect(result.map((j) => j.position)).toEqual(
    //       expect.arrayContaining(['Designer', 'Engineer']),
    //     );
    //     result.forEach((jobDto) => {
    //       expect(jobDto.isSaved).toBe(true);
    //       expect(jobDto.status).toBe(ApplicationStatus.Accepted);
    //     });
    //   });
    // });

    // it('should return jobs "Designer" and "Engineer" for companyId1', async () => {
    //   const companyId = mockCompanies[0]._id.toString();
    //   const page = 1;
    //   const limit = 10;
    //   companyModel.findById.mockReturnValueOnce({
    //     lean: jest.fn().mockResolvedValueOnce(mockCompanies[0]),
    //   });
    //   const expectedJobs = mockJobs.filter(
    //     (job) => job.company_id.toString() === companyId,
    //   );
    //   jobModel.find.mockReturnValueOnce({
    //     sort: jest.fn().mockReturnValueOnce({
    //       skip: jest.fn().mockReturnValueOnce({
    //         limit: jest.fn().mockReturnValueOnce({
    //           lean: jest.fn().mockResolvedValueOnce(expectedJobs),
    //         }),
    //       }),
    //     }),
    //   });
    //   applicationModel.find.mockReturnValueOnce({
    //     lean: jest.fn().mockResolvedValueOnce([]),
    //   });
    //   const result = await service.getCompanyJobs(
    //     companyId,
    //     mockProfiles[0]._id.toString(),
    //     page,
    //     limit,
    //   );
    //   expect(result).toHaveLength(2);
    //   expect(result.map((j) => j.position)).toEqual(
    //     expect.arrayContaining(['Designer', 'Engineer']),
    //   );
    // });
  });

  describe('addCompanyManager', () => {
    it('should successfully add manager access to a user (profileId4 → companyId1 by profileId1)', async () => {
      const userId = mockProfiles[0]._id.toString();
      const companyId = mockCompanies[0]._id.toString();
      const addAccessDto = {
        newUserId: mockProfiles[3]._id.toString(),
      };
      companyModel.findById.mockReturnValueOnce({
        lean: jest.fn().mockResolvedValueOnce(mockCompanies[0]),
      });
      userModel.findById.mockReturnValueOnce({
        lean: jest.fn().mockResolvedValueOnce(mockUsers[3]),
      });
      companyManagerModel.findOne
        .mockReturnValueOnce({
          lean: jest.fn().mockResolvedValueOnce(mockCompanyManagers[0]),
        })
        .mockReturnValueOnce({
          lean: jest.fn().mockResolvedValueOnce(null),
        });
      const saveMock = jest.fn().mockResolvedValueOnce({});
      const constructorMock = jest.fn().mockReturnValue({ save: saveMock });
      (service as any).companyManagerModel = Object.assign(constructorMock, {
        findOne: companyManagerModel.findOne,
      });
      userModel.findByIdAndUpdate.mockResolvedValueOnce({});
      companyEmployerModel.findOneAndDelete = jest
        .fn()
        .mockResolvedValueOnce({});
      await expect(
        service.addCompanyManager(userId, companyId, addAccessDto),
      ).resolves.not.toThrow();
      expect(companyModel.findById).toHaveBeenCalledWith(
        new Types.ObjectId(companyId),
      );
      expect(userModel.findById).toHaveBeenCalledWith(
        new Types.ObjectId(addAccessDto.newUserId),
      );
      expect(constructorMock).toHaveBeenCalledWith({
        _id: expect.any(Types.ObjectId),
        manager_id: new Types.ObjectId(addAccessDto.newUserId),
        company_id: new Types.ObjectId(companyId),
      });
      expect(saveMock).toHaveBeenCalled();
      expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
        new Types.ObjectId(addAccessDto.newUserId),
        { $set: { role: 'manager' } },
        { upsert: false },
      );
      expect(companyEmployerModel.findOneAndDelete).toHaveBeenCalledWith({
        employer_id: new Types.ObjectId(addAccessDto.newUserId),
        company_id: new Types.ObjectId(companyId),
      });
    });

    it('should throw NotFoundException if the company does not exist', async () => {
      const userId = mockProfiles[0]._id.toString();
      const companyId = new Types.ObjectId().toString();
      const addAccessDto = { newUserId: mockProfiles[1]._id.toString() };
      companyModel.findById.mockReturnValueOnce({
        lean: jest.fn().mockResolvedValueOnce(null),
      });
      await service.addCompanyManager(userId, companyId, addAccessDto);
      expect(handleError).toHaveBeenCalledWith(
        new NotFoundException('Company not found.'),
        'Failed to provide company management access to user.',
      );
    });

    it('should throw NotFoundException if the user does not exist', async () => {
      const userId = mockProfiles[0]._id.toString();
      const companyId = mockCompanies[0]._id.toString();
      const addAccessDto = { newUserId: new Types.ObjectId().toString() };
      companyModel.findById.mockReturnValueOnce({
        lean: jest.fn().mockResolvedValueOnce(mockCompanies[0]),
      });
      userModel.findById.mockReturnValueOnce({
        lean: jest.fn().mockResolvedValueOnce(null),
      });
      await service.addCompanyManager(userId, companyId, addAccessDto);
      expect(handleError).toHaveBeenCalledWith(
        new NotFoundException('User not found.'),
        'Failed to provide company management access to user.',
      );
    });

    it('should throw ForbiddenException if logged-in user is not a manager of the company', async () => {
      const userId = mockProfiles[1]._id.toString();
      const companyId = mockCompanies[0]._id.toString();
      const addAccessDto = { newUserId: mockProfiles[2]._id.toString() };
      companyModel.findById.mockReturnValueOnce({
        lean: jest.fn().mockResolvedValueOnce(mockCompanies[0]),
      });
      userModel.findById.mockReturnValueOnce({
        lean: jest.fn().mockResolvedValueOnce(mockUsers[2]),
      });
      companyManagerModel.findOne.mockReturnValueOnce({
        lean: jest.fn().mockResolvedValueOnce(null),
      });
      await service.addCompanyManager(userId, companyId, addAccessDto);
      expect(handleError).toHaveBeenCalledWith(
        new ForbiddenException(
          'Logged in user does not have management access to this company.',
        ),
        'Failed to provide company management access to user.',
      );
    });

    it('should throw ConflictException if the new user is already a manager of the company', async () => {
      const userId = mockProfiles[0]._id.toString();
      const companyId = mockCompanies[0]._id.toString();
      const addAccessDto = { newUserId: mockProfiles[0]._id.toString() };
      companyModel.findById.mockReturnValueOnce({
        lean: jest.fn().mockResolvedValueOnce(mockCompanies[0]),
      });
      userModel.findById.mockReturnValueOnce({
        lean: jest.fn().mockResolvedValueOnce(mockUsers[0]),
      });
      companyManagerModel.findOne
        .mockReturnValueOnce({
          lean: jest.fn().mockResolvedValueOnce(mockCompanyManagers[0]),
        })
        .mockReturnValueOnce({
          lean: jest.fn().mockResolvedValueOnce(mockCompanyManagers[0]),
        });
      await service.addCompanyManager(userId, companyId, addAccessDto);
      expect(handleError).toHaveBeenCalledWith(
        new ConflictException(
          'User already has management access to this company.',
        ),
        'Failed to provide company management access to user.',
      );
    });
  });

  describe('addCompanyEmployer', () => {
    it('should successfully add employer access to a user (profileId4 → companyId1 by profileId1)', async () => {
      const userId = mockProfiles[0]._id.toString();
      const companyId = mockCompanies[0]._id.toString();
      const addAccessDto = {
        newUserId: mockProfiles[3]._id.toString(),
      };
      companyModel.findById.mockReturnValueOnce({
        lean: jest.fn().mockResolvedValueOnce(mockCompanies[0]),
      });
      userModel.findById.mockReturnValueOnce({
        lean: jest.fn().mockResolvedValueOnce(mockUsers[3]),
      });
      companyManagerModel.findOne
        .mockReturnValueOnce({
          lean: jest.fn().mockResolvedValueOnce(mockCompanyManagers[0]),
        })
        .mockReturnValueOnce({
          lean: jest.fn().mockResolvedValueOnce(null),
        });
      companyEmployerModel.findOne.mockReturnValueOnce({
        lean: jest.fn().mockResolvedValueOnce(null),
      });
      const saveMock = jest.fn().mockResolvedValueOnce({});
      const constructorMock = jest.fn().mockReturnValue({ save: saveMock });
      (service as any).companyEmployerModel = Object.assign(constructorMock, {
        findOne: companyEmployerModel.findOne,
      });
      userModel.findByIdAndUpdate.mockResolvedValueOnce({});
      await expect(
        service.addCompanyEmployer(userId, companyId, addAccessDto),
      ).resolves.not.toThrow();
      expect(companyModel.findById).toHaveBeenCalledWith(
        new Types.ObjectId(companyId),
      );
      expect(userModel.findById).toHaveBeenCalledWith(
        new Types.ObjectId(addAccessDto.newUserId),
      );
      expect(constructorMock).toHaveBeenCalledWith({
        _id: expect.any(Types.ObjectId),
        employer_id: new Types.ObjectId(addAccessDto.newUserId),
        company_id: new Types.ObjectId(companyId),
      });
      expect(saveMock).toHaveBeenCalled();
      expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
        new Types.ObjectId(addAccessDto.newUserId),
        { $set: { role: 'employer' } },
        { upsert: false },
      );
    });

    it('should throw NotFoundException if the company does not exist', async () => {
      const userId = mockProfiles[0]._id.toString();
      const companyId = new Types.ObjectId().toString();
      const addAccessDto = { newUserId: mockProfiles[1]._id.toString() };

      companyModel.findById.mockReturnValueOnce({
        lean: jest.fn().mockResolvedValueOnce(null),
      });

      await service.addCompanyEmployer(userId, companyId, addAccessDto);

      expect(handleError).toHaveBeenCalledWith(
        new NotFoundException('Company not found.'),
        'Failed to provide company employer access to user.',
      );
    });

    it('should throw NotFoundException if the user does not exist', async () => {
      const userId = mockProfiles[0]._id.toString();
      const companyId = mockCompanies[0]._id.toString();
      const addAccessDto = { newUserId: new Types.ObjectId().toString() };

      companyModel.findById.mockReturnValueOnce({
        lean: jest.fn().mockResolvedValueOnce(mockCompanies[0]),
      });

      userModel.findById.mockReturnValueOnce({
        lean: jest.fn().mockResolvedValueOnce(null),
      });

      await service.addCompanyEmployer(userId, companyId, addAccessDto);

      expect(handleError).toHaveBeenCalledWith(
        new NotFoundException('User not found.'),
        'Failed to provide company employer access to user.',
      );
    });

    it('should throw ForbiddenException if logged-in user is not a manager of the company (profileId2 → companyId1)', async () => {
      const userId = mockProfiles[1]._id.toString();
      const companyId = mockCompanies[0]._id.toString();
      const addAccessDto = { newUserId: mockProfiles[4]._id.toString() };
      companyModel.findById.mockReturnValueOnce({
        lean: jest.fn().mockResolvedValueOnce(mockCompanies[0]),
      });
      userModel.findById.mockReturnValueOnce({
        lean: jest.fn().mockResolvedValueOnce(mockUsers[4]),
      });
      companyManagerModel.findOne.mockReturnValueOnce({
        lean: jest.fn().mockResolvedValueOnce(null),
      });
      await service.addCompanyEmployer(userId, companyId, addAccessDto);
      expect(handleError).toHaveBeenCalledWith(
        new ForbiddenException(
          'Logged in user does not have management access to this company.',
        ),
        'Failed to provide company employer access to user.',
      );
    });

    it('should throw ConflictException if the new user is already a manager of the company (profileId1 → companyId1)', async () => {
      const userId = mockProfiles[0]._id.toString();
      const companyId = mockCompanies[0]._id.toString();
      const addAccessDto = { newUserId: mockProfiles[0]._id.toString() };
      companyModel.findById.mockReturnValueOnce({
        lean: jest.fn().mockResolvedValueOnce(mockCompanies[0]),
      });
      userModel.findById.mockReturnValueOnce({
        lean: jest.fn().mockResolvedValueOnce(mockUsers[0]),
      });
      companyManagerModel.findOne = jest
        .fn()
        .mockImplementationOnce(() => ({
          lean: jest.fn().mockResolvedValueOnce(mockCompanyManagers[0]),
        }))
        .mockImplementationOnce(() => ({
          lean: jest.fn().mockResolvedValueOnce(mockCompanyManagers[0]),
        }));
      companyEmployerModel.findOne = jest.fn().mockReturnValueOnce({
        lean: jest.fn().mockResolvedValueOnce(null),
      });
      await service.addCompanyEmployer(userId, companyId, addAccessDto);
      expect(handleError).toHaveBeenCalledWith(
        new ConflictException(
          'User already has management access to this company.',
        ),
        'Failed to provide company employer access to user.',
      );
    });

    it('should throw ConflictException if the new user is already an employer of the company (profileId5 → companyId3)', async () => {
      const userId = mockProfiles[1]._id.toString();
      const companyId = mockCompanies[2]._id.toString();
      const addAccessDto = { newUserId: mockProfiles[4]._id.toString() };
      companyModel.findById.mockReturnValueOnce({
        lean: jest.fn().mockResolvedValueOnce(mockCompanies[2]),
      });
      userModel.findById.mockReturnValueOnce({
        lean: jest.fn().mockResolvedValueOnce(mockUsers[4]),
      });
      companyManagerModel.findOne
        .mockReturnValueOnce({
          lean: jest.fn().mockResolvedValueOnce(mockCompanyManagers[3]),
        })
        .mockReturnValueOnce({
          lean: jest.fn().mockResolvedValueOnce(null),
        });
      companyEmployerModel.findOne.mockReturnValueOnce({
        lean: jest.fn().mockResolvedValueOnce(mockCompanyEmployers[0]),
      });
      await service.addCompanyEmployer(userId, companyId, addAccessDto);
      expect(handleError).toHaveBeenCalledWith(
        new ConflictException(
          'User already has employer access to this company.',
        ),
        'Failed to provide company employer access to user.',
      );
    });
  });

  describe('getCompanyManagers', () => {
    it('should return company managers for companyId1 when accessed by profileId1', async () => {
      const companyId = mockCompanies[0]._id.toString();
      const userId = mockProfiles[0]._id.toString();
      companyModel.findById.mockReturnValueOnce({
        lean: jest.fn().mockResolvedValueOnce(mockCompanies[0]),
      });
      jest.spyOn(service, 'checkAccess').mockResolvedValueOnce(true);
      const mockAggregationResult = [mockProfiles[0]];
      companyManagerModel.aggregate = jest
        .fn()
        .mockResolvedValueOnce(mockAggregationResult);
      const result = await service.getCompanyManagers(companyId, userId, 1, 10);
      expect(result).toHaveLength(1);
      expect(result[0].userId.toString()).toBe(mockProfiles[0]._id.toString());
    });

    it('should throw NotFoundException if the company does not exist', async () => {
      const companyId = new Types.ObjectId().toString();
      const userId = mockProfiles[0]._id.toString();
      companyModel.findById.mockReturnValueOnce({
        lean: jest.fn().mockResolvedValueOnce(null),
      });
      await service.getCompanyManagers(companyId, userId, 1, 10);
      expect(handleError).toHaveBeenCalledWith(
        new NotFoundException('Company not found.'),
        'Failed to retrieve list of managers.',
      );
    });

    it('should throw ForbiddenException if the user has no management access', async () => {
      const companyId = mockCompanies[0]._id.toString();
      const userId = mockProfiles[1]._id.toString();
      companyModel.findById.mockReturnValueOnce({
        lean: jest.fn().mockResolvedValueOnce(mockCompanies[0]),
      });
      jest.spyOn(service, 'checkAccess').mockResolvedValueOnce(false);
      await service.getCompanyManagers(companyId, userId, 1, 10);
      expect(handleError).toHaveBeenCalledWith(
        new ForbiddenException(
          'Logged in user does not have management access to this company.',
        ),
        'Failed to retrieve list of managers.',
      );
    });
  });

  describe('getCompanyEmployers', () => {
    it('should return company employers for companyId3 when accessed by profileId2', async () => {
      const companyId = mockCompanies[2]._id.toString();
      const userId = mockProfiles[1]._id.toString();
      companyModel.findById.mockReturnValueOnce({
        lean: jest.fn().mockResolvedValueOnce(mockCompanies[2]),
      });
      jest.spyOn(service, 'checkAccess').mockResolvedValueOnce(true);
      const mockAggregationResult = [mockProfiles[4]];
      companyEmployerModel.aggregate = jest
        .fn()
        .mockResolvedValueOnce(mockAggregationResult);
      const result = await service.getCompanyEmployers(
        companyId,
        userId,
        1,
        10,
      );
      expect(result).toHaveLength(1);
      expect(result[0].userId.toString()).toBe(mockProfiles[4]._id.toString());
    });

    it('should throw NotFoundException if the company does not exist', async () => {
      const companyId = new Types.ObjectId().toString();
      const userId = mockProfiles[0]._id.toString();
      companyModel.findById.mockReturnValueOnce({
        lean: jest.fn().mockResolvedValueOnce(null),
      });
      await service.getCompanyEmployers(companyId, userId, 1, 10);
      expect(handleError).toHaveBeenCalledWith(
        new NotFoundException('Company not found.'),
        'Failed to retrieve list of employers.',
      );
    });

    it('should throw ForbiddenException if the user has no management access', async () => {
      const companyId = mockCompanies[2]._id.toString();
      const userId = mockProfiles[3]._id.toString();
      companyModel.findById.mockReturnValueOnce({
        lean: jest.fn().mockResolvedValueOnce(mockCompanies[2]),
      });
      jest.spyOn(service, 'checkAccess').mockResolvedValueOnce(false);
      await service.getCompanyEmployers(companyId, userId, 1, 10);
      expect(handleError).toHaveBeenCalledWith(
        new ForbiddenException(
          'Logged in user does not have management access to this company.',
        ),
        'Failed to retrieve list of employers.',
      );
    });
  });
});
