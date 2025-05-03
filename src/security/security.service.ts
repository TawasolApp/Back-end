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
