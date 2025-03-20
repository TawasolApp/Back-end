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
      throw new InternalServerErrorException('Failed to create company.');
    }
  }

  async updateCompany(companyId: string, updateData: Partial<Company>) {
    try {
      if (!Types.ObjectId.isValid(companyId)) {
        console.log('ID');
        throw new BadRequestException('Invalid company ID format.');
      }
      if (!Object.keys(updateData).length) {
        throw new BadRequestException('No update data provided.');
      }
      const existingCompany = await this.companyModel
        .findById(new Types.ObjectId(companyId))
        .lean();
      console.log('exist');
      if (!existingCompany) {
        console.log('not found');
        throw new NotFoundException('Company not found.');
      }
      const updatedCompany = await this.companyModel.findByIdAndUpdate(
        companyId,
        { $set: updateData },
        { new: true },
      );
      console.log('update');
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

  async getCompanyDetails(companyId: string): Promise<CompanyDocument> {
    try {
      if (!Types.ObjectId.isValid(companyId)) {
        throw new BadRequestException('Invalid company ID format.');
      }
      const company = await this.companyModel
        .findById(new Types.ObjectId(companyId))
        .lean();
      if (!company) {
        throw new NotFoundException('Company not found.');
      }
      return company;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to get company details.');
    }
  }

  async getCompanyFollowers(companyId: string): Promise<any[]> {
    try {
      if (!Types.ObjectId.isValid(companyId)) {
        throw new BadRequestException('Invalid company ID format.');
      }
      const company = await this.companyModel
        .findById(new Types.ObjectId(companyId))
        .lean();
      if (!company) {
        throw new NotFoundException('Company not found.');
      }
      const followers = await this.companyConnectionModel
        .find({ company_id: new Types.ObjectId(companyId) })
        .select('user_id')
        .lean();

      const result = await Promise.all(
        followers.map(async (follower) => {
          const userId = follower.user_id;

          const profile = await this.profileModel
            .findById(userId)
            .select('name profile_picture headline')
            .lean();

          return {
            userId: profile?._id,
            username: profile?.name,
            profilePicture: profile?.profile_picture,
            headline: profile?.headline,
          };
        }),
      );
      return result;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to get company followers.',
      );
    }
  }

  async followCompany(userId: string, companyId: string) {
    try {
      const newFollow = new this.companyConnectionModel({
        _id: new Types.ObjectId(),
        user_id: new Types.ObjectId(userId),
        company_id: new Types.ObjectId(companyId),
      });
      return await newFollow.save();
    } catch (error) {
      throw new InternalServerErrorException('Failed to create company.');
    }
  }
}
