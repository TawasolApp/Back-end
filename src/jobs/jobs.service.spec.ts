// import { Test, TestingModule } from '@nestjs/testing';
// import { getModelToken } from '@nestjs/mongoose';
// import { JobsService } from './jobs.service';
// import { Job } from './infrastructure/database/schemas/job.schema';
// import { Application } from './infrastructure/database/schemas/application.schema';
// import { CompanyEmployer } from './infrastructure/database/schemas/company-employer.schema';
// import { Company } from '../companies/infrastructure/database/schemas/company.schema';
// import { CompanyManager } from '../companies/infrastructure/database/schemas/company-manager.schema';
// import { Profile } from '../profiles/infrastructure/database/schemas/profile.schema';
// import {
//   mockApplications,
//   mockCompanies,
//   mockCompanyEmployers,
//   mockCompanyManagers,
//   mockJobs,
//   mockProfiles,
//   mockUsers,
// } from './mock.data';
// import { NotFoundException, ForbiddenException } from '@nestjs/common';
// import { Types } from 'mongoose';
// import { handleError } from '../common/utils/exception-handler';
// import { LocationType } from './enums/location-type.enum';
// import { EmploymentType } from './enums/employment-type.enum';

// jest.mock('../common/utils/exception-handler', () => ({
//   handleError: jest.fn(),
// }));

// describe('JobsService', () => {
//   let service: JobsService;
//   let companyModel: any;
//   let companyConnectionModel: any;
//   let companyManagerModel: any;
//   let companyEmployerModel: any;
//   let userModel: any;
//   let profileModel: any;
//   let userConnectionModel: any;
//   let jobModel: any;
//   let applicationModel: any;

//   const mockJobModel = {
//     findById: jest.fn(),
//     find: jest.fn(),
//     save: jest.fn(),
//     create: jest.fn(),
//   };

//   const mockApplicationModel = {
//     aggregate: jest.fn(),
//   };

//   const mockCompanyModel = {
//     findById: jest.fn(),
//   };

//   const mockCompanyManagerModel = {
//     findOne: jest.fn(() => ({
//       lean: jest.fn(),
//     })),
//   };

//   const mockCompanyEmployerModel = {
//     findOne: jest.fn(() => ({
//       lean: jest.fn(),
//     })),
//   };

//   const mockProfileModel = {
//     find: jest.fn(),
//   };

//   beforeEach(async () => {
//     const module: TestingModule = await Test.createTestingModule({
//       providers: [
//         JobsService,
//         {
//           provide: getModelToken(Company.name),
//           useValue: mockCompanyModel,
//         },
//         {
//           provide: getModelToken(CompanyManager.name),
//           useValue: mockCompanyManagerModel,
//         },
//         {
//           provide: getModelToken(CompanyEmployer.name),
//           useValue: mockCompanyEmployerModel,
//         },
//         {
//           provide: getModelToken(Profile.name),
//           useValue: mockProfileModel,
//         },
//         {
//           provide: getModelToken(Job.name),
//           useValue: mockJobModel,
//         },
//         {
//           provide: getModelToken(Application.name),
//           useValue: mockApplicationModel,
//         },
//       ],
//     }).compile();

//     service = module.get<JobsService>(JobsService);

//     companyModel = module.get(getModelToken(Company.name));
//     companyManagerModel = module.get(getModelToken(CompanyManager.name));
//     companyEmployerModel = module.get(getModelToken(CompanyEmployer.name));
//     profileModel = module.get(getModelToken(Profile.name));
//     jobModel = module.get(getModelToken(Job.name));
//     applicationModel = module.get(getModelToken(Application.name));
//     jest.clearAllMocks();
//   });

//   describe('checkAccess', () => {
//     it('should return true if the user is a manager of the company (profileId1 → companyId1)', async () => {
//       companyManagerModel.findOne.mockReturnValueOnce({
//         lean: jest.fn().mockResolvedValueOnce(mockCompanyManagers[0]),
//       });
//       const result = await service.checkAccess(
//         mockProfiles[0]._id.toString(),
//         mockCompanies[0]._id.toString(),
//       );
//       expect(result).toBe(true);
//       expect(companyManagerModel.findOne).toHaveBeenCalledWith({
//         manager_id: mockProfiles[0]._id,
//         company_id: mockCompanies[0]._id,
//       });
//     });

