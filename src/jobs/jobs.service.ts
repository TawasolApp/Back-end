import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
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
import { toApplicationDto } from './mappers/application.mapper';
import { addNotification } from '../notifications/helpers/notification.helper';
import { NotificationGateway } from '../common/gateway/notification.gateway';
import {
  Notification,
  NotificationDocument,
} from '../notifications/infrastructure/database/schemas/notification.schema';
import {
  PlanDetail,
  PlanDetailDocument,
} from '../payments/infrastructure/database/schemas/plan-detail.schema';

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
    @InjectModel(Profile.name)
    private readonly profileModel: Model<ProfileDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<NotificationDocument>,
    @InjectModel(PlanDetail.name)
    private readonly planDetailModel: Model<PlanDetailDocument>,
    private readonly notificationGateway: NotificationGateway,
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

    return !!allowedManager;
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
      throw new InternalServerErrorException('Failed to add job listing.');
    }
  }
  async getJob(jobId: string, userId: string): Promise<GetJobDto> {
    try {
      const job = await this.jobModel
        .findById(new Types.ObjectId(jobId))
        .lean();

      if (!job) {
        throw new NotFoundException('Job not found');
      }

      const company = await this.companyModel.findById(job.company_id).lean();
      if (!company) {
        throw new NotFoundException('Company not found');
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
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to retrieve job details');
    }
  }
  /**
   * retrieves the list of applicants for a given job, can apply optional filter by name.
   *
   * @param jobId - ID of the job.
   * @returns array of ApplicationDto - list of applicants with profile information.
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
  ): Promise<{
    applications: ApplicationDto[];
    totalItems: number;
    totalPages: number;
    currentPage: number;
  }> {
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

      const [applications, totalItems] = await Promise.all([
        this.applicationModel
          .find({ job_id: new Types.ObjectId(jobId) })
          .sort({ applied_at: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        this.applicationModel.countDocuments({
          job_id: new Types.ObjectId(jobId),
        }),
      ]);

      const applicationDtos: ApplicationDto[] = [];
      for (const application of applications) {
        // Fetch user data
        const user = await this.userModel
          .findById(application.user_id)
          .select('first_name last_name email')
          .lean();

        // Fetch profile data
        const profile = await this.profileModel
          .findById(application.user_id)
          .select('profile_picture headline')
          .lean();

        const applicationDto = toApplicationDto(application);
        applicationDto.applicantName =
          user?.first_name && user?.last_name
            ? `${user.first_name} ${user.last_name}`
            : undefined;
        applicationDto.applicantEmail = user?.email || undefined;
        applicationDto.applicantPicture = profile?.profile_picture || undefined;
        applicationDto.applicantHeadline = profile?.headline || undefined;

        applicationDtos.push(applicationDto);
      }

      const totalPages = Math.ceil(totalItems / limit);

      return {
        applications: applicationDtos,
        totalItems,
        totalPages,
        currentPage: page,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to retrieve job applicants.',
      );
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

        const application = await this.applicationModel
          .findOne({
            job_id: job._id,
            user_id: new Types.ObjectId(userId),
          })
          .lean();
        jobDto.status = application?.status || null;

        // Ensure locationType is mapped correctly
        jobDto.locationType = job.location_type || null;

        jobDtos.push(jobDto);
      }

      return {
        jobs: jobDtos,
        totalItems,
        totalPages,
        currentPage: page,
      };
    } catch (error) {
      console.error('Error in getJobs:', error); // Add logging for debugging
      throw new InternalServerErrorException('Failed to get jobs');
    }
  }

  async saveJob(userId: string, jobId: string): Promise<void> {
    try {
      const job = await this.jobModel
        .findById(new Types.ObjectId(jobId))
        .lean();

      if (!job) {
        throw new NotFoundException('Job not found');
      }

      const updateResult = await this.jobModel.updateOne(
        { _id: new Types.ObjectId(jobId) },
        { $addToSet: { saved_by: new Types.ObjectId(userId) } },
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to save job');
    }
  }

  async unsaveJob(userId: string, jobId: string): Promise<void> {
    try {
      const job = await this.jobModel
        .findById(new Types.ObjectId(jobId))
        .lean();

      if (!job) {
        throw new NotFoundException('Job not found');
      }

      const updateResult = await this.jobModel.updateOne(
        { _id: new Types.ObjectId(jobId) },
        { $pull: { saved_by: new Types.ObjectId(userId) } },
      );

      if (updateResult.modifiedCount === 0) {
        throw new InternalServerErrorException('Failed to unsave job');
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to unsave job');
    }
  }

  async deleteJob(userId: string, jobId: string): Promise<void> {
    try {
      const job = await this.jobModel
        .findById(new Types.ObjectId(jobId))
        .lean();
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

      // Handle cases where there are no associated applications
      const deleteApplicationsResult = await this.applicationModel.deleteMany({
        job_id: new Types.ObjectId(jobId),
      });

      const deleteJobResult = await this.jobModel.deleteOne({
        _id: new Types.ObjectId(jobId),
      });

      if (deleteJobResult.deletedCount === 0) {
        throw new InternalServerErrorException('Failed to delete job.');
      }
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to delete job');
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
      throw new InternalServerErrorException('Failed to get saved jobs');
    }
  }

  async addApplication(
    userId: string,
    applyJobDto: ApplyJobDto,
  ): Promise<void> {
    const { jobId, phoneNumber, resumeURL } = applyJobDto;

    const job = await this.jobModel.findById(new Types.ObjectId(jobId)).lean();
    if (!job) {
      throw new NotFoundException('Job not found');
    }

    const existingApplication = await this.applicationModel
      .findOne({
        user_id: new Types.ObjectId(userId),
        job_id: new Types.ObjectId(jobId),
      })
      .lean();

    if (existingApplication) {
      throw new ForbiddenException('You have already applied for this job');
    }

    const userProfile = await this.profileModel
      .findById(new Types.ObjectId(userId))
      .lean();
    if (!userProfile) {
      throw new NotFoundException('User profile not found');
    }

    if (!userProfile.is_premium) {
      if (userProfile.plan_statistics.application_count <= 0) {
        throw new ForbiddenException(
          'Application limit reached. Upgrade to premium for unlimited applications',
        );
      }

      const updateResult = await this.profileModel.updateOne(
        { _id: new Types.ObjectId(userId) },
        { $inc: { 'plan_statistics.application_count': -1 } },
      );

      if (updateResult.modifiedCount === 0) {
        throw new InternalServerErrorException(
          'Failed to update application count',
        );
      }
    }

    const encodedResumeURL = encodeURIComponent(resumeURL ?? '');
    await this.applicationModel.create({
      _id: new Types.ObjectId(),
      user_id: new Types.ObjectId(userId),
      job_id: new Types.ObjectId(jobId),
      phone_number: phoneNumber,
      resume_url: encodedResumeURL,
      status: 'Pending',
      applied_at: new Date().toISOString(),
    });

    const jobUpdateResult = await this.jobModel.updateOne(
      { _id: new Types.ObjectId(jobId) },
      { $inc: { applicants: 1 } },
    );
  }

  async getAppliedApplications(
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
      const skip = (page - 1) * limit;

      const [applications, totalItems] = await Promise.all([
        this.applicationModel
          .find({ user_id: new Types.ObjectId(userId) })
          .sort({ applied_at: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        this.applicationModel.countDocuments({
          user_id: new Types.ObjectId(userId),
        }),
      ]);

      const jobIds = applications.map((application) => application.job_id);
      const jobs = await this.jobModel.find({ _id: { $in: jobIds } }).lean();

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

        const application = applications.find(
          (app) => app.job_id.toString() === job._id.toString(),
        );
        jobDto.status = application?.status || null;

        jobDtos.push(jobDto);
      }

      const totalPages = Math.ceil(totalItems / limit);

      return {
        jobs: jobDtos,
        totalItems,
        totalPages,
        currentPage: page,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to retrieve applied jobs.',
      );
    }
  }

  async updateApplicationStatus(
    userId: string,
    applicationId: string,
    status: 'Accepted' | 'Rejected',
  ): Promise<void> {
    try {
      const application = await this.applicationModel
        .findById(new Types.ObjectId(applicationId))
        .lean();
      if (!application) {
        throw new NotFoundException('Application not found');
      }

      const job = await this.jobModel.findById(application.job_id).lean();
      if (!job) {
        throw new NotFoundException('Job not found');
      }

      const hasAccess = await this.checkAccess(
        userId,
        job.company_id.toString(),
      );
      if (!hasAccess) {
        throw new ForbiddenException(
          'No permission to update this application',
        );
      }

      const updateResult = await this.applicationModel.updateOne(
        { _id: new Types.ObjectId(applicationId) },
        { $set: { status } },
      );

      if (updateResult.modifiedCount === 0) {
        throw new InternalServerErrorException(
          'Failed to update application status',
        );
      }

      const company = await this.companyModel.findById(job.company_id).lean();
      if (!company) {
        throw new NotFoundException('Company not found');
      }

      const notificationMessage =
        status === 'Accepted'
          ? `accepted your application for the position of ${job.position}.`
          : `rejected your application for the position of ${job.position}.`;

      await addNotification(
        this.notificationModel,
        new Types.ObjectId(company._id),
        new Types.ObjectId(application.user_id),
        new Types.ObjectId(job._id),
        new Types.ObjectId(application._id),
        'JobOffer',
        notificationMessage,
        new Date(),
        this.notificationGateway,
        this.profileModel,
        this.companyModel,
        this.userModel,
        this.companyManagerModel,
      );
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to update application status.',
      );
    }
  }
}
