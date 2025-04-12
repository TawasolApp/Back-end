import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Job, JobDocument } from '../schemas/job.schema';
import { faker } from '@faker-js/faker';
import { EmploymentType } from '../../../enums/employment-type.enum';
import { LocationType } from '../../../enums/location-type.enum';
import {
  Application,
  ApplicationDocument,
} from '../schemas/application.schema';
import { ExperienceLevel } from '../../../enums/experience-level.enum';
import {
  Company,
  CompanyDocument,
} from '../../../../companies/infrastructure/database/schemas/company.schema';

@Injectable()
export class JobSeeder {
  constructor(
    @InjectModel(Job.name) private jobModel: Model<JobDocument>,
    @InjectModel(Application.name)
    private applicationModel: Model<ApplicationDocument>,
    @InjectModel(Company.name) private companyModel: Model<CompanyDocument>,
  ) {}

  async seedJobs(count: number): Promise<void> {
    const companies = await this.companyModel.find().select('_id').lean();

    if (companies.length === 0) {
      console.log('No eligible companies found. Seeding aborted.');
      return;
    }
    const jobs: Partial<JobDocument>[] = [];

    for (let i = 0; i < count; i++) {
      jobs.push({
        company_id: faker.helpers.arrayElement(companies)._id,
        position: faker.person.jobTitle(),
        salary: faker.number.int({ min: 1 }),
        experience_level: faker.helpers.arrayElement(
          Object.values(ExperienceLevel),
        ),
        description: faker.lorem.paragraph(),
        location_type: faker.helpers.arrayElement(Object.values(LocationType)),
        employment_type: faker.helpers.arrayElement(
          Object.values(EmploymentType),
        ),
        applicants: 0,
        location: faker.location.street(),
        posted_at: faker.date
          .past({
            years: 2,
            refDate: new Date('2025-04-05'),
          })
          .toISOString(),
      });
    }

    await this.jobModel.insertMany(jobs);
    console.log(`${count} jobs seeded successfully!`);
  }

  async clearJobs(): Promise<void> {
    await this.jobModel.deleteMany({});
    console.log('Jobs collection cleared.');
  }

  async updateApplicantCounts(): Promise<void> {
    const jobs = await this.jobModel.find().exec();
    for (const job of jobs) {
      const applicantCount = await this.applicationModel
        .countDocuments({ job_id: job._id })
        .exec();
      job.applicants = applicantCount;
      await job.save();
    }
    console.log('Job applicants counts updated.');
  }
}
