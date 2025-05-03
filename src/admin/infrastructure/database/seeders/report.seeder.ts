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
  Post,
  PostDocument,
} from '../../../../posts/infrastructure/database/schemas/post.schema';
import { ReportStatus } from '../../../enums/report-status.enum';

@Injectable()
export class ReportSeeder {
  constructor(
    @InjectModel(Report.name) private reportModel: Model<ReportDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Profile.name) private profileModel: Model<ProfileDocument>,
    @InjectModel(Post.name) private postModel: Model<PostDocument>,
  ) {}

  async seedReports(count: number): Promise<void> {
    const users = await this.userModel.find().select('_id created_at').lean();
    const profiles = await this.profileModel.find().select('_id').lean();
    const posts = await this.postModel.find().select('_id posted_at').lean();

    if (!users.length || !profiles.length || !posts.length) {
      console.log('Insufficient data for seeding reports. Aborting.');
      return;
    }

    const reports: Partial<ReportDocument>[] = [];
    const reportedTypes = ['Profile', 'Post'] as const;
    const reasons = [
      'Inappropriate content',
      'Harassment',
      'Spam',
      'False information',
      'Hate speech',
    ];

    for (let i = 0; i < count; i++) {
      const reportingUser = faker.helpers.arrayElement(profiles);
      const type = faker.helpers.arrayElement(reportedTypes);

      let reportedId: Types.ObjectId;

      if (type === 'Profile') {
        const filteredProfiles = profiles.filter(
          (p) => p._id.toString() !== reportingUser._id.toString(),
        );
        if (!filteredProfiles.length) continue;
        reportedId = faker.helpers.arrayElement(filteredProfiles)._id;
      } else {
        reportedId = faker.helpers.arrayElement(posts)._id;
      }

      reports.push({
        user_id: reportingUser._id,
        reported_id: reportedId,
        reported_type: type,
        reported_at: faker.date.recent(),
        status: faker.helpers.arrayElement(Object.values(ReportStatus)),
        reason: faker.helpers.arrayElement(reasons),
      });
    }

    console.log('Seeding reports:', reports); // Log the reports being seeded
    await this.reportModel.insertMany(reports);
    console.log(`${reports.length} reports seeded successfully!`);
  }

  async clearReports(): Promise<void> {
    await this.reportModel.deleteMany({});
    console.log('Reports collection cleared.');
  }
}