//     it('should return true if the user is an employer of the company (profileId2 → companyId1)', async () => {
//       companyEmployerModel.findOne.mockReturnValueOnce({
//         lean: jest.fn().mockResolvedValueOnce(mockCompanyEmployers[0]),
//       });
//       const result = await service.checkAccess(
//         mockProfiles[1]._id.toString(),
//         mockCompanies[0]._id.toString(),
//       );
//       expect(result).toBe(true);
//       expect(companyEmployerModel.findOne).toHaveBeenCalledWith({
//         employer_id: mockProfiles[1]._id,
//         company_id: mockCompanies[0]._id,
//       });
//     });

//     it('should return false if the user is not a manager nor employer of the company (profileId3 → companyId1)', async () => {
//       companyManagerModel.findOne.mockReturnValueOnce({
//         lean: jest.fn().mockResolvedValueOnce(null),
//       });
//       companyEmployerModel.findOne.mockReturnValueOnce({
//         lean: jest.fn().mockResolvedValueOnce(null),
//       });
//       const result = await service.checkAccess(
//         mockProfiles[2]._id.toString(),
//         mockCompanies[0]._id.toString(),
//       );
//       expect(result).toBe(false);
//       expect(companyManagerModel.findOne).toHaveBeenCalledWith({
//         manager_id: mockProfiles[2]._id,
//         company_id: mockCompanies[0]._id,
//       });
//       expect(companyEmployerModel.findOne).toHaveBeenCalledWith({
//         employer_id: mockProfiles[2]._id,
//         company_id: mockCompanies[0]._id,
//       });
//     });
//   });

//   describe('getJob', () => {
//     it('should return job based on ID', async () => {
//       const jobId = mockJobs[0]._id.toString();
//       jobModel.findById.mockReturnValueOnce({
//         lean: jest.fn().mockResolvedValueOnce(mockJobs[0]),
//       });
//       const result = await service.getJob(jobId);
//       expect(result.jobId).toBe(mockJobs[0]._id.toString());
//       expect(result.companyId).toBe(mockCompanies[0]._id.toString());
//       expect(jobModel.findById).toHaveBeenCalledWith(new Types.ObjectId(jobId));
//     });

//     it('should throw NotFoundException if the job does not exist', async () => {
//       const invalidJobId = new Types.ObjectId().toString();
//       jobModel.findById.mockReturnValueOnce({
//         lean: jest.fn().mockResolvedValueOnce(null),
//       });
//       await service.getJob(invalidJobId);
//       expect(handleError).toHaveBeenCalledWith(
//         new NotFoundException('Job not found.'),
//         'Failed to retrieve job details.',
//       );
//     });

//     it('should catch and handle unexpected errors during getJob', async () => {
//       const jobId = mockJobs[0]._id.toString();
//       jobModel.findById = jest.fn(() => ({
//         lean: jest.fn(() => {
//           throw new Error('Unexpected Error');
//         }),
//       }));
//       await service.getJob(jobId);
//       expect(handleError).toHaveBeenCalledWith(
//         new Error('Unexpected Error'),
//         'Failed to retrieve job details.',
//       );
//     });
//   });

//   describe('postJob', () => {
//     const postJobDto = {
//       position: 'Marketing Intern',
//       locationType: LocationType.Hybrid,
//       employmentType: EmploymentType.Internship,
//       location: 'Cairo'
//     };

//     it('should successfully post a job when user has access', async () => {
//       const userId = mockProfiles[0]._id.toString();
//       const companyId = mockCompanies[0]._id.toString();
//       companyModel.findById.mockReturnValueOnce({
//         lean: jest.fn().mockResolvedValueOnce(mockCompanies[0]),
//       });
//       jest.spyOn(service, 'checkAccess').mockResolvedValueOnce(true);
//       const savedJob = {
//         _id: new Types.ObjectId(),
//         company_id: new Types.ObjectId(companyId),
//         applicants: 0,
//         open: true,
//         ...postJobDto,
//       };
//       const saveMock = jest.fn().mockResolvedValueOnce(savedJob);
//       const jobConstructorMock = jest.fn(() => ({ save: saveMock }));
//       (service as any).jobModel = jobConstructorMock;
//       const result = await service.postJob(userId, companyId, postJobDto);
//       expect(jobConstructorMock).toHaveBeenCalledWith(
//         expect.objectContaining({
//           company_id: expect.any(Types.ObjectId),
//           position: postJobDto.position,
//         }),
//       );
//       expect(saveMock).toHaveBeenCalled();
//       expect(result.position).toBe(postJobDto.position);
//     });

