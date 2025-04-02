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
import { EmploymentType, LocationType, PlanType, Visibility } from '../enums/profile-enums';

@Injectable()
export class ProfileSeeder {
  constructor(
    @InjectModel(Profile.name) private profileModel: Model<ProfileDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(UserConnection.name)
    private userConnectionModel: Model<UserConnectionDocument>,
  ) {}

  async seedProfiles(): Promise<void> {
    const users = await this.userModel
      .find({ role: { $in: ['customer', 'employer', 'manager'] } })
      .lean();

    if (users.length === 0) {
      console.log('No customer users found. Seeding aborted.');
      return;
    }

    const profiles: Partial<ProfileDocument>[] = users.map((user) => ({
      _id: user._id,
      name: `${user.first_name} ${user.last_name}`,
      profile_picture: faker.image.avatar(),
      cover_photo: faker.image.url(),
      resume: faker.internet.url(),
      headline: faker.person.jobTitle(),
      bio: faker.lorem.sentence(),
      location: faker.location.city(),
      industry: faker.commerce.department(),
      skills: [
        {
          skill_name: faker.person.jobType(),
          endorsements: [faker.helpers.arrayElement(users)._id],
        },
      ],
      education: [
        {
          _id: new this.profileModel()._id, // Generate a unique ObjectId
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
          _id: new this.profileModel()._id, // Generate a unique ObjectId
          name: faker.person.jobTitle(),
          company: faker.company.name(),
          issue_date: faker.date.past({ years: 3 }),
        },
      ],
      work_experience: [
        {
          _id: new this.profileModel()._id, // Generate a unique ObjectId
          title: faker.person.jobTitle(),
          employment_type: faker.helpers.enumValue(EmploymentType),
          company: faker.company.name(),
          start_date: faker.date.past({ years: 5 }),
          end_date: faker.datatype.boolean()
            ? faker.date.past({ years: 2 })
            : undefined,
          location: faker.location.city(),
          location_type: faker.helpers.enumValue(LocationType),
          description: faker.lorem.sentence(),
        },
      ],
      visibility: faker.helpers.enumValue(Visibility),
      connection_count: 0,
      plan_details: {
        plan_type: faker.helpers.enumValue(PlanType),
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
    }));

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
