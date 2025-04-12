import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { faker } from '@faker-js/faker';
import {
  CompanyEmployer,
  CompanyEmployerDocument,
} from '../schemas/company-employer.schema';
import {
  Company,
  CompanyDocument,
} from '../../../../companies/infrastructure/database/schemas/company.schema';
import {
  User,
  UserDocument,
} from '../../../../users/infrastructure/database/schemas/user.schema';

@Injectable()
export class CompanyEmployerSeeder {
  constructor(
    @InjectModel(CompanyEmployer.name)
    private companyEmployerModel: Model<CompanyEmployerDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Company.name) private companyModel: Model<CompanyDocument>,
  ) {}

  async seedCompanyEmployers(count: number): Promise<void> {
    const employers = await this.userModel
      .find({ role: 'employer' })
      .select('_id')
      .lean();
    const companies = await this.companyModel.find().select('_id').lean();
    const users = await this.userModel.find().select('_id created_at').lean();
    const usersMap = new Map<string, Date>();

    users.forEach((user) => {
      usersMap.set(user._id.toString(), new Date(user.created_at));
    });

    if (employers.length === 0 || companies.length === 0) {
      console.log('No eligible employers or companies found. Seeding aborted.');
      return;
    }

    const existingEmployers = await this.companyEmployerModel
      .find()
      .select('employer_id company_id')
      .lean();
    const existingSet = new Set(
      existingEmployers.map((e) => `${e.employer_id}-${e.company_id}`),
    );

    const companyEmployers: Partial<CompanyEmployerDocument>[] = [];

    for (let i = 0; i < count; i++) {
      const randomEmployer = faker.helpers.arrayElement(employers);
      const randomCompany = faker.helpers.arrayElement(companies);
      const key = `${randomEmployer._id}-${randomCompany._id}`;

      if (existingSet.has(key)) continue;

      const userCreatedAt = usersMap.get(randomEmployer._id.toString());
      if (!userCreatedAt) continue;

      const employementCreatedAt = faker.date.between({
        from: userCreatedAt,
        to: new Date('2025-04-10'),
      });

      companyEmployers.push({
        employer_id: randomEmployer._id,
        company_id: randomCompany._id,
        created_at: employementCreatedAt.toISOString(),
      });

      existingSet.add(key);
    }

    await this.companyEmployerModel.insertMany(companyEmployers);
    console.log(`${count} company employers seeded successfully!`);
  }

  async clearCompanyEmployers(): Promise<void> {
    await this.companyEmployerModel.deleteMany({});
    console.log('CompanyEmployers collection cleared.');
  }
}
