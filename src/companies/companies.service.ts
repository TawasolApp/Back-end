import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Company,
  CompanyDocument,
} from './infrastructure/database/company.schema';
import {
  CompanyConnection,
  CompanyConnectionDocument,
} from './infrastructure/database/company-connection.schema';
import {
  Profile,
  ProfileDocument,
} from '../profiles/infrastructure/database/profile.schema';

@Injectable()
export class CompaniesService {
  constructor(
    @InjectModel(Company.name)
    private readonly companyModel: Model<CompanyDocument>,
    @InjectModel(CompanyConnection.name)
    private readonly companyConnectionModel: Model<CompanyConnectionDocument>,
    @InjectModel(Profile.name)
    private readonly profileModel: Model<ProfileDocument>,
  ) {}

  async createCompany(companyData: Partial<Company>) {
    try {
      const newCompany = new this.companyModel({
        _id: new Types.ObjectId(),
        ...companyData,
      });
      return await newCompany.save();
    } catch (error) {
      throw new InternalServerErrorException('Failed to save connection.');
    }
  }

  async updateCompany(companyId: string, updateData: Partial<Company>) {
    try {
      if (!Types.ObjectId.isValid(companyId)) {
        throw new BadRequestException('Invalid company ID format.');
      }
      const existingCompany = await this.companyModel
        .findById(new Types.ObjectId(companyId))
        .lean();
      if (!existingCompany) {
        throw new NotFoundException('Company not found.');
      }
      const updatedCompany = await this.companyModel.findByIdAndUpdate(
        companyId,
        { $set: updateData },
        { new: true },
      );
      return updatedCompany;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to update company details.',
      );
    }
  }

  async getCompanies(industry: string): Promise<CompanyDocument[]> {
    const companies = await this.companyModel
      .find({
        industry: industry,
      })
      .select('_id name logo followers description')
      .lean();
    return companies;
  }

  // ✅ Get company details
  async getCompanyDetails(companyId: string): Promise<CompanyDocument> {
    const company = await this.companyModel.findById(companyId).exec();
    if (!company) {
      throw new NotFoundException(`Company with ID ${companyId} not found.`);
    }
    return company;
  }

  // ✅ Get company followers (Dummy Implementation)
  async getCompanyFollowers(companyId: string): Promise<any[]> {
    return [
      {
        userId: '123',
        username: 'John Doe',
        profilePicture: 'https://example.com/johndoe.jpg',
        headline: 'Software Engineer',
      },
      {
        userId: '124',
        username: 'Jane Doe',
        profilePicture: 'https://example.com/janedoe.jpg',
        headline: 'Marketing Manager',
      },
    ];
  }
}
