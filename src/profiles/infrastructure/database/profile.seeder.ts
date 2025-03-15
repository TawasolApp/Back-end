import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Profile, ProfileDocument } from './profile.schema';
import { faker } from '@faker-js/faker';

@Injectable()
export class ProfileSeeder {
  constructor(@InjectModel(Profile.name) private profileModel: Model<Profile>) {}

  async seedProfiles(count: number): Promise<void> {
    const profiles: Partial<ProfileDocument>[] = []; // 👈 Explicitly define the type

    for (let i = 0; i < count; i++) {
      profiles.push({
        _id: new Types.ObjectId(),
        username: faker.internet.username(),
        profile_picture: faker.image.avatar(),
        cover_photo: faker.image.urlPicsumPhotos(),
        resume: faker.internet.url(),
        headline: faker.person.jobTitle(),
        bio: faker.lorem.sentence(),
        location: faker.location.city(),
        industry: faker.commerce.department(),
        skill: [
          {
            skill_name: faker.hacker.verb(),
            endorsements: [new Types.ObjectId(), new Types.ObjectId()],
          },
        ],
        education: [
          {
            school: faker.company.name(),
            degree: faker.lorem.word(),
            field: faker.lorem.word(),
            start_date: faker.date.past(),
            end_date: faker.date.past(),
            grade: faker.lorem.word(),
            description: faker.lorem.sentence(),
          },
        ],
        certification: [
          {
            name: faker.lorem.word(),
            company: faker.company.name(),
            issue_date: faker.date.past(),
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
            start_date: faker.date.past(),
            end_date: faker.date.past(),
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
          start_date: faker.date.past(),
          expiry_date: faker.date.future(),
          auto_renewal: faker.datatype.boolean(),
          cancel_date: undefined
        },
        plan_statistics: {
          message_count: faker.number.int({ min: 0, max: 1000 }),
          application_count: faker.number.int({ min: 0, max: 100 }),
        },
      });
    }

    await this.profileModel.insertMany(profiles);
    console.log(`${count} profiles seeded successfully!`);
  }

  async clearProfiles(): Promise<void> {
    await this.profileModel.deleteMany({});
    console.log('Profiles collection cleared.');
  }
}
