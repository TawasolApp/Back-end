import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { faker } from '@faker-js/faker';
import {
  CompanyConnection,
  CompanyConnectionDocument,
} from '../schemas/company-connection.schema';
import { Company, CompanyDocument } from '../schemas/company.schema';
import {
  Profile,
  ProfileDocument,
} from '../../../../profiles/infrastructure/database/schemas/profile.schema';
import {
  User,
  UserDocument,
} from '../../../../users/infrastructure/database/schemas/user.schema';

@Injectable()
export class CompanyConnectionSeeder {
  constructor(
    @InjectModel(CompanyConnection.name)
    private companyConnectionModel: Model<CompanyConnectionDocument>,
    @InjectModel(Profile.name) private profileModel: Model<ProfileDocument>,
    @InjectModel(Company.name) private companyModel: Model<CompanyDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async seedCompanyConnections(count: number): Promise<void> {
    const profiles = await this.profileModel.find().select('_id').lean();
    const companies = await this.companyModel.find().select('_id').lean();
    const users = await this.userModel.find().select('_id created_at').lean();
    const usersMap = new Map<string, Date>();

    users.forEach((user) => {
      usersMap.set(user._id.toString(), new Date(user.created_at));
    });

    if (profiles.length === 0 || companies.length === 0) {
      console.log('No eligible users or companies found. Seeding aborted.');
      return;
    }

    const existingConnections = await this.companyConnectionModel
      .find()
      .select('user_id company_id')
      .lean();
    const existingSet = new Set(
      existingConnections.map((c) => `${c.user_id}-${c.company_id}`),
    );

    const companyConnections: Partial<CompanyConnectionDocument>[] = [];

    for (let i = 0; i < count; i++) {
      const randomProfile = faker.helpers.arrayElement(profiles);
      const randomCompany = faker.helpers.arrayElement(companies);
      const key = `${randomProfile._id}-${randomCompany._id}`;

      if (existingSet.has(key)) continue;

      const userCreatedAt = usersMap.get(randomProfile._id.toString());
      if (!userCreatedAt) continue;

      const connectionCreatedAt = faker.date.between({
        from: userCreatedAt,
        to: new Date('2025-04-10'),
      });

      companyConnections.push({
        user_id: randomProfile._id,
        company_id: randomCompany._id,
        created_at: connectionCreatedAt.toISOString(),
      });

      existingSet.add(key);
    }

    await this.companyConnectionModel.insertMany(companyConnections);
    console.log(
      `${companyConnections.length} company connections seeded successfully!`,
    );
  }

  async clearCompanyConnections(): Promise<void> {
    await this.companyConnectionModel.deleteMany({});
    console.log('CompanyConnections collection cleared.');
  }
}
