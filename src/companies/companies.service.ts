import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model, Types } from 'mongoose';
import {
  Company,
  CompanyDocument,
} from './infrastructure/database/schemas/company.schema';
import {
  CompanyConnection,
  CompanyConnectionDocument,
} from './infrastructure/database/schemas/company-connection.schema';
import {
  CompanyManager,
  CompanyManagerDocument,
} from './infrastructure/database/schemas/company-manager.schema';
import {
  Job,
  JobDocument,
} from '../jobs/infrastructure/database/schemas/job.schema';
import {
  Application,
  ApplicationDocument,
} from '../jobs/infrastructure/database/schemas/application.schema';
import {
  User,
  UserDocument,
} from '../users/infrastructure/database/schemas/user.schema';
import {
  Profile,
  ProfileDocument,
} from '../profiles/infrastructure/database/schemas/profile.schema';
import {
  UserConnection,
  UserConnectionDocument,
} from '../connections/infrastructure/database/schemas/user-connection.schema';
import {
  CompanyEmployer,
  CompanyEmployerDocument,
} from '../jobs/infrastructure/database/schemas/company-employer.schema';
import { CreateCompanyDto } from './dtos/create-company.dto';
import { UpdateCompanyDto } from './dtos/update-company.dto';
import { GetCompanyDto } from './dtos/get-company.dto';
import { GetUserDto } from '../common/dtos/get-user.dto';
import {
  toCreateCompanySchema,
  toUpdateCompanySchema,
  toGetCompanyDto,
} from './mappers/company.mapper';
import { toGetUserDto } from '../common/mappers/user.mapper';
import { ConnectionStatus } from '../connections/enums/connection-status.enum';
import { GetJobDto } from '../jobs/dtos/get-job.dto';
import { toGetJobDto } from '../jobs/mappers/job.mapper';
import { handleError } from '../common/utils/exception-handler';
import { AddAccessDto } from './dtos/add-access.dto';
import { validateId } from '../common/utils/id-validator';

@Injectable()
export class CompaniesService {
  constructor(
    @InjectModel(Company.name)
    private readonly companyModel: Model<CompanyDocument>,
    @InjectModel(CompanyConnection.name)
    private readonly companyConnectionModel: Model<CompanyConnectionDocument>,
    @InjectModel(CompanyManager.name)
    private readonly companyManagerModel: Model<CompanyManagerDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(Profile.name)
    private readonly profileModel: Model<ProfileDocument>,
    @InjectModel(Job.name) private readonly jobModel: Model<JobDocument>,
    @InjectModel(Application.name)
    private readonly applicationModel: Model<ApplicationDocument>,
    @InjectModel(CompanyEmployer.name)
    private readonly companyEmployerModel: Model<CompanyEmployerDocument>,
    @InjectModel(UserConnection.name)
    private readonly userConnectionModel: Model<UserConnectionDocument>,
  ) {}

  async checkAccess(userId: string, companyId: string) {
    const allowedManager = await this.companyManagerModel
      .findOne({
        manager_id: new Types.ObjectId(userId),
        company_id: new Types.ObjectId(companyId),
      })
      .lean();
    if (allowedManager) {
      return true;
    } else {
      return false;
    }
  }

  /**
   * creates a new company in the database.
   *
   * @param createCompanyDto - partial object containing company details.
   * @returns GetCompanyDto - created company object.
   * @throws ConflictException - if a company with the same name, website, email, or contact number already exists.
   *
   * function flow:
   * 1. convert the input data to a company creation schema.
   * 2. check for existing companies with duplicate fields (name, website, email, contact number).
   * 3. if a duplicate exists, throw a ConflictException.
   * 4. if no duplicates are found, create a new company document.
   * 5. save the new company to the database.
   * 6. gives company creator management access.
   * 7. return the newly created company as a DTO.
   */
  async createCompany(
    userId: string,
    createCompanyDto: Partial<CreateCompanyDto>,
  ): Promise<GetCompanyDto> {
    try {
      const companyData = toCreateCompanySchema(createCompanyDto);
      const conflictFilters: { [key: string]: any }[] = [];
      if (companyData.name) {
        conflictFilters.push({ name: companyData.name });
      }
      if (companyData.website) {
        conflictFilters.push({ website: companyData.website });
      }
      if (companyData.email) {
        conflictFilters.push({ email: companyData.email });
      }
      if (companyData.contact_number) {
        conflictFilters.push({ contact_number: companyData.contact_number });
      }
      if (conflictFilters.length > 0) {
        const existingFields = await this.companyModel.findOne({
          $or: conflictFilters,
        });
        if (existingFields) {
          throw new ConflictException(
            'Company name, website, email and contact number must be unique.',
          );
        }
      }
      const newCompany = new this.companyModel({
        _id: new Types.ObjectId(),
        followers: 0,
        verified: false,
        ...companyData,
      });
      const createdCompany = await newCompany.save();
      const newManager = new this.companyManagerModel({
        _id: new Types.ObjectId(),
        manager_id: new Types.ObjectId(userId),
        company_id: createdCompany._id,
      });
      await newManager.save();
      await this.userModel.findByIdAndUpdate(
        new Types.ObjectId(userId),
        { $set: { role: 'manager' } },
        { upsert: false },
      );
      return toGetCompanyDto(createdCompany);
    } catch (error) {
      handleError(error, 'Failed to create company.');
    }
  }

