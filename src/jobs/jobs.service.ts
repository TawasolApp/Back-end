import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Job, JobDocument } from './infrastructure/database/schemas/job.schema';
import {
  Application,
  ApplicationDocument,
} from './infrastructure/database/schemas/application.schema';
import {
  Company,
  CompanyDocument,
} from '../companies/infrastructure/database/schemas/company.schema';
import {
  Profile,
  ProfileDocument,
} from '../profiles/infrastructure/database/schemas/profile.schema';
import { PostJobDto } from './dtos/post-job.dto';
import { GetJobDto } from './dtos/get-job.dto';
import { toGetJobDto, toPostJobSchema } from './mappers/job.mapper';
import { toGetFollowerDto } from '../companies/mappers/follower.mapper';
import { GetFollowerDto } from 'src/companies/dtos/get-follower.dto';

@Injectable()
export class JobsService {
  constructor(
    @InjectModel(Job.name) private readonly jobModel: Model<JobDocument>,
    @InjectModel(Application.name)
    private readonly applicationModel: Model<ApplicationDocument>,
    @InjectModel(Company.name)
    private readonly companyModel: Model<CompanyDocument>,
    @InjectModel(Profile.name)
    private readonly profileModel: Model<ProfileDocument>,
  ) {}

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
  async postJob(companyId: string, postJobDto: PostJobDto): Promise<GetJobDto> {
    const existingCompany = await this.companyModel
      .findById(new Types.ObjectId(companyId))
      .lean();
    if (!existingCompany) {
      throw new NotFoundException('Company not found.');
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
  }

  async getJob(jobId: string): Promise<GetJobDto> {
    const job = await this.jobModel.findById(new Types.ObjectId(jobId)).lean();
    if (!job) {
      throw new NotFoundException('Job not found.');
    }
    return toGetJobDto(job);
  }

    /**
   * retrieves the list of applicants for a given job.
   *
   * @param jobId - ID of the job.
   * @returns array of GetFollowerDto - list of applicants with profile information.
   * @throws NotFoundException - if the job does not exist.
   *
   * function flow:
   * 1. verify the job's existence.
   * 2. fetch applicants from the database.
   * 3. retrieve profile details for each applicants.
   * 4. map profile data to DTO and return.
   */
  async getJobApplicants(jobId: string): Promise<GetFollowerDto[]> {
    const job = await this.jobModel.findById(new Types.ObjectId(jobId)).lean();
    if (!job) {
      throw new NotFoundException('Job not found.');
    }
    const applicants = await this.applicationModel
      .find({ job_id: new Types.ObjectId(jobId) })
      .select('user_id')
      .lean();
    const result = await Promise.all(
      applicants.map(async (applicant) => {
        const userId = applicant.user_id;
        const profile = await this.profileModel
          .findById(userId)
          .select('_id name profile_picture headline')
          .lean();
        return toGetFollowerDto(profile!);
      }),
    );
    return result;
  }
}
