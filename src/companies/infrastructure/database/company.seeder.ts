import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Company, CompanyDocument } from './company.schema';
import { faker } from '@faker-js/faker';
import { CompanyType } from '../company-type.enum';

@Injectable()
export class CompanySeeder {
  constructor(
    @InjectModel(Company.name) private companyModel: Model<CompanyDocument>,
  ) {}

  async seedCompanies(count: number): Promise<void> {
    const companies: Partial<CompanyDocument>[] = [];

    for (let i = 0; i < count; i++) {
      const latitude = faker.location.latitude({ max: 90, min: -90 });
      const longitude = faker.location.longitude({ max: 180, min: -180 });

      companies.push({
        name: faker.company.name(),
        verified: faker.datatype.boolean(),
        logo: faker.image.url(),
        description: faker.lorem.sentence(),
        followers: 0,
        employees: faker.number.int({ min: 1, max: 10000 }),
        company_type: faker.helpers.arrayElement([
          CompanyType.Public,
          CompanyType.SelfEmployed,
          CompanyType.Government,
          CompanyType.NonProfit,
          CompanyType.Sole,
          CompanyType.Private,
          CompanyType.Partnership,
        ]),
        industry: faker.commerce.department(),
        overview: faker.lorem.paragraph(),
        founded: faker.number.int({ min: 1900, max: new Date().getFullYear() }),
        website: faker.internet.url(),
        address: faker.location.streetAddress(),
        location: `https://www.google.com/maps?q=${latitude},${longitude}`,
        email: faker.internet.email(),
        contact_number: faker.phone.number(),
      });
    }

    await this.companyModel.insertMany(companies);
    console.log(`${count} companies seeded successfully!`);
  }

  async clearCompanies(): Promise<void> {
    await this.companyModel.deleteMany({});
    console.log('Companies collection cleared.');
  }
}
