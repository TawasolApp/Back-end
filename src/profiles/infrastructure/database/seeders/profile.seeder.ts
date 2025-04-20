import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Profile, ProfileDocument } from '../schemas/profile.schema';
import {
  User,
  UserDocument,
} from '../../../../users/infrastructure/database/schemas/user.schema';
import {
  UserConnection,
  UserConnectionDocument,
} from '../../../../connections/infrastructure/database/schemas/user-connection.schema';
import { faker } from '@faker-js/faker';
import { ConnectionStatus } from '../../../../connections/enums/connection-status.enum';
import {
  EmploymentType,
  LocationType,
  PlanType,
  Visibility,
} from '../../../enums/profile-enums';
import {
  Company,
  CompanyDocument,
} from '../../../../companies/infrastructure/database/schemas/company.schema';

@Injectable()
export class ProfileSeeder {
  constructor(
    @InjectModel(Profile.name) private profileModel: Model<ProfileDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(UserConnection.name)
    private userConnectionModel: Model<UserConnectionDocument>,
    @InjectModel(Company.name) private companyModel: Model<CompanyDocument>,
  ) {}

  async seedProfiles(): Promise<void> {
    const users = await this.userModel
      .find({ role: { $in: ['customer', 'employer', 'manager'] } })
      .lean();

    if (users.length === 0) {
      console.log('No customer users found. Seeding aborted.');
      return;
    }

    const companies = await this.companyModel.find().lean();
    if (companies.length === 0) {
      console.log('No companies found. Seeding aborted.');
      return;
    }

    const profiles: Partial<ProfileDocument>[] = users.map((user) => {
      const skillCount = faker.number.int({ min: 0, max: 10 });
      const educationCount = faker.number.int({ min: 1, max: 3 });
      const certificationCount = faker.number.int({ min: 0, max: 3 });
      const experienceCount = faker.number.int({ min: 1, max: 3 });

      return {
        _id: user._id,
        first_name: user.first_name,
        last_name: user.last_name,
        profile_picture: faker.image.avatar(),
        cover_photo: faker.image.url(),
        resume: faker.internet.url(),
        headline: faker.person.jobTitle(),
        bio: faker.lorem.sentence(),
        location: faker.location.city(),
        industry: faker.commerce.department(),
        skills: Array.from({ length: skillCount }, () => {
          const availableEndorsers = users.filter(
            (u) => !u._id.equals(user._id),
          );
          const selectedEndorsers = faker.helpers.arrayElements(
            availableEndorsers,
            { min: 0, max: Math.min(5, availableEndorsers.length) },
          );
          return {
            skill_name: faker.word.adverb(),
            position: faker.company.name(),
            endorsements: selectedEndorsers.map((e) => e._id),
          };
        }),

        education: Array.from({ length: educationCount }, () => {
          const company = faker.helpers.arrayElement(companies);
          const start = faker.date.between({
            from: user.created_at,
            to: new Date('2025-04-10'),
          });
          const end = faker.datatype.boolean()
            ? faker.date.between({
                from: start,
                to: new Date('2025-04-10'),
              })
            : undefined;
          return {
            _id: new this.profileModel()._id,
            school: company.name,
            degree: faker.person.jobTitle(),
            field: faker.commerce.department(),
            start_date: start,
            end_date: end,
            grade: faker.helpers.arrayElement(['A', 'B', 'C']),
            description: faker.lorem.sentence(),
            company_id: company._id,
            company_logo: company.logo,
          };
        }),

        certification: Array.from({ length: certificationCount }, () => {
          const company = faker.helpers.arrayElement(companies);
          return {
            _id: new this.profileModel()._id,
            name: faker.person.jobTitle(),
            company: company.name,
            company_id: company._id,
            company_logo: company.logo,
            issue_date: faker.date.past({ years: 3 }),
            expiry_date: faker.date.future({ years: 1 }),
          };
        }),

        work_experience: Array.from({ length: experienceCount }, () => {
          const company = faker.helpers.arrayElement(companies);
          const start = faker.date.between({
            from: user.created_at,
            to: new Date('2025-04-10'),
          });
          const end = faker.datatype.boolean()
            ? faker.date.between({
                from: start,
                to: new Date('2025-04-10'),
              })
            : undefined;
          return {
            _id: new this.profileModel()._id,
            title: faker.person.jobTitle(),
            company_id: company._id,
            company_logo: company.logo,
            employment_type: faker.helpers.enumValue(EmploymentType),
            company: company.name,
            start_date: start,
            end_date: end,
            location: faker.location.city(),
            location_type: faker.helpers.enumValue(LocationType),
            description: faker.lorem.sentence(),
          };
        }),
        visibility: faker.helpers.enumValue(Visibility),
        connection_count: 0,
        plan_statistics: {
          message_count: faker.number.int({ min: 0, max: 1000 }),
          application_count: faker.number.int({ min: 0, max: 100 }),
        },
      };
    });

    await this.profileModel.insertMany(profiles, { ordered: false });
    console.log(`${profiles.length} profiles seeded successfully!`);
  }

  async clearProfiles(): Promise<void> {
    await this.profileModel.deleteMany({});
    console.log('Profiles collection cleared.');
  }

  async updateConnectionCounts(): Promise<void> {
    const profiles = await this.profileModel.find().exec();
    for (const profile of profiles) {
      const connectionCount = await this.userConnectionModel
        .countDocuments({
          status: ConnectionStatus.Connected,
          $or: [
            { sending_party: profile._id },
            { receiving_party: profile._id },
          ],
        })
        .exec();

      profile.connection_count = connectionCount;
      await profile.save();
    }
    console.log('Profile connection counts updated.');
  }
}
