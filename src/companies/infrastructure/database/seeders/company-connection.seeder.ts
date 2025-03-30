import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  CompanyConnection,
  CompanyConnectionDocument,
} from '../schemas/company-connection.schema';
import {
  User,
  UserDocument,
<<<<<<< HEAD:src/companies/infrastructure/database/company-connection.seeder.ts
} from '../../../users/infrastructure/database/user.schema';
import { Company, CompanyDocument } from './company.schema';
=======
} from '../../../../users/infrastructure/database/user.schema';
import { Company, CompanyDocument } from '../schemas/company.schema';
>>>>>>> feature/db-setup:src/companies/infrastructure/database/seeders/company-connection.seeder.ts
import { faker } from '@faker-js/faker';

@Injectable()
export class CompanyConnectionSeeder {
  constructor(
    @InjectModel(CompanyConnection.name)
    private companyConnectionModel: Model<CompanyConnectionDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Company.name) private companyModel: Model<CompanyDocument>,
  ) {}

  async seedCompanyConnections(count: number): Promise<void> {
    const users = await this.userModel
      .find({ role: 'customer' })
      .select('_id')
      .lean();

    const companies = await this.companyModel.find().select('_id').lean();

    if (users.length === 0 || companies.length === 0) {
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
      const randomUser = faker.helpers.arrayElement(users);
      const randomCompany = faker.helpers.arrayElement(companies);
      const key = `${randomUser._id}-${randomCompany._id}`;

      if (!existingSet.has(key)) {
        existingSet.add(key);
        companyConnections.push({
          user_id: randomUser._id,
          company_id: randomCompany._id,
        });
      }
    }

    await this.companyConnectionModel.insertMany(companyConnections);
    console.log(`${count} company connections seeded successfully!`);
  }

  async clearCompanyConnections(): Promise<void> {
    await this.companyConnectionModel.deleteMany({});
    console.log('CompanyConnections collection cleared.');
  }
}
