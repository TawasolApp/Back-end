import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { faker } from '@faker-js/faker';
import { Report, ReportDocument } from '../schemas/report.schema';
import {
  User,
  UserDocument,
} from '../../../../users/infrastructure/database/schemas/user.schema';
import {
  Profile,
  ProfileDocument,
} from '../../../../profiles/infrastructure/database/schemas/profile.schema';
import {
  Company,
  CompanyDocument,
} from '../../../../companies/infrastructure/database/schemas/company.schema';
import {
  Post,
  PostDocument,
} from '../../../../posts/infrastructure/database/schemas/post.schema';
import {
  Comment,
  CommentDocument,
} from '../../../../posts/infrastructure/database/schemas/comment.schema';
import {
  Job,
  JobDocument,
} from '../../../../jobs/infrastructure/database/schemas/job.schema';
import { ReportStatus } from '../../../enums/report-status.enum';

@Injectable()
export class ReportSeeder {
  constructor(
    @InjectModel(Report.name) private reportModel: Model<ReportDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Profile.name) private profileModel: Model<ProfileDocument>,
    @InjectModel(Company.name) private companyModel: Model<CompanyDocument>,
    @InjectModel(Post.name) private postModel: Model<PostDocument>,
    @InjectModel(Comment.name) private commentModel: Model<CommentDocument>,
    @InjectModel(Job.name) private jobModel: Model<JobDocument>,
  ) {}

  async seedReports(count: number): Promise<void> {
    const users = await this.userModel.find().select('_id created_at').lean();
    const admins = await this.userModel
      .find({ role: 'admin' })
      .select('_id')
      .lean();
    const profiles = await this.profileModel.find().select('_id').lean();
    const companies = await this.companyModel.find().select('_id').lean();
    const posts = await this.postModel.find().select('_id posted_at').lean();
    const comments = await this.commentModel
      .find()
      .select('_id commented_at')
      .lean();
    const jobs = await this.jobModel.find().select('_id posted_at').lean();

    if (!users.length || !admins.length) {
      console.log('No users or admins found. Aborting report seeding.');
      return;
    }

    const userCreatedAtMap = new Map<string, Date>();
    users.forEach((user) => {
      userCreatedAtMap.set(user._id.toString(), new Date(user.created_at));
    });

    const reports: Partial<ReportDocument>[] = [];
    const reportedTypes = [
      'Profile',
      'Company',
      'Post',
      'Comment',
      'Job',
    ] as const;

    for (let i = 0; i < count; i++) {
      const reportingUser = faker.helpers.arrayElement(users);
      const type = faker.helpers.arrayElement(reportedTypes);

      let reportedId: Types.ObjectId;
      let entityCreatedAt: Date;

      switch (type) {
        case 'Profile': {
          const filteredProfiles = profiles.filter(
            (p) => p._id.toString() !== reportingUser._id.toString(),
          );
          if (!filteredProfiles.length) continue;
          const profile = faker.helpers.arrayElement(filteredProfiles);
          reportedId = profile._id;
          entityCreatedAt =
            userCreatedAtMap.get(profile._id.toString())!;
          break;
        }
        case 'Company': {
          const company = faker.helpers.arrayElement(companies);
          reportedId = company._id;
          entityCreatedAt = new Date('2025-04-10');
          break;
        }
        case 'Post': {
          const post = faker.helpers.arrayElement(posts);
          reportedId = post._id;
          entityCreatedAt = new Date(post.posted_at);
          break;
        }
        case 'Comment': {
          const comment = faker.helpers.arrayElement(comments);
          reportedId = comment._id;
          entityCreatedAt = new Date(comment.commented_at);
          break;
        }
        case 'Job': {
          const job = faker.helpers.arrayElement(jobs);
          reportedId = job._id;
          entityCreatedAt = new Date(job.posted_at);
          break;
        }
      }

      const userCreatedAt = userCreatedAtMap.get(reportingUser._id.toString())!;
      const minDate =
        userCreatedAt > entityCreatedAt ? userCreatedAt : entityCreatedAt;
      const reportedAt = faker.date.between({
        from: minDate,
        to: new Date('2025-04-10'),
      });

      const status = faker.helpers.arrayElement(Object.values(ReportStatus));

      reports.push({
        user_id: reportingUser._id,
        admin_id:
          status === ReportStatus.Pending
            ? undefined
            : faker.helpers.arrayElement(admins)._id,
        reported_id: reportedId,
        reported_type: type,
        reported_at: reportedAt,
        status,
      });
    }

    await this.reportModel.insertMany(reports);
    console.log(`${reports.length} reports seeded successfully!`);
  }

  async clearReports(): Promise<void> {
    await this.reportModel.deleteMany({});
    console.log('Reports collection cleared.');
  }
}