  /**
   * updates an existing company in the database.
   *
   * @param companyId - ID of the company to update.
   * @param updateCompanyDto - partial object containing updated company details.
   * @returns GetCompanyDto - the updated company object.
   * @throws NotFoundException - if the company does not exist.
   * @throws ConflictException - if a company with the same name, website, email, or contact number already exists.
   *
   * function flow:
   * 1. validate the existence of the company.
   * 2. validate logged in user's management access.
   * 3. check for existing companies with duplicate fields (name, website, email, contact number).
   * 4. update the company if no conflicts are found.
   * 5. return the updated company as a DTO.
   */
  async updateCompany(
    userId: string,
    companyId: string,
    updateCompanyDto: Partial<UpdateCompanyDto>,
  ): Promise<GetCompanyDto> {
    try {
      const updateData = toUpdateCompanySchema(updateCompanyDto);
      const existingCompany = await this.companyModel
        .findById(new Types.ObjectId(companyId))
        .lean();
      if (!existingCompany) {
        throw new NotFoundException('Company not found.');
      }
      if (!(await this.checkAccess(userId, companyId))) {
        throw new ForbiddenException(
          'Logged in user does not have management access to this company.',
        );
      }
      const conflictFilters: { [key: string]: any }[] = [];
      if (updateData.name) {
        conflictFilters.push({ name: updateData.name });
      }
      if (updateData.website) {
        conflictFilters.push({ website: updateData.website });
      }
      if (updateData.email) {
        conflictFilters.push({ email: updateData.email });
      }
      if (updateData.contact_number) {
        conflictFilters.push({ contact_number: updateData.contact_number });
      }
      if (conflictFilters.length > 0) {
        const existingFields = await this.companyModel.findOne({
          $and: [
            { _id: { $ne: new Types.ObjectId(companyId) } },
            { $or: conflictFilters },
          ],
        });
        if (existingFields) {
          throw new ConflictException(
            'Company name, website, email and contact number must be unique.',
          );
        }
      }
      const updatedCompany = await this.companyModel.findByIdAndUpdate(
        new Types.ObjectId(companyId),
        { $set: updateData },
        { new: true },
      );
      return toGetCompanyDto(updatedCompany!);
    } catch (error) {
      handleError(error, 'Failed to update company details.');
    }
  }

  /**
   * deletes a company and associated data from the database.
   *
   * @param companyId - ID of the company to delete.
   * @throws NotFoundException - if the company does not exist.
   *
   * function flow:
   * 1. check if the company exists.
   * 2. validates logged in user's management access
   * 2. delete the company and associated connections.
   * 3. remove related jobs and applications.
   */
  async deleteCompany(userId: string, companyId: string) {
    try {
      const existingCompany = await this.companyModel
        .findById(new Types.ObjectId(companyId))
        .lean();
      if (!existingCompany) {
        throw new NotFoundException('Company not found.');
      }
      if (!(await this.checkAccess(userId, companyId))) {
        throw new ForbiddenException(
          'Logged in user does not have management access to this company.',
        );
      }
      await this.companyModel
        .findByIdAndDelete(new Types.ObjectId(companyId))
        .lean();
      await this.companyConnectionModel.deleteMany({
        company_id: new Types.ObjectId(companyId),
      });
      const deletedJobs = await this.jobModel.find({
        company_id: new Types.ObjectId(companyId),
      });
      const deletedIds = deletedJobs.map((deletedJob) => deletedJob._id);
      await this.jobModel.deleteMany({
        company_id: new Types.ObjectId(companyId),
      });
      await this.applicationModel.deleteMany({
        job_id: { $in: deletedIds },
      });
      await this.companyManagerModel.deleteMany({
        company_id: new Types.ObjectId(companyId),
      });
      await this.companyEmployerModel.deleteMany({
        company_id: new Types.ObjectId(companyId),
      });
    } catch (error) {
      handleError(error, 'Failed to delete company.');
    }
  }

