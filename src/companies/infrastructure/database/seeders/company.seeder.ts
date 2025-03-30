import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Company, CompanyDocument } from '../schemas/company.schema';
import { faker } from '@faker-js/faker';
import { CompanyType } from '../../../enums/company-type.enum';
import { CompanySize } from '../../../enums/company-size.enum';
import {
  CompanyConnection,
  CompanyConnectionDocument,
} from '../schemas/company-connection.schema';

@Injectable()
export class CompanySeeder {
  constructor(
    @InjectModel(Company.name) private companyModel: Model<CompanyDocument>,
    @InjectModel(CompanyConnection.name)
    private companyConnectionModel: Model<CompanyConnectionDocument>,
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
        banner: faker.image.url(),
        description: faker.lorem.sentence(),
        followers: 0,
        company_size: faker.helpers.arrayElement([
          CompanySize.Mini,
          CompanySize.Small,
          CompanySize.Medium,
          CompanySize.Large,
        ]),
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

  async updateFollowerCounts(): Promise<void> {
    const companies = await this.companyModel.find().exec();
    for (const company of companies) {
      const followerCount = await this.companyConnectionModel
        .countDocuments({ company_id: company._id })
        .exec();
      company.followers = followerCount;
      await company.save();
    }
    console.log('Company follower counts updated.');
  }
}