//     it('should throw NotFoundException when company does not exist', async () => {
//       const userId = mockProfiles[0]._id.toString();
//       const invalidCompanyId = new Types.ObjectId().toString();
//       companyModel.findById.mockReturnValueOnce({
//         lean: jest.fn().mockResolvedValueOnce(null),
//       });
//       await service.postJob(userId, invalidCompanyId, postJobDto);
//       expect(handleError).toHaveBeenCalledWith(
//         new NotFoundException('Company not found.'),
//         'Failed to add job listing.',
//       );
//     });

//     it('should throw ForbiddenException when user has no access', async () => {
//       const userId = mockProfiles[2]._id.toString();
//       const companyId = mockCompanies[0]._id.toString();
//       companyModel.findById.mockReturnValueOnce({
//         lean: jest.fn().mockResolvedValueOnce(mockCompanies[0]),
//       });
//       jest.spyOn(service, 'checkAccess').mockResolvedValueOnce(false);
//       await service.postJob(userId, companyId, postJobDto);
//       expect(handleError).toHaveBeenCalledWith(
//         new ForbiddenException(
//           'Logged in user does not have management or employer access to this company.',
//         ),
//         'Failed to add job listing.',
//       );
//     });
//   });

//   describe('getJobApplicants', () => {
//     const page = 1;
//     const limit = 5;

//     it('should return job applicants for jobId1 when accessed by manager profileId1', async () => {
//       const jobId = mockJobs[0]._id.toString();
//       const userId = mockProfiles[0]._id.toString();
//       jobModel.findById.mockReturnValueOnce({
//         lean: jest.fn().mockResolvedValueOnce(mockJobs[0]),
//       });
//       jest.spyOn(service, 'checkAccess').mockResolvedValueOnce(true);
//       const aggregationResult = [mockProfiles[2], mockProfiles[3]];
//       applicationModel.aggregate.mockResolvedValueOnce(aggregationResult);
//       const result = await service.getJobApplicants(userId, jobId, page, limit);
//       expect(result).toHaveLength(2);
//       expect(result[0].userId.toString()).toBe(mockProfiles[2]._id.toString());
//       expect(result[1].userId.toString()).toBe(mockProfiles[3]._id.toString());
//       expect(applicationModel.aggregate).toHaveBeenCalled();
//     });

//     it('should throw NotFoundException if job does not exist', async () => {
//       const jobId = new Types.ObjectId().toString();
//       const userId = mockProfiles[0]._id.toString();
//       jobModel.findById.mockReturnValueOnce({
//         lean: jest.fn().mockResolvedValueOnce(null),
//       });
//       await service.getJobApplicants(userId, jobId, page, limit);
//       expect(handleError).toHaveBeenCalledWith(
//         new NotFoundException('Job not found.'),
//         'Failed to retrieve job applicants.',
//       );
//     });

//     it('should throw ForbiddenException if user has no access to jobId1', async () => {
//       const jobId = mockJobs[0]._id.toString();
//       const userId = mockProfiles[2]._id.toString();
//       jobModel.findById.mockReturnValueOnce({
//         lean: jest.fn().mockResolvedValueOnce(mockJobs[0]),
//       });
//       jest.spyOn(service, 'checkAccess').mockResolvedValueOnce(false);
//       await service.getJobApplicants(userId, jobId, page, limit);
//       expect(handleError).toHaveBeenCalledWith(
//         new ForbiddenException(
//           'Logged in user does not have management access or employer access to this job posting.',
//         ),
//         'Failed to retrieve job applicants.',
//       );
//     });
//   });
// });