  /**
   * retrieves company details including follow status for the logged in user.
   *
   * @param companyId - ID of the company.
   * @param userId - ID of the user to check follow status.
   * @returns GetCompanyDto - detailed company information with follow status.
   * @throws NotFoundException - if the company does not exist.
   *
   * function flow:
   * 1. fetch company details by ID.
   * 2. check if the user is following the company.
   * 3. return the company details with follow status.
   */
  async getCompanyDetails(
    userId: string,
    companyId: string,
  ): Promise<GetCompanyDto> {
    try {
      const company = await this.companyModel
        .findById(new Types.ObjectId(companyId))
        .lean();
      if (!company) {
        throw new NotFoundException('Company not found.');
      }
      const isFollowing = await this.companyConnectionModel.findOne({
        user_id: new Types.ObjectId(userId),
        company_id: new Types.ObjectId(companyId),
      });
      const companyDto = toGetCompanyDto(company);
      companyDto.isFollowing = !!isFollowing;
      companyDto.isManager = await this.checkAccess(userId, companyId);
      return companyDto;
    } catch (error) {
      handleError(error, 'Failed to retrieve company details.');
    }
  }

  /**
   * filters companies based on name and industry.
   *
   * @param userId - ID of the user for follow status.
   * @param name - optional company name filter.
   * @param industry - optional company industry filter.
   * @returns array of GetCompanyDto - filtered companies with follow status.
   *
   * function flow:
   * 1. build a dynamic filter based on the input.
   * 2. retrieve matching companies from the database.
   * 3. check which companies the user is following.
   * 4. return filtered companies with follow status.
   */
  async filterCompanies(
    userId: string,
    page: number,
    limit: number,
    name?: string,
    industry?: string,
  ): Promise<GetCompanyDto[]> {
    try {
      const filter: any = {};
      if (name) {
        filter.name = { $regex: name, $options: 'i' };
      }
      if (industry) {
        filter.industry = { $regex: industry, $options: 'i' };
      }
      const skip = (page - 1) * limit;
      const companies = await this.companyModel
        .find(filter)
        .select('_id name logo industry followers')
        .sort({ followers: -1, _id: 1 })
        .skip(skip)
        .limit(limit)
        .lean();
      const companyIds = companies.map((company) => company._id);
      const connections = await this.companyConnectionModel
        .find({
          user_id: new Types.ObjectId(userId),
          company_id: { $in: companyIds },
        })
        .lean();
      const followedCompanyIds = new Set(
        connections.map((connection) => connection.company_id.toString()),
      );
      return await Promise.all(
        companies.map(async (company) => {
          const companyDto = toGetCompanyDto(company);
          companyDto.isFollowing = followedCompanyIds.has(
            company._id.toString(),
          );
          companyDto.isManager = await this.checkAccess(
            userId,
            company._id.toString(),
          );
          return companyDto;
        }),
      );
    } catch (error) {
      handleError(error, 'Failed to retrieve list of companies.');
    }
  }

  /**
   * retrieves the list of followers for a given company, can apply optional filter by name.
   *
   * @param companyId - ID of the company.
   * @returns array of GetUserDto - list of followers with profile information.
   * @throws NotFoundException - if the company does not exist.
   *
   * function flow:
   * 1. verify the company's existence.
   * 2. fetch followers from the database.
   * 3. retrieve profile details for each follower.
   * 4. map profile data to user DTO and return.
   */
  async getCompanyFollowers(
    companyId: string,
    page: number,
    limit: number,
    name?: string,
  ): Promise<GetUserDto[]> {
    try {
      const company = await this.companyModel
        .findById(new Types.ObjectId(companyId))
        .lean();
      if (!company) {
        throw new NotFoundException('Company not found.');
      }
      const followers = await this.companyConnectionModel
        .find({ company_id: new Types.ObjectId(companyId) })
        .sort({ created_at: -1, _id: -1 })
        .select('user_id')
        .lean();
      const followerIds = followers.map((follower) => follower.user_id);
      const filter: any = { _id: { $in: followerIds } };
      if (name) {
        filter.name = { $regex: name, $options: 'i' };
      }
      const skip = (page - 1) * limit;
      const profiles = await this.profileModel
        .find(filter)
        .select('_id first_name last_name profile_picture headline')
        .sort({ _id: 1 })
        .skip(skip)
        .limit(limit)
        .lean();
      return profiles.map(toGetUserDto);
    } catch (error) {
      handleError(error, 'Failed to retrieve list of followers.');
    }
  }

