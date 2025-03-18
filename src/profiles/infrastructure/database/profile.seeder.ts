import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Profile, ProfileDocument } from './profile.schema';
import {
  User,
  UserDocument,
} from '../../../auth/infrastructure/database/user.schema';
import { faker } from '@faker-js/faker';

@Injectable()
export class ProfileSeeder {
  constructor(
    @InjectModel(Profile.name) private profileModel: Model<ProfileDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async seedProfiles(count: number): Promise<void> {
    const users = await this.userModel.find().lean();

    if (users.length === 0) {
      console.log('No users found. Seeding aborted.');
      return;
    }

    for (let i = 0; i < count; i++) {
      const randomUser = users[i % users.length]; // Ensure unique user ID by cycling through users
      await this.profileModel.updateOne(
        { _id: randomUser._id },
        {
          _id: randomUser._id,
          name: `${randomUser.first_name} ${randomUser.last_name}`, // Correctly concatenate first and last name
          profile_picture: faker.image.avatar(),
          cover_photo: faker.image.url(),
          resume: faker.internet.url(),
          headline: faker.person.jobTitle(),
          bio: faker.lorem.sentence(),
          location: faker.location.city(),
          industry: faker.commerce.department(),
          skill: [
            {
              skill_name: faker.person.jobType(),
              endorsements: [faker.helpers.arrayElement(users)._id],
            },
          ],
          education: [
            {
              school: faker.company.name(),
              degree: faker.person.jobTitle(),
              field: faker.commerce.department(),
              start_date: faker.date.past({ years: 10 }),
              end_date: faker.datatype.boolean()
                ? faker.date.past({ years: 5 })
                : undefined,
              grade: faker.helpers.arrayElement(['A', 'B', 'C']),
              description: faker.lorem.sentence(),
            },
          ],
          certification: [
            {
              name: faker.person.jobTitle(),
              company: faker.company.name(),
              issue_date: faker.date.past({ years: 3 }),
            },
          ],
          work_experience: [
            {
              title: faker.person.jobTitle(),
              employment_type: faker.helpers.arrayElement([
                'full_time',
                'part_time',
                'self_employed',
                'freelance',
                'contract',
                'internship',
                'apprenticeship',
              ]),
              company: faker.company.name(),
              start_date: faker.date.past({ years: 5 }),
              end_date: faker.datatype.boolean()
                ? faker.date.past({ years: 2 })
                : undefined,
              location: faker.location.city(),
              location_type: faker.helpers.arrayElement([
                'on_site',
                'hybrid',
                'remote',
              ]),
              description: faker.lorem.sentence(),
            },
          ],
          visibility: faker.helpers.arrayElement([
            'public',
            'private',
            'connections_only',
          ]),
          connection_count: faker.number.int({ min: 0, max: 500 }),
          plan_details: {
            plan_type: faker.helpers.arrayElement(['monthly', 'yearly']),
            start_date: faker.date.past({ years: 1 }),
            expiry_date: faker.date.future({ years: 1 }),
            auto_renewal: faker.datatype.boolean(),
            cancel_date: faker.datatype.boolean()
              ? faker.date.past({ years: 1 })
              : undefined,
          },
          plan_statistics: {
            message_count: faker.number.int({ min: 0, max: 1000 }),
            application_count: faker.number.int({ min: 0, max: 100 }),
          },
        },
        { upsert: true },
      );
    }

    console.log(`${count} profiles seeded successfully!`);
  }

  async clearProfiles(): Promise<void> {
    await this.profileModel.deleteMany({});
    console.log('Profiles collection cleared.');
  }
}
