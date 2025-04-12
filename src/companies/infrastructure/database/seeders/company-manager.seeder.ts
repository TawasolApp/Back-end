import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { faker } from '@faker-js/faker';
import {
  CompanyManager,
  CompanyManagerDocument,
} from '../schemas/company-manager.schema';
import { Company, CompanyDocument } from '../schemas/company.schema';
import {
  User,
  UserDocument,
} from '../../../../users/infrastructure/database/schemas/user.schema';

@Injectable()
export class CompanyManagerSeeder {
  constructor(
    @InjectModel(CompanyManager.name)
    private companyManagerModel: Model<CompanyManagerDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Company.name) private companyModel: Model<CompanyDocument>,
  ) {}

  async seedCompanyManagers(count: number): Promise<void> {
    const managers = await this.userModel
      .find({ role: 'manager' })
      .select('_id')
      .lean();
    const companies = await this.companyModel.find().select('_id').lean();
    const users = await this.userModel.find().select('_id created_at').lean();
    const usersMap = new Map<string, Date>();

    users.forEach((user) => {
      usersMap.set(user._id.toString(), new Date(user.created_at));
    });

    if (managers.length === 0 || companies.length === 0) {
      console.log('No eligible managers or companies found. Seeding aborted.');
      return;
    }

    const existingManagers = await this.companyManagerModel
      .find()
      .select('manager_id company_id')
      .lean();
    const existingSet = new Set(
      existingManagers.map((m) => `${m.manager_id}-${m.company_id}`),
    );

    const companyManagers: Partial<CompanyManagerDocument>[] = [];

    for (let i = 0; i < count; i++) {
      const randomManager = faker.helpers.arrayElement(managers);
      const randomCompany = faker.helpers.arrayElement(companies);
      const key = `${randomManager._id}-${randomCompany._id}`;

      if (existingSet.has(key)) continue;

      const userCreatedAt = usersMap.get(randomManager._id.toString());
      if (!userCreatedAt) continue;

      const managementCreatedAt = faker.date.between({
        from: userCreatedAt,
        to: new Date('2025-04-10'),
      });

      companyManagers.push({
        manager_id: randomManager._id,
        company_id: randomCompany._id,
        created_at: managementCreatedAt.toISOString(),
      });

      existingSet.add(key);
    }

    await this.companyManagerModel.insertMany(companyManagers);
    console.log(`${count} company managers seeded successfully!`);
  }

  async clearCompanyManagers(): Promise<void> {
    await this.companyManagerModel.deleteMany({});
    console.log('CompanyManagers collection cleared.');
  }
}