  /**
   * follows a company for the logged in user.
   *
   * @param userId - ID of the user.
   * @param companyId - ID of the company to follow.
   * @throws NotFoundException - if the company does not exist.
   * @throws ConflictException - if the user already follows the company.
   *
   * function flow:
   * 1. verify the company's existence.
   * 2. check if the user already follows the company.
   * 3. create a new follow record and increment follower count.
   */
  async followCompany(userId: string, companyId: string) {
    try {
      const company = await this.companyModel
        .findById(new Types.ObjectId(companyId))
        .lean();
      if (!company) {
        throw new NotFoundException('Company not found.');
      }
      const existingFollow = await this.companyConnectionModel
        .findOne({
          user_id: new Types.ObjectId(userId),
          company_id: new Types.ObjectId(companyId),
        })
        .lean();
      if (existingFollow) {
        throw new ConflictException('User already follows this company.');
      }
      const newFollow = new this.companyConnectionModel({
        _id: new Types.ObjectId(),
        user_id: new Types.ObjectId(userId),
        company_id: new Types.ObjectId(companyId),
      });
      await newFollow.save();
      await this.companyModel.findByIdAndUpdate(
        new Types.ObjectId(companyId),
        { $inc: { followers: 1 } },
        { new: true },
      );
    } catch (error) {
      handleError(error, 'Failed to follow company.');
    }
  }

  /**
   * unfollows a company for the logged in user.
   *
   * @param userId - ID of the user.
   * @param companyId - ID of the company to unfollow.
   * @throws NotFoundException - if the follow record does not exist.
   *
   * function flow:
   * 1. delete the follow record from the database.
   * 2. decrement the follower count of the company.
   */
  async unfollowCompany(userId: string, companyId: string) {
    try {
      const company = await this.companyModel
        .findById(new Types.ObjectId(companyId))
        .lean();
      if (!company) {
        throw new NotFoundException('Company not found.');
      }
      const deletedFollow = await this.companyConnectionModel.findOneAndDelete({
        user_id: new Types.ObjectId(userId),
        company_id: new Types.ObjectId(companyId),
      });
      if (!deletedFollow) {
        throw new NotFoundException(
          'Follow record not found. User is not following this company.',
        );
      }
      await this.companyModel.findByIdAndUpdate(
        new Types.ObjectId(companyId),
        { $inc: { followers: -1 } },
        { new: true },
      );
    } catch (error) {
      handleError(error, 'Failed to unfollow company.');
    }
  }

