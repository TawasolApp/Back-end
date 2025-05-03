import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  User,
  UserDocument,
} from '../../../../users/infrastructure/database/schemas/user.schema';
import { faker } from '@faker-js/faker';
import {
  Application,
  ApplicationDocument,
} from '../schemas/application.schema';
import { Job, JobDocument } from '../schemas/job.schema';
import { ApplicationStatus } from '../../../enums/application-status.enum';

@Injectable()
export class ApplicationSeeder {
  constructor(
    @InjectModel(Application.name)
    private applicationModel: Model<ApplicationDocument>,
    @InjectModel(Job.name) private jobModel: Model<JobDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async seedApplications(count: number): Promise<void> {
    const users = await this.userModel
      .find({ role: 'customer' })
      .select('_id created_at')
      .lean();

    const jobs = await this.jobModel.find().select('_id posted_at').lean();

    if (users.length === 0 || jobs.length === 0) {
      console.log('No eligible users or jobs found. Seeding aborted.');
      return;
    }

    const existingApplications = await this.applicationModel
      .find()
      .select('user_id job_id')
      .lean();
    const existingSet = new Set(
      existingApplications.map((a) => `${a.user_id}-${a.job_id}`),
    );

    const applications: Partial<ApplicationDocument>[] = [];

    for (let i = 0; i < count; i++) {
      const randomUser = faker.helpers.arrayElement(users);
      const randomJob = faker.helpers.arrayElement(jobs);
      const key = `${randomUser._id}-${randomJob._id}`;

      if (existingSet.has(key)) continue;

      const userCreatedAt = new Date(randomUser.created_at);
      const jobPostedAt = new Date(randomJob.posted_at);
      const minDate = userCreatedAt > jobPostedAt ? userCreatedAt : jobPostedAt;

      const applicationCreatedAt = faker.date.between({
        from: minDate,
        to: new Date('2025-04-10'),
      });

      applications.push({
        user_id: randomUser._id,
        job_id: randomJob._id,
        status: faker.helpers.arrayElement(Object.values(ApplicationStatus)),
        applied_at: applicationCreatedAt.toISOString(),
        phone_number: faker.phone.number(),
        resume_url: faker.internet.url(),
      });

      existingSet.add(key);
    }

    await this.applicationModel.insertMany(applications);
    console.log(`${applications.length} job applications seeded successfully!`);
  }

  async clearApplications(): Promise<void> {
    await this.applicationModel.deleteMany({});
    console.log('Applications collection cleared.');
  }
}
