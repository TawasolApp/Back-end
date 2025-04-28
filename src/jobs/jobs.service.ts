import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Job, JobDocument } from './infrastructure/database/schemas/job.schema';
import {
  Application,
  ApplicationDocument,
} from './infrastructure/database/schemas/application.schema';
import {
  CompanyEmployer,
  CompanyEmployerDocument,
} from './infrastructure/database/schemas/company-employer.schema';
import {
  Company,
  CompanyDocument,
} from '../companies/infrastructure/database/schemas/company.schema';
import {
  CompanyManager,
  CompanyManagerDocument,
} from '../companies/infrastructure/database/schemas/company-manager.schema';
import {
  Profile,
  ProfileDocument,
} from '../profiles/infrastructure/database/schemas/profile.schema';
import {
  User,
  UserDocument,
} from '../users/infrastructure/database/schemas/user.schema';
import { PostJobDto } from './dtos/post-job.dto';
import { GetJobDto } from './dtos/get-job.dto';
import { ApplyJobDto } from './dtos/apply-job.dto';
import { ApplicationDto } from './dtos/application.dto';
import { toGetJobDto, toPostJobSchema } from './mappers/job.mapper';
import { toGetUserDto } from '../common/mappers/user.mapper';
import { GetUserDto } from '../common/dtos/get-user.dto';
import { handleError } from '../common/utils/exception-handler';
import { toApplicationDto } from './mappers/application.mapper';