  /**
   * suggests companies similar to the given company.
   *
   * @param companyId - ID of the company to base suggestions on.
   * @param userId - ID of currently logged in user.
   * @returns array of GetCompanyDto - suggested companies.
   * @throws NotFoundException - if the company does not exist.
   *
   * function flow:
   * 1. fetch the company details for industry and size.
   * 2. find similar companies excluding the original one.
   * 3. return the suggested companies sorted by follower count.
   */
  async getSuggestedCompanies(
    userId: string,
    companyId: string,
    page: number,
    limit: number,
  ): Promise<GetCompanyDto[]> {
    try {
      const company = await this.companyModel
        .findById(new Types.ObjectId(companyId))
        .select('industry company_size')
        .lean();
      if (!company) {
        throw new NotFoundException('Company not found');
      }
      const skip = (page - 1) * limit;
      const suggestedCompanies = await this.companyModel
        .find({
          _id: { $ne: new Types.ObjectId(companyId) },
          industry: company.industry,
          company_size: company.company_size,
        })
        .select('_id name logo industry followers')
        .sort({ followers: -1, _id: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      const companyIds = suggestedCompanies.map((company) => company._id);
      const connections = await this.companyConnectionModel
        .find({
          user_id: new Types.ObjectId(userId),
          company_id: { $in: companyIds },
        })
        .lean();
      const followedCompanyIds = new Set(
        connections.map((connection) => connection.company_id.toString()),
      );
      return await Promise.all(
        suggestedCompanies.map(async (company) => {
          const companyDto = toGetCompanyDto(company);
          companyDto.isFollowing = followedCompanyIds.has(
            company._id.toString(),
          );
          // companyDto.isManager = await this.checkAccess(
          //   userId,
          //   company._id.toString(),
          // );
          return companyDto;
        }),
      );
    } catch (error) {
      handleError(error, 'Failed to retrieve list of related companies.');
    }
  }

  /**
   * retrieves common followers between a user and a company.
   *
   * @param userId - ID of the user.
   * @param companyId - ID of the company.
   * @returns array of GetUserDto - list of common followers.
   * @throws NotFoundException - if the company does not exist.
   *
   * function flow:
   * 1. get the user's connections.
   * 2. find common followers who are also connected with the user.
   * 3. return profiles of common followers as DTOs.
   */
  async getCommonFollowers(
    userId: string,
    companyId: string,
  ): Promise<GetUserDto[]> {
    try {
      const company = await this.companyModel
        .findById(new Types.ObjectId(companyId))
        .lean();
      if (!company) {
        throw new NotFoundException('Company not found');
      }
      const connections = await this.userConnectionModel
        .find({
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
        })
        .select('sending_party receiving_party')
        .lean();
      const connectionIds = connections.map((connection) =>
        connection.sending_party.equals(new Types.ObjectId(userId))
          ? connection.receiving_party
          : connection.sending_party,
      );
      const followers = await this.companyConnectionModel
        .find({
          user_id: { $in: connectionIds },
          company_id: new Types.ObjectId(companyId),
        })
        .sort({ created_at: -1 })
        .select('user_id')
        .lean();
      const followerIds = followers.map((follower) => follower.user_id);
      const profiles = await this.profileModel
        .find({ _id: { $in: followerIds } })
        .select('_id first_name last_name profile_picture headline')
        .lean();
      return profiles.map(toGetUserDto);
    } catch (error) {
      handleError(error, 'Failed to retrieve list of common followers.');
    }
  }

  async getFollowedCompanies(
    id: string,
    page: number,
    limit: number,
  ): Promise<GetCompanyDto[]> {
    try {
      if (!isValidObjectId(id)) {
        throw new BadRequestException('Invalid profile ID format');
      }
      const skip = (page - 1) * limit;
      const connections = await this.companyConnectionModel
        .find({ user_id: new Types.ObjectId(id) })
        .sort({ created_at: -1 })
        .select('company_id')
        .lean();
      const followedCompanyIds = connections.map(
        (connection) => connection.company_id,
      );
      const companies = await this.companyModel
        .find({ _id: { $in: followedCompanyIds } })
        .select('_id name logo industry followers')
        .sort({ created_at: -1, _id: -1 })
        .skip(skip)
        .limit(limit)
        .lean();
      return companies.map(toGetCompanyDto);
    } catch (error) {
      handleError(error, 'Failed to retrieve list of followed companies.');
    }
  }

  /**
   * retrieves the list of jobs posted for a given company.
   *
   * @param companyId - ID of the company.
   * @returns array of GetJobDto - list of jobs with their information.
   * @throws NotFoundException - if the company does not exist.
   *
   * function flow:
   * 1. verify the company's existence.
   * 2. fetch jobs from the database.
   * 4. map job data to job DTO and return.
   */
  async getCompanyJobs(
    companyId: string,
    page: number,
    limit: number,
  ): Promise<GetJobDto[]> {
    try {
      const company = await this.companyModel
        .findById(new Types.ObjectId(companyId))
        .lean();
      if (!company) {
        throw new NotFoundException('Company not found.');
      }
      const skip = (page - 1) * limit;
      const jobs = await this.jobModel
        .find({ company_id: new Types.ObjectId(companyId) })
        .sort({ posted_at: -1, _id: 1 })
        .skip(skip)
        .limit(limit)
        .lean();
      return jobs.map(toGetJobDto);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      handleError(error, 'Failed to retrieve company jobs.');
    }
  }

  /**
   * grants management access of a company to a user.
   *
   * @param companyId - ID of the company to which management access is being granted.
   * @param addAccessDto - DTO which contains ID of the new manager to be added.
   * @param userId - ID of the currently logged-in manager making the request.
   * @throws NotFoundException - if the company or user does not exist.
   * @throws ForbiddenException - if the logged-in manager does not have management access to the company.
   * @throws ConflictException - if the user already has management access to the company.
   *
   * function flow:
   * 1. validate company and user existence by ID.
   * 2. check if the logged-in manager has management access to the specified company.
   * 3. check if the user already has management access to the company.
   * 5. if the user does not have management access:
   *    a. create a new company manager record and saves it.
   *    b. update the user's role to 'manager' if not already.
   * 6. save the new manager information to the database.
   */
  async addCompanyManager(
    userId: string,
    companyId: string,
    addAccessDto: AddAccessDto,
  ) {
    try {
      const { newUserId } = addAccessDto;
      const newManagerId = newUserId;
      validateId(newManagerId, 'user');
      const company = await this.companyModel
        .findById(new Types.ObjectId(companyId))
        .lean();
      if (!company) {
        throw new NotFoundException('Company not found.');
      }
      const user = await this.userModel
        .findById(new Types.ObjectId(newManagerId))
        .lean();
      if (!user) {
        throw new NotFoundException('User not found.');
      }
      const allowedManager = await this.companyManagerModel
        .findOne({
          manager_id: new Types.ObjectId(userId),
          company_id: new Types.ObjectId(companyId),
        })
        .lean();
      if (!allowedManager) {
        throw new ForbiddenException(
          'Logged in user does not have management access to this company.',
        );
      }
      const existingManager = await this.companyManagerModel
        .findOne({
          manager_id: new Types.ObjectId(newManagerId),
          company_id: new Types.ObjectId(companyId),
        })
        .lean();
      if (existingManager) {
        throw new ConflictException(
          'User already has management access to this company.',
        );
      }
      const newManager = new this.companyManagerModel({
        _id: new Types.ObjectId(),
        manager_id: new Types.ObjectId(newManagerId),
        company_id: new Types.ObjectId(companyId),
      });
      await newManager.save();
      if (user.role !== 'manager') {
        await this.userModel.findByIdAndUpdate(
          new Types.ObjectId(newManagerId),
          { $set: { role: 'manager' } },
          { upsert: false },
        );
      }
      await this.companyEmployerModel.findOneAndDelete({
        employer_id: new Types.ObjectId(newManagerId),
        company_id: new Types.ObjectId(companyId),
      });
    } catch (error) {
      handleError(
        error,
        'Failed to provide company management access to user.',
      );
    }
  }

  /**
   * grants employer access of a company to a user.
   *
   * @param companyId - ID of the company to which management access is being granted.
   * @param addAccessDto - DTO which contains ID of the new employer to be added.
   * @param userId - ID of the currently logged-in manager making the request.
   * @throws NotFoundException - if the company or user does not exist.
   * @throws ForbiddenException - if the logged-in manager does not have management access to the company.
   * @throws ConflictException - if the user already has management or employer access to the company.
   *
   * function flow:
   * 1. validate company and user existence by ID.
   * 2. check if the logged-in manager has management access to the specified company.
   * 3. check if the user already has management or employer access to the company.
   * 5. if the user does not have management or employer access:
   *    a. create a new company employer record and saves it.
   *    b. update the user's role to 'employer' if not already.
   * 6. save the new employer information to the database.
   */
  async addCompanyEmployer(
    userId: string,
    companyId: string,
    addAccessDto: AddAccessDto,
  ) {
    try {
      const { newUserId } = addAccessDto;
      const newEmployerId = newUserId;
      validateId(newEmployerId, 'user');
      const company = await this.companyModel
        .findById(new Types.ObjectId(companyId))
        .lean();
      if (!company) {
        throw new NotFoundException('Company not found.');
      }
      const user = await this.userModel
        .findById(new Types.ObjectId(newEmployerId))
        .lean();
      if (!user) {
        throw new NotFoundException('User not found.');
      }
      const allowedManager = await this.companyManagerModel
        .findOne({
          manager_id: new Types.ObjectId(userId),
          company_id: new Types.ObjectId(companyId),
        })
        .lean();
      if (!allowedManager) {
        throw new ForbiddenException(
          'Logged in user does not have management access to this company.',
        );
      }
      const existingManager = await this.companyManagerModel
        .findOne({
          manager_id: new Types.ObjectId(newEmployerId),
          company_id: new Types.ObjectId(companyId),
        })
        .lean();
      const existingEmployer = await this.companyEmployerModel
        .findOne({
          employer_id: new Types.ObjectId(newEmployerId),
          company_id: new Types.ObjectId(companyId),
        })
        .lean();
      if (existingManager) {
        throw new ConflictException(
          'User already has management access to this company.',
        );
      }
      if (existingEmployer) {
        throw new ConflictException(
          'User already has employer access to this company.',
        );
      }
      const newEmployer = new this.companyEmployerModel({
        _id: new Types.ObjectId(),
        employer_id: new Types.ObjectId(newEmployerId),
        company_id: new Types.ObjectId(companyId),
      });
      await newEmployer.save();
      if (user.role === 'customer') {
        await this.userModel.findByIdAndUpdate(
          new Types.ObjectId(newEmployerId),
          { $set: { role: 'employer' } },
          { upsert: false },
        );
      }
    } catch (error) {
      handleError(error, 'Failed to provide company employer access to user.');
    }
  }

  /**
   * retrieves the list of managers for a given company.
   *
   * @param companyId - ID of the company.
   * @param userId - ID of logged in user
   * @returns array of GetUserDto - list of managers with profile information.
   * @throws NotFoundException - if the company does not exist.
   * @throws ForbiddenException - if logged in user does not have management access.
   *
   * function flow:
   * 1. verify the company's existence.
   * 2. validate logged in user's management access.
   * 3. fetch managers from the database.
   * 4. retrieve profile details for each manager.
   * 5. map profile data to user DTO and return.
   */
  async getCompanyManagers(
    companyId: string,
    userId: string,
    page: number,
    limit: number,
  ): Promise<GetUserDto[]> {
    try {
      const company = await this.companyModel
        .findById(new Types.ObjectId(companyId))
        .lean();
      if (!company) {
        throw new NotFoundException('Company not found.');
      }
      if (!(await this.checkAccess(userId, companyId))) {
        throw new ForbiddenException(
          'Logged in user does not have management access to this company.',
        );
      }
      const managers = await this.companyManagerModel
        .find({ company_id: new Types.ObjectId(companyId) })
        .sort({ created_at: -1, _id: -1 })
        .select('manager_id')
        .lean();
      const managerIds = managers.map((manager) => manager.manager_id);
      const skip = (page - 1) * limit;
      const profiles = await this.profileModel
        .find({ _id: { $in: managerIds } })
        .select('_id first_name last_name profile_picture headline')
        .sort({ _id: 1 })
        .skip(skip)
        .limit(limit)
        .lean();
      return profiles.map(toGetUserDto);
    } catch (error) {
      handleError(error, 'Failed to retrieve list of managers.');
    }
  }

  /**
   * retrieves the list of employers for a given company.
   *
   * @param companyId - ID of the company.
   * @param userId - ID of logged in user
   * @returns array of GetUserDto - list of employers with profile information.
   * @throws NotFoundException - if the company does not exist.
   * @throws ForbiddenException - if logged in user does not have management access.
   *
   * function flow:
   * 1. verify the company's existence.
   * 2. validate logged in user's management access.
   * 3. fetch employers from the database.
   * 4. retrieve profile details for each employer.
   * 5. map profile data to user DTO and return.
   */
  async getCompanyEmployers(
    companyId: string,
    userId: string,
    page: number,
    limit: number,
  ): Promise<GetUserDto[]> {
    try {
      const company = await this.companyModel
        .findById(new Types.ObjectId(companyId))
        .lean();
      if (!company) {
        throw new NotFoundException('Company not found.');
      }
      if (!(await this.checkAccess(userId, companyId))) {
        throw new ForbiddenException(
          'Logged in user does not have management access to this company.',
        );
      }
      const employers = await this.companyEmployerModel
        .find({ company_id: new Types.ObjectId(companyId) })
        .sort({ created_at: -1, _id: -1 })
        .select('employer_id')
        .lean();
      const employerIds = employers.map((employer) => employer.employer_id);
      const skip = (page - 1) * limit;
      const profiles = await this.profileModel
        .find({ _id: { $in: employerIds } })
        .select('_id first_name last_name profile_picture headline')
        .sort({ _id: 1 })
        .skip(skip)
        .limit(limit)
        .lean();
      return profiles.map(toGetUserDto);
    } catch (error) {
      handleError(error, 'Failed to retrieve list of employers.');
    }
  }
}
