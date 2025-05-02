import { Injectable } from '@nestjs/common';
import { ReportRequestDto } from './dto/report-request.dto';
import { BlockedUserDto } from './dto/blocked-user.dto';
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
import {
  Profile,
  ProfileDocument,
} from '../profiles/infrastructure/database/schemas/profile.schema';

@Injectable()
export class SecurityService {
  constructor(
    @InjectModel(Report.name)
    private readonly reportModel: Model<ReportDocument>,
    @InjectModel(Job.name)
    private readonly jobModel: Model<JobDocument>,
    @InjectModel(Profile.name)
    private readonly profileModel: Model<ProfileDocument>,
  ) {
    // Inject necessary models or services here
  }
  async createReport(
    loggedInUserId: Types.ObjectId,
    reportRequest: ReportRequestDto,
  ) {
    console.log('Report Request:', reportRequest);
    await this.reportModel.create({
      _id: new Types.ObjectId(),
      user_id: new Types.ObjectId(loggedInUserId),
      reported_id: new Types.ObjectId(reportRequest.reported_id),
      reported_type: reportRequest.reported_type,
      reason: reportRequest.reason,
      status: 'Pending',
      reported_at: new Date(),
    });
    return;
  }

  async reportJob(jobId: Types.ObjectId) {
    await this.jobModel.findByIdAndUpdate(
      jobId,
      { is_flagged: true },
      { new: true },
    );

    return;
  }
}