@Injectable()
export class JobsService {
  constructor(
    @InjectModel(Job.name) private readonly jobModel: Model<JobDocument>,
    @InjectModel(Application.name)
    private readonly applicationModel: Model<ApplicationDocument>,
    @InjectModel(Company.name)
    private readonly companyModel: Model<CompanyDocument>,
    @InjectModel(CompanyManager.name)
    private readonly companyManagerModel: Model<CompanyManagerDocument>,
    @InjectModel(CompanyEmployer.name)
    private readonly companyEmployerModel: Model<CompanyEmployerDocument>,
    @InjectModel(Profile.name)
    private readonly profileModel: Model<ProfileDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async checkAccess(userId: string, companyId: string) {
    const user = await this.userModel
      .findById(new Types.ObjectId(userId))
      .lean();
    if (user?.role === 'admin') {
      return true;
    }

    const allowedManager = await this.companyManagerModel
      .findOne({
        manager_id: new Types.ObjectId(userId),
        company_id: new Types.ObjectId(companyId),
      })
      .lean();
    const allowedEmployer = await this.companyEmployerModel
      .findOne({
        employer_id: new Types.ObjectId(userId),
        company_id: new Types.ObjectId(companyId),
      })
      .lean();

    return !!(allowedManager || allowedEmployer);
  }

  /**
   * creates a new job in the database.
   *
   * @param postJobDto - partial object containing job details.
   * @returns GetJobDto - created job object.
   * @throws NotFoundException - if company does not exist.
   *
   * function flow:
   * 1. verify the company's existence.
   * 2. convert the input data to a job creation schema.
   * 3. create a new job document and save to database.
   * 4. return the newly created job as a DTO.
   */
  async postJob(
    userId: string,
    companyId: string,
    postJobDto: PostJobDto,
  ): Promise<GetJobDto> {
    try {
      const existingCompany = await this.companyModel
        .findById(new Types.ObjectId(companyId))
        .lean();
      if (!existingCompany) {
        throw new NotFoundException('Company not found.');
      }
      if (!(await this.checkAccess(userId, companyId))) {
        throw new ForbiddenException(
          'Logged in user does not have management or employer access to this company.',
        );
      }
      const jobData = toPostJobSchema(postJobDto);
      const newJob = new this.jobModel({
        _id: new Types.ObjectId(),
        company_id: new Types.ObjectId(companyId),
        applicants: 0,
        open: true,
        ...jobData,
      });
      const createdJob = await newJob.save();
      return toGetJobDto(createdJob);
    } catch (error) {
      handleError(error, 'Failed to add job listing.');
    }
  }

  async getJob(jobId: string, userId: string): Promise<GetJobDto> {
    try {
      const job = await this.jobModel
        .findById(new Types.ObjectId(jobId))
        .lean();
      if (!job) {
        throw new NotFoundException('Job not found.');
      }

      const company = await this.companyModel.findById(job.company_id).lean();
      if (!company) {
        throw new NotFoundException('Company not found.');
      }

      const jobDto = toGetJobDto(job);
      jobDto.companyName = company.name;
      jobDto.companyLogo = company.logo;
      jobDto.companyLocation = company.address;
      jobDto.companyDescription = company.description;

      jobDto.isSaved =
        job.saved_by?.some((id) => id.toString() === userId) || false;

      const application = await this.applicationModel
        .findOne({
          job_id: new Types.ObjectId(jobId),
          user_id: new Types.ObjectId(userId),
        })
        .lean();

      jobDto.status = application?.status || null;

      return jobDto;
    } catch (error) {
      handleError(error, 'Failed to retrieve job details.');
    }
    /**
     * retrieves the list of applicants for a given job, can apply optional filter by name.
     *
     * @param jobId - ID of the job.
     * @returns array of GetUserDto - list of applicants with profile information.
     * @throws NotFoundException - if the job does not exist.
     *
     * function flow:
     * 1. verify the job's existence.
     * 2. fetch applicants from the database.
     * 3. retrieve profile details for each applicants.
     * 4. map profile data to DTO and return.
     */
  }

  /**
   * retrieves the list of applicants for a given job, can apply optional filter by name.
   *
   * @param jobId - ID of the job.
   * @returns array of GetUserDto - list of applicants with profile information.
   * @throws NotFoundException - if the job does not exist.
   *
   * function flow:
   * 1. verify the job's existence.
   * 2. fetch applicants from the database.
   * 3. retrieve profile details for each applicants.
   * 4. map profile data to DTO and return.
   */
  async getJobApplicants(
    userId: string,
    jobId: string,
    page: number,
    limit: number,
  ): Promise<GetUserDto[]> {
    try {
      const job = await this.jobModel
        .findById(new Types.ObjectId(jobId))
        .lean();
      if (!job) {
        throw new NotFoundException('Job not found.');
      }
      if (!(await this.checkAccess(userId, job.company_id.toString()))) {
        throw new ForbiddenException(
          'Logged in user does not have management access or employer access to this job posting.',
        );
      }
      const skip = (page - 1) * limit;
      const applicants = await this.applicationModel.aggregate([
        {
          $match: {
            job_id: new Types.ObjectId(jobId),
          },
        },
        {
          $lookup: {
            from: 'Profiles',
            localField: 'user_id',
            foreignField: '_id',
            as: 'profile',
          },
        },
        { $unwind: '$profile' },
        { $sort: { crapplied_at: -1, _id: 1 } },
        { $skip: skip },
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
      return applicants.map(toGetUserDto);
    } catch (error) {
      handleError(error, 'Failed to retrieve job applicants.');
    }
  }

  async getJobs(
    userId: string,
    filters: any,
    page: number,
    limit: number,
  ): Promise<{
    jobs: GetJobDto[];
    totalItems: number;
    totalPages: number;
    currentPage: number;
  }> {
    try {
      const query: any = {};

      if (filters.keyword) {
        query.position = { $regex: filters.keyword, $options: 'i' };
      }
      if (filters.location) {
        query.location = { $regex: filters.location, $options: 'i' };
      }
      if (filters.industry) {
        const companies = await this.companyModel
          .find({ industry: { $regex: filters.industry, $options: 'i' } })
          .select('_id')
          .lean();
        query.company_id = { $in: companies.map((c) => c._id) };
      }
      if (filters.experienceLevel) {
        query.experience_level = filters.experienceLevel;
      }
      if (filters.company) {
        const companies = await this.companyModel
          .find({ name: { $regex: filters.company, $options: 'i' } })
          .select('_id')
          .lean();
        query.company_id = { $in: companies.map((c) => c._id) };
      }
      if (filters.minSalary || filters.maxSalary) {
        query.salary = {};
        if (filters.minSalary !== undefined)
          query.salary.$gte = parseFloat(filters.minSalary);
        if (filters.maxSalary !== undefined)
          query.salary.$lte = parseFloat(filters.maxSalary);
      }

      const totalItems = await this.jobModel.countDocuments(query);
      const totalPages = Math.ceil(totalItems / limit);
      const skip = (page - 1) * limit;

      const jobs = await this.jobModel
        .find(query)
        .skip(skip)
        .limit(limit)
        .lean();

      const jobDtos: GetJobDto[] = [];
      for (const job of jobs) {
        const company = await this.companyModel.findById(job.company_id).lean();
        const jobDto = toGetJobDto(job);
        jobDto.companyName = company?.name || null;
        jobDto.companyLogo = company?.logo || null;
        jobDto.companyLocation = company?.address || null;
        jobDto.companyDescription = company?.description || null;
        jobDto.isSaved =
          job.saved_by?.some((id) => id.toString() === userId) || false;
        jobDtos.push(jobDto);
      }

      return {
        jobs: jobDtos,
        totalItems,
        totalPages,
        currentPage: page,
      };
    } catch (error) {
      handleError(error, 'Failed to retrieve jobs.');
    }
  }

  async saveJob(userId: string, jobId: string): Promise<void> {
    try {
      const job = await this.jobModel.findById(new Types.ObjectId(jobId));
      if (!job) {
        throw new NotFoundException('Job not found.');
      }

      await this.jobModel.updateOne(
        { _id: new Types.ObjectId(jobId) },
        { $addToSet: { saved_by: new Types.ObjectId(userId) } },
      );
    } catch (error) {
      handleError(error, 'Failed to save job.');
    }
  }

  async unsaveJob(userId: string, jobId: string): Promise<void> {
    try {
      const job = await this.jobModel.findById(new Types.ObjectId(jobId));
      if (!job) {
        throw new NotFoundException('Job not found.');
      }

      await this.jobModel.updateOne(
        { _id: new Types.ObjectId(jobId) },
        { $pull: { saved_by: new Types.ObjectId(userId) } },
      );
    } catch (error) {
      handleError(error, 'Failed to unsave job.');
    }
  }

  async deleteJob(userId: string, jobId: string): Promise<void> {
    try {
      const job = await this.jobModel.findById(new Types.ObjectId(jobId));
      if (!job) {
        throw new NotFoundException('Job not found.');
      }

      const hasAccess = await this.checkAccess(
        userId,
        job.company_id.toString(),
      );
      if (!hasAccess) {
        throw new ForbiddenException(
          'You do not have permission to delete this job.',
        );
      }

      // Delete all applications associated with the job
      await this.applicationModel.deleteMany({
        job_id: new Types.ObjectId(jobId),
      });

      await this.jobModel.deleteOne({ _id: new Types.ObjectId(jobId) });
    } catch (error) {
      handleError(error, 'Failed to delete job.');
    }
  }

  async getSavedJobs(
    userId: string,
    page: number,
    limit: number,
  ): Promise<{
    jobs: GetJobDto[];
    totalItems: number;
    totalPages: number;
    currentPage: number;
  }> {
    try {
      const query = { saved_by: { $in: [new Types.ObjectId(userId)] } };

      const totalItems = await this.jobModel.countDocuments(query);
      const totalPages = Math.ceil(totalItems / limit);
      const skip = (page - 1) * limit;

      const jobs = await this.jobModel
        .find(query)
        .skip(skip)
        .limit(limit)
        .lean();

      const jobDtos: GetJobDto[] = [];
      for (const job of jobs) {
        const company = await this.companyModel.findById(job.company_id).lean();
        const jobDto = toGetJobDto(job);
        jobDto.companyName = company?.name || null;
        jobDto.companyLogo = company?.logo || null;
        jobDto.companyLocation = company?.address || null;
        jobDto.companyDescription = company?.description || null;
        jobDto.isSaved = true;
        jobDtos.push(jobDto);
      }

      return {
        jobs: jobDtos,
        totalItems,
        totalPages,
        currentPage: page,
      };
    } catch (error) {
      handleError(error, 'Failed to retrieve saved jobs.');
    }
  }

  async addApplication(
    userId: string,
    applyJobDto: ApplyJobDto,
  ): Promise<void> {
    try {
      const { jobId, phoneNumber, resumeURL } = applyJobDto;

      const job = await this.jobModel.findById(new Types.ObjectId(jobId));
      if (!job) {
        throw new NotFoundException('Job not found.');
      }

      const existingApplication = await this.applicationModel.findOne({
        user_id: new Types.ObjectId(userId),
        job_id: new Types.ObjectId(jobId),
      });

      if (existingApplication) {
        throw new ForbiddenException('You have already applied for this job.');
      }

      const userProfile = await this.profileModel.findById(
        new Types.ObjectId(userId),
      );
      if (!userProfile) {
        throw new NotFoundException('User profile not found.');
      }

      if (!userProfile.is_premium) {
        if (userProfile.plan_statistics.application_count <= 0) {
          throw new ForbiddenException(
            'You have reached your application limit. Upgrade to premium to apply for more jobs.',
          );
        }

        await this.profileModel.updateOne(
          { _id: new Types.ObjectId(userId) },
          { $inc: { 'plan_statistics.application_count': -1 } },
        );
      }

      const newApplication = new this.applicationModel({
        _id: new Types.ObjectId(),
        user_id: new Types.ObjectId(userId),
        job_id: new Types.ObjectId(jobId),
        phone_number: phoneNumber,
        resume_url: resumeURL,
        status: 'Pending',
        applied_at: new Date().toISOString(),
      });

      await newApplication.save();

      await this.jobModel.updateOne(
        { _id: new Types.ObjectId(jobId) },
        { $inc: { applicants: 1 } },
      );
    } catch (error) {
      handleError(error, 'Failed to apply for the job.');
    }
  }

  async getAppliedApplications(
    userId: string,
    page: number,
    limit: number,
  ): Promise<{
    applications: ApplicationDto[];
    totalItems: number;
    totalPages: number;
    currentPage: number;
  }> {
    try {
      console.log(`Fetching applied applications for user: ${userId}`);
      console.log(`Pagination - Page: ${page}, Limit: ${limit}`);

      const skip = (page - 1) * limit;

      const [applications, totalItems] = await Promise.all([
        this.applicationModel
          .find({ user_id: new Types.ObjectId(userId) })
          .sort({ applied_at: -1 }) // Sort by applied date (descending)
          .skip(skip)
          .limit(limit)
          .populate(
            'profile',
            'first_name last_name email profile_picture headline',
          ) // Populate profile details
          .lean(),
        this.applicationModel.countDocuments({
          user_id: new Types.ObjectId(userId),
        }),
      ]);

      console.log(`Total applications found: ${totalItems}`);
      console.log(`Applications fetched: ${applications.length}`);

      const totalPages = Math.ceil(totalItems / limit);
      const applicationDtos = applications.map(toApplicationDto);

      console.log(`Mapped applications to DTOs: ${applicationDtos.length}`);
      return {
        applications: applicationDtos,
        totalItems,
        totalPages,
        currentPage: page,
      };
    } catch (error) {
      console.error(
        `Error fetching applied applications for user: ${userId}`,
        error,
      );
      handleError(error, 'Failed to retrieve applied applications.');
    }
  }
}
