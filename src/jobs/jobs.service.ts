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
import { PostJobDto } from './dtos/post-job.dto';
import { GetJobDto } from './dtos/get-job.dto';
import { toGetJobDto, toPostJobSchema } from './mappers/job.mapper';
import { toGetUserDto } from '../common/mappers/follower.mapper';
import { GetUserDto } from '../common/dtos/get-user.dto';
import { handleError } from '../common/utils/exception-handler';
import { profile } from 'console';

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
  ) {}

  async checkAccess(userId: string, companyId: string) {
    const allowedManager = await this.companyManagerModel
      .findOne({
        manager_id: new Types.ObjectId(userId),
        company_id: new Types.ObjectId(companyId),
      })
      .lean();
    const allowedEmployer = await this.companyEmployerModel
      .findOne({
        employer_id_id: new Types.ObjectId(userId),
        company_id: new Types.ObjectId(companyId),
      })
      .lean();
    if (allowedManager || allowedEmployer) {
      return true;
    } else {
      return false;
    }
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
      if (!this.checkAccess(userId, companyId)) {
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

  async getJob(jobId: string): Promise<GetJobDto> {
    try {
      const job = await this.jobModel
        .findById(new Types.ObjectId(jobId))
        .lean();
      if (!job) {
        throw new NotFoundException('Job not found.');
      }
      return toGetJobDto(job);
    } catch (error) {
      handleError(error, 'Failed to retrieve job details.');
    }
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
    name?: string,
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
      const applicants = await this.applicationModel
        .find({ job_id: new Types.ObjectId(jobId) })
        .sort({ applied_at: -1 })
        .select('user_id')
        .lean();
      const applicantIds = applicants.map((applicant) => applicant.user_id);
      const filter: any = { _id: { $in: applicantIds } };
      if (name) {
        filter.name = { $regex: name, $options: 'i' };
      }
      const profiles = await this.profileModel
        .find(filter)
        .select('_id name profile_picture headline')
        .lean();
      return profiles.map(toGetUserDto);
    } catch (error) {
      handleError(error, 'Failed to retrieve job applicants.');
    }
  }
}
