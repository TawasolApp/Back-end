import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ReportRequestDto } from './dto/report-request.dto';

import {
  ReportDocument,
  Report,
} from '../admin/infrastructure/database/schemas/report.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Job,
  JobDocument,
} from '../jobs/infrastructure/database/schemas/job.schema';

@Injectable()
export class SecurityService {
  constructor(
    @InjectModel(Report.name)
    private readonly reportModel: Model<ReportDocument>,
    @InjectModel(Job.name)
    private readonly jobModel: Model<JobDocument>,
  ) {}
  /**
   * Creates a new report for a user or other entity.
   * @param loggedInUserId - The ID of the user creating the report.
   * @param reportRequest - DTO containing report details including:
   *   - reportedId: ID of the entity being reported
   *   - reportedType: Type of entity being reported (User, Post, etc.)
   *   - reason: Description of the issue being reported
   * @throws {InternalServerErrorException} If report creation fails
   */
  async createReport(
    loggedInUserId: Types.ObjectId,
    reportRequest: ReportRequestDto,
  ) {
    const createdReport = await this.reportModel.create({
      _id: new Types.ObjectId(),
      user_id: new Types.ObjectId(loggedInUserId),
      reported_id: new Types.ObjectId(reportRequest.reportedId),
      reported_type: reportRequest.reportedType,
      reason: reportRequest.reason,
      status: 'Pending',
      reported_at: new Date(),
    });
    if (!createdReport) {
      throw new InternalServerErrorException('Failed to create report');
    }
    return;
  }
  /**
   * Flags a job as potentially problematic by setting its is_flagged property.
   * @param jobId - The ID of the job to be flagged.
   * @throws {InternalServerErrorException} If the job update fails
   */
  async reportJob(jobId: Types.ObjectId) {
    const updatedJob = await this.jobModel.findByIdAndUpdate(
      jobId,
      { is_flagged: true },
      { new: true },
    );

    if (!updatedJob) {
      throw new InternalServerErrorException('Failed to report job');
    }

    return;
  }
}
