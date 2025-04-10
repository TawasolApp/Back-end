import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import {
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
        company_size: CompanySize.Small,
        company_type: CompanyType.Government,
        industry: 'Test',
        email: 'test@gmail.com',
        website: 'www.test.com',
        contact_number: '1234',
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
          { contact_number: createDto.contact_number }, // Fixed line
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
    it('should successfully update the company name when user has access', async () => {
      const userId = mockProfiles[0]._id.toString();
      const companyId = mockCompanies[0]._id.toString();

      const updateDto = {
        name: 'Updated Company Name',
        email: 'test@gmail.com',
        website: 'www.test.com',
        contact_number: '1234', // Fixed key: use snake_case to match schema
      };

      companyModel.findById.mockReturnValueOnce({
        lean: jest.fn().mockResolvedValueOnce(mockCompanies[0]),
      });

      jest.spyOn(service, 'checkAccess').mockResolvedValueOnce(true);

      companyModel.findOne.mockResolvedValueOnce(null);

      companyModel.findByIdAndUpdate.mockResolvedValueOnce({
        ...mockCompanies[0],
        ...updateDto,
      });

      const result = await service.updateCompany(userId, companyId, updateDto);

      expect(result.name).toBe(updateDto.name);
      expect(companyModel.findByIdAndUpdate).toHaveBeenCalledWith(
        new Types.ObjectId(companyId),
        { $set: updateDto },
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

    it('should catch and handle unexpected errors during getCompanyDetails', async () => {
      const userId = mockProfiles[0]._id.toString();
      const companyId = mockCompanies[0]._id.toString();

      companyModel.findById.mockImplementationOnce(() => {
        throw new Error('Unexpected error');
      });

      await service.getCompanyDetails(userId, companyId);

      expect(handleError).toHaveBeenCalledWith(
        new Error('Unexpected error'),
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
        throw new Error('Unexpected error');
      });

      await service.filterCompanies(userId, page, limit);

      expect(handleError).toHaveBeenCalledWith(
        new Error('Unexpected error'),
        'Failed to retrieve list of companies.',
      );
    });
  });

  // it('should create a new company successfully', async () => {
  //   const createCompanyDto: Partial<CreateCompanyDto> = {
  //     name: 'New Unique Company',
  //     website: 'https://newcompany.com',
  //     email: 'info@newcompany.com',
  //     contactNumber: '1234567890',
  //     industry: 'AI',
  //     companySize: CompanySize.Small,
  //     companyType: CompanyType.Private,
  //   };

  //   companyModel.findOne.mockReturnValueOnce({
  //     lean: jest.fn().mockResolvedValueOnce(null),
  //   });

  //   await expect(
  //     service.createCompany(createCompanyDto),
  //   ).resolves.not.toThrow();

  //   expect(mockSave).toHaveBeenCalled();
  // });

  // it('should throw ConflictException if company with same name exists', async () => {
  //   const createCompanyDto: Partial<CreateCompanyDto> = {
  //     name: mockCompanies[0].name,
  //     website: 'https://conflict.com',
  //     email: 'conflict@example.com',
  //     contactNumber: '0000000000',
  //   };

  //   companyModel.findOne.mockReturnValueOnce({
  //     lean: jest.fn().mockResolvedValueOnce(mockCompanies[0]),
  //   });

  //   await expect(service.createCompany(createCompanyDto)).rejects.toThrow(
  //     ConflictException,
  //   );
  // });

  // it('should successfully update the "founded" field of an existing company', async () => {
  //   const companyId = mockCompanies[0]._id.toString();
  //   const updateDto: Partial<UpdateCompanyDto> = { founded: 2000 };

  //   companyModel.findById.mockReturnValueOnce({
  //     lean: jest.fn().mockResolvedValueOnce(mockCompanies[0]),
  //   });

  //   companyModel.findOne.mockReturnValueOnce({
  //     lean: jest.fn().mockResolvedValueOnce(null), // no duplicates
  //   });

  //   const updated = {
  //     ...mockCompanies[0],
  //     founded: 2000,
  //   };
  //   companyModel.findByIdAndUpdate.mockResolvedValueOnce(updated);

  //   const result = await service.updateCompany(companyId, updateDto);

  //   expect(result.founded).toBe(2000);
  //   expect(companyModel.findByIdAndUpdate).toHaveBeenCalledWith(
  //     expect.any(Types.ObjectId),
  //     { $set: { founded: 2000 } },
  //     { new: true },
  //   );
  // });

  // it('should throw ConflictException if email already exists', async () => {
  //   const companyId = mockCompanies[1]._id.toString();
  //   const updateDto: Partial<UpdateCompanyDto> = {
  //     email: mockCompanies[0].email,
  //   };

  //   companyModel.findById.mockReturnValueOnce({
  //     lean: jest.fn().mockResolvedValueOnce(mockCompanies[1]),
  //   });

  //   companyModel.findOne.mockReturnValueOnce({
  //     lean: jest.fn().mockResolvedValueOnce(mockCompanies[0]),
  //   });

  //   await expect(service.updateCompany(companyId, updateDto)).rejects.toThrow(
  //     ConflictException,
  //   );
  // });

  // it('should throw NotFoundException if company ID does not exist', async () => {
  //   const invalidId = new Types.ObjectId().toString();
  //   const updateDto: Partial<UpdateCompanyDto> = { name: 'Update Name' };

  //   companyModel.findById.mockReturnValueOnce({
  //     lean: jest.fn().mockResolvedValueOnce(null),
  //   });

  //   await expect(service.updateCompany(invalidId, updateDto)).rejects.toThrow(
  //     NotFoundException,
  //   );
  // });

  // it('should delete an existing company and its connections', async () => {
  //   const companyId = mockCompanies[0]._id.toString();

  //   companyModel.findById.mockReturnValueOnce({
  //     lean: jest.fn().mockResolvedValueOnce(mockCompanies[0]),
  //   });

  //   companyModel.findByIdAndDelete.mockReturnValueOnce({
  //     lean: jest.fn().mockResolvedValueOnce(mockCompanies[0]),
  //   });

  //   const deleteManyMock = jest.fn().mockResolvedValueOnce({ deletedCount: 2 });
  //   companyConnectionModel.deleteMany = deleteManyMock;

  //   await expect(service.deleteCompany(companyId)).resolves.toBeUndefined();

  //   expect(companyModel.findByIdAndDelete).toHaveBeenCalledWith(
  //     new Types.ObjectId(companyId),
  //   );
  //   expect(deleteManyMock).toHaveBeenCalledWith({
  //     company_id: new Types.ObjectId(companyId),
  //   });
  // });

  // it('should throw NotFoundException if company ID is invalid', async () => {
  //   const fakeId = new Types.ObjectId().toString();

  //   companyModel.findById.mockReturnValueOnce({
  //     lean: jest.fn().mockResolvedValueOnce(null),
  //   });

  //   await expect(service.deleteCompany(fakeId)).rejects.toThrow(
  //     NotFoundException,
  //   );
  // });

  // it('should throw NotFoundException if company is not found', async () => {
  //   const companyId = new Types.ObjectId().toString();
  //   const userId = mockProfiles[0]._id.toString();

  //   companyModel.findById.mockReturnValueOnce({
  //     lean: jest.fn().mockResolvedValueOnce(null),
  //   });

  //   await expect(service.getCompanyDetails(companyId, userId)).rejects.toThrow(
  //     NotFoundException,
  //   );
  // });

  // it('should return company details with isFollowing = false if no connection exists', async () => {
  //   const companyId = mockCompanies[1]._id.toString();
  //   const userId = mockProfiles[2]._id.toString();

  //   companyModel.findById.mockReturnValueOnce({
  //     lean: jest.fn().mockResolvedValueOnce(mockCompanies[1]),
  //   });

  //   companyConnectionModel.findOne.mockResolvedValueOnce(null);

  //   const result = await service.getCompanyDetails(companyId, userId);

  //   expect(companyConnectionModel.findOne).toHaveBeenCalledWith({
  //     user_id: expect.any(Types.ObjectId),
  //     company_id: expect.any(Types.ObjectId),
  //   });
  //   expect(result.name).toBe(mockCompanies[1].name);
  //   expect(result.isFollowing).toBe(false);
  // });

  // it('should return company details with isFollowing = true if connection exists', async () => {
  //   const companyId = mockCompanies[0]._id.toString();
  //   const userId = mockProfiles[1]._id.toString();

  //   companyModel.findById.mockReturnValueOnce({
  //     lean: jest.fn().mockResolvedValueOnce(mockCompanies[0]),
  //   });

  //   companyConnectionModel.findOne.mockResolvedValueOnce(mockConnections[2]);

  //   const result = await service.getCompanyDetails(companyId, userId);

  //   expect(companyConnectionModel.findOne).toHaveBeenCalledWith({
  //     user_id: expect.any(Types.ObjectId),
  //     company_id: expect.any(Types.ObjectId),
  //   });
  //   expect(result.name).toBe(mockCompanies[0].name);
  //   expect(result.isFollowing).toBe(true);
  // });

  // it('should return all companies when no filters are provided', async () => {
  //   companyModel.find.mockReturnValueOnce({
  //     select: jest.fn().mockReturnValueOnce({
  //       sort: jest.fn().mockReturnValueOnce({
  //         lean: jest.fn().mockResolvedValueOnce(mockCompanies),
  //       }),
  //     }),
  //   });

  //   companyConnectionModel.find = jest.fn().mockReturnValueOnce({
  //     lean: jest.fn().mockResolvedValueOnce(mockConnections),
  //   });

  //   const result = await service.filterCompanies(
  //     mockProfiles[0]._id.toString(),
  //   );

  //   expect(companyModel.find).toHaveBeenCalledWith({});
  //   expect(result).toHaveLength(5);
  // });

  // it('should return companies filtered by industry "Software"', async () => {
  //   const filtered = mockCompanies.filter((c) => c.industry === 'Software');

  //   companyModel.find.mockReturnValueOnce({
  //     select: jest.fn().mockReturnValueOnce({
  //       sort: jest.fn().mockReturnValueOnce({
  //         lean: jest.fn().mockResolvedValueOnce(filtered),
  //       }),
  //     }),
  //   });

  //   companyConnectionModel.find = jest.fn().mockReturnValueOnce({
  //     lean: jest.fn().mockResolvedValueOnce(mockConnections),
  //   });

  //   const result = await service.filterCompanies(
  //     mockProfiles[0]._id.toString(),
  //     undefined,
  //     'Software',
  //   );

  //   expect(companyModel.find).toHaveBeenCalledWith({
  //     industry: { $regex: 'Software', $options: 'i' },
  //   });
  //   expect(result).toHaveLength(2);
  // });

  // it('should return companies filtered by name "testing"', async () => {
  //   const filtered = mockCompanies.filter((c) =>
  //     c.name.toLowerCase().includes('testing'),
  //   );

  //   companyModel.find.mockReturnValueOnce({
  //     select: jest.fn().mockReturnValueOnce({
  //       sort: jest.fn().mockReturnValueOnce({
  //         lean: jest.fn().mockResolvedValueOnce(filtered),
  //       }),
  //     }),
  //   });

  //   companyConnectionModel.find = jest.fn().mockReturnValueOnce({
  //     lean: jest.fn().mockResolvedValueOnce(mockConnections),
  //   });

  //   const result = await service.filterCompanies(
  //     mockProfiles[1]._id.toString(),
  //     'testing',
  //   );

  //   expect(companyModel.find).toHaveBeenCalledWith({
  //     name: { $regex: 'testing', $options: 'i' },
  //   });
  //   expect(result).toHaveLength(3);
  // });

  // it('should return empty array if no companies match the name "hello"', async () => {
  //   companyModel.find.mockReturnValueOnce({
  //     select: jest.fn().mockReturnValueOnce({
  //       sort: jest.fn().mockReturnValueOnce({
  //         lean: jest.fn().mockResolvedValueOnce([]),
  //       }),
  //     }),
  //   });

  //   companyConnectionModel.find = jest.fn().mockReturnValueOnce({
  //     lean: jest.fn().mockResolvedValueOnce(mockConnections),
  //   });

  //   const result = await service.filterCompanies(
  //     mockProfiles[0]._id.toString(),
  //     'hello',
  //   );

  //   expect(companyModel.find).toHaveBeenCalledWith({
  //     name: { $regex: 'hello', $options: 'i' },
  //   });
  //   expect(result).toHaveLength(0);
  // });

  // it('should throw NotFoundException if company does not exist', async () => {
  //   const invalidCompanyId = new Types.ObjectId().toString();

  //   companyModel.findById.mockReturnValueOnce({
  //     lean: jest.fn().mockResolvedValueOnce(null),
  //   });

  //   await expect(service.getCompanyFollowers(invalidCompanyId)).rejects.toThrow(
  //     NotFoundException,
  //   );
  // });

  // it('should return list of followers for a company', async () => {
  //   const companyId = mockCompanies[0]._id.toString();
  //   const followers = mockConnections.filter(
  //     (conn) => conn.company_id.toString() === companyId,
  //   );

  //   companyModel.findById.mockReturnValueOnce({
  //     lean: jest.fn().mockResolvedValueOnce(mockCompanies[0]),
  //   });

  //   companyConnectionModel.find.mockReturnValueOnce({
  //     select: jest.fn().mockReturnValueOnce({
  //       lean: jest.fn().mockResolvedValueOnce(followers),
  //     }),
  //   });

  //   profileModel.findById
  //     .mockReturnValueOnce({
  //       select: jest.fn().mockReturnValueOnce({
  //         lean: jest.fn().mockResolvedValueOnce(mockProfiles[0]),
  //       }),
  //     })
  //     .mockReturnValueOnce({
  //       select: jest.fn().mockReturnValueOnce({
  //         lean: jest.fn().mockResolvedValueOnce(mockProfiles[1]),
  //       }),
  //     });

  //   const result = await service.getCompanyFollowers(companyId);

  //   expect(result).toHaveLength(2);
  //   expect(result[0].userId.toString()).toBe(mockProfiles[0]._id.toString());
  //   expect(result[1].userId.toString()).toBe(mockProfiles[1]._id.toString());
  // });

  // it('should return an empty list if company has no followers', async () => {
  //   const companyId = mockCompanies[4]._id.toString();

  //   companyModel.findById.mockReturnValueOnce({
  //     lean: jest.fn().mockResolvedValueOnce(mockCompanies[4]),
  //   });

  //   companyConnectionModel.find.mockReturnValueOnce({
  //     select: jest.fn().mockReturnValueOnce({
  //       lean: jest.fn().mockResolvedValueOnce([]),
  //     }),
  //   });

  //   const result = await service.getCompanyFollowers(companyId);

  //   expect(result).toEqual([]);
  // });

  // it('should return the followed companies of a user', async () => {
  //   const userId = mockProfiles[0]._id.toString();
  //   const connections = mockConnections.filter(
  //     (conn) => conn.user_id.toString() === userId,
  //   );

  //   const expectedCompanies = [mockCompanies[0], mockCompanies[2]];

  //   companyConnectionModel.find.mockReturnValueOnce({
  //     select: jest.fn().mockReturnValueOnce({
  //       lean: jest.fn().mockResolvedValueOnce(connections),
  //     }),
  //   });

  //   companyModel.find.mockReturnValueOnce({
  //     select: jest.fn().mockReturnValueOnce({
  //       sort: jest.fn().mockReturnValueOnce({
  //         lean: jest.fn().mockResolvedValueOnce(expectedCompanies),
  //       }),
  //     }),
  //   });

  //   const result = await service.getFollowedCompanies(userId);

  //   expect(result).toHaveLength(2);
  //   expect(result.map((c) => c.companyId.toString())).toEqual(
  //     expectedCompanies.map((c) => c._id.toString()),
  //   );
  // });

  // it('should return an empty list if user follows no companies', async () => {
  //   const newUserId = new Types.ObjectId().toString();

  //   companyConnectionModel.find.mockReturnValueOnce({
  //     select: jest.fn().mockReturnValueOnce({
  //       lean: jest.fn().mockResolvedValueOnce([]),
  //     }),
  //   });

  //   companyModel.find.mockReturnValueOnce({
  //     select: jest.fn().mockReturnValueOnce({
  //       sort: jest.fn().mockReturnValueOnce({
  //         lean: jest.fn().mockResolvedValueOnce([]),
  //       }),
  //     }),
  //   });

  //   const result = await service.getFollowedCompanies(newUserId);

  //   expect(result).toEqual([]);
  // });

  // it('should successfully follow a company', async () => {
  //   const userId = mockProfiles[0]._id.toString();
  //   const companyId = mockCompanies[3]._id.toString();

  //   companyModel.findById.mockReturnValueOnce({
  //     lean: jest.fn().mockResolvedValueOnce(mockCompanies[3]),
  //   });

  //   const mockFindOne = jest.fn().mockReturnValueOnce({
  //     lean: jest.fn().mockResolvedValueOnce(null),
  //   });

  //   const mockSave = jest.fn();

  //   const MockCompanyConnection: any = function () {
  //     return { save: mockSave };
  //   };
  //   MockCompanyConnection.findOne = mockFindOne;

  //   (service as any).companyConnectionModel = MockCompanyConnection;

  //   companyModel.findByIdAndUpdate.mockResolvedValueOnce({});

  //   await expect(
  //     service.followCompany(userId, companyId),
  //   ).resolves.not.toThrow();

  //   expect(mockSave).toHaveBeenCalled();
  //   expect(mockFindOne).toHaveBeenCalled();
  //   expect(companyModel.findByIdAndUpdate).toHaveBeenCalledWith(
  //     new Types.ObjectId(companyId),
  //     { $inc: { followers: 1 } },
  //     { new: true },
  //   );
  // });

  // it('should throw ConflictException if user already follows the company', async () => {
  //   const userId = mockProfiles[1]._id.toString();
  //   const companyId = mockCompanies[0]._id.toString();

  //   companyModel.findById.mockReturnValueOnce({
  //     lean: jest.fn().mockResolvedValueOnce(mockCompanies[0]),
  //   });

  //   const mockFindOne = jest.fn().mockReturnValueOnce({
  //     lean: jest.fn().mockResolvedValueOnce(mockConnections[0]),
  //   });

  //   const MockCompanyConnection: any = function () {};
  //   MockCompanyConnection.findOne = mockFindOne;

  //   (service as any).companyConnectionModel = MockCompanyConnection;

  //   await expect(service.followCompany(userId, companyId)).rejects.toThrow(
  //     ConflictException,
  //   );

  //   expect(mockFindOne).toHaveBeenCalledWith({
  //     user_id: new Types.ObjectId(userId),
  //     company_id: new Types.ObjectId(companyId),
  //   });
  // });

  // it('should throw NotFoundException if company does not exist', async () => {
  //   const userId = mockProfiles[0]._id.toString();
  //   const invalidCompanyId = new Types.ObjectId().toString();

  //   companyModel.findById.mockReturnValueOnce({
  //     lean: jest.fn().mockResolvedValueOnce(null),
  //   });

  //   await expect(
  //     service.followCompany(userId, invalidCompanyId),
  //   ).rejects.toThrow(NotFoundException);
  // });

  // it('should successfully unfollow a company', async () => {
  //   const userId = mockProfiles[1]._id.toString();
  //   const companyId = mockCompanies[0]._id.toString();

  //   const deletedFollowMock = {
  //     _id: new Types.ObjectId(),
  //     user_id: new Types.ObjectId(userId),
  //     company_id: new Types.ObjectId(companyId),
  //   };

  //   companyConnectionModel.findOneAndDelete = jest
  //     .fn()
  //     .mockResolvedValueOnce(deletedFollowMock);

  //   companyModel.findByIdAndUpdate.mockResolvedValueOnce({});

  //   await expect(
  //     service.unfollowCompany(userId, companyId),
  //   ).resolves.not.toThrow();

  //   expect(companyConnectionModel.findOneAndDelete).toHaveBeenCalledWith({
  //     user_id: new Types.ObjectId(userId),
  //     company_id: new Types.ObjectId(companyId),
  //   });

  //   expect(companyModel.findByIdAndUpdate).toHaveBeenCalledWith(
  //     new Types.ObjectId(companyId),
  //     { $inc: { followers: -1 } },
  //     { new: true },
  //   );
  // });

  // it('should throw NotFoundException if user is not following the company', async () => {
  //   const userId = mockProfiles[1]._id.toString();
  //   const companyId = mockCompanies[3]._id.toString();

  //   companyConnectionModel.findOneAndDelete = jest
  //     .fn()
  //     .mockResolvedValueOnce(null);

  //   await expect(service.unfollowCompany(userId, companyId)).rejects.toThrow(
  //     NotFoundException,
  //   );
  // });

  // it('should throw NotFoundException if company does not exist', async () => {
  //   const userId = mockProfiles[0]._id.toString();
  //   const invalidCompanyId = new Types.ObjectId().toString();

  //   companyModel.findById.mockReturnValueOnce({
  //     lean: jest.fn().mockResolvedValueOnce(null),
  //   });

  //   await expect(
  //     service.unfollowCompany(userId, invalidCompanyId),
  //   ).rejects.toThrow(NotFoundException);
  // });

  // it('should throw NotFoundException if company is not found', async () => {
  //   const invalidCompanyId = new Types.ObjectId().toString();

  //   companyModel.findById.mockReturnValueOnce({
  //     select: jest.fn().mockReturnValueOnce({
  //       lean: jest.fn().mockResolvedValueOnce(null),
  //     }),
  //   });

  //   await expect(
  //     service.getSuggestedCompanies(invalidCompanyId),
  //   ).rejects.toThrow(NotFoundException);
  // });

  // it('should return suggested companies based on industry and company size', async () => {
  //   const companyId = mockCompanies[0]._id.toString();
  //   const baseCompany = {
  //     industry: mockCompanies[0].industry,
  //     company_size: mockCompanies[0].company_size,
  //   };

  //   const expectedSuggestion = mockCompanies[1];
  //   companyModel.findById.mockReturnValueOnce({
  //     select: jest.fn().mockReturnValueOnce({
  //       lean: jest.fn().mockResolvedValueOnce(baseCompany),
  //     }),
  //   });

  //   companyModel.find.mockReturnValueOnce({
  //     select: jest.fn().mockReturnValueOnce({
  //       sort: jest.fn().mockReturnValueOnce({
  //         lean: jest.fn().mockResolvedValueOnce([expectedSuggestion]),
  //       }),
  //     }),
  //   });

  //   const result = await service.getSuggestedCompanies(companyId);

  //   expect(companyModel.findById).toHaveBeenCalledWith(
  //     new Types.ObjectId(companyId),
  //   );

  //   expect(companyModel.find).toHaveBeenCalledWith({
  //     _id: { $ne: new Types.ObjectId(companyId) },
  //     industry: baseCompany.industry,
  //     company_size: baseCompany.company_size,
  //   });

  //   expect(result).toHaveLength(1);
  //   expect(result[0].companyId.toString()).toBe(
  //     expectedSuggestion._id.toString(),
  //   );
  //   expect(result[0].industry).toBe(expectedSuggestion.industry);
  // });
});
