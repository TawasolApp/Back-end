import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Company, CompanyDocument } from './company.schema';
import { faker } from '@faker-js/faker';

@Injectable()
export class CompanySeeder {
  constructor(
    @InjectModel(Company.name) private companyModel: Model<CompanyDocument>,
  ) {}

  async seedCompanies(count: number): Promise<void> {
    const companies: Partial<CompanyDocument>[] = [];

    for (let i = 0; i < count; i++) {
      companies.push({
        name: faker.company.name(),
        logo: faker.image.url(),
        industry: faker.commerce.department(),
        description: faker.lorem.sentence(),
        founded: faker.number.int({ min: 1900, max: new Date().getFullYear() }),
        website: faker.internet.url(),
        location: faker.location.city(),
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
