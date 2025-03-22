import {
  BadRequestException,
  ConflictException,
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
      const existingName = await this.companyModel
        .findOne({ name: companyData.name })
        .lean();
      if (existingName) {
        throw new ConflictException(
          `The name "${companyData.name}" is already in use by another company.`,
        );
      }
      const newCompany = new this.companyModel({
        _id: new Types.ObjectId(),
        followers: 0,
        verified: false,
        ...companyData,
      });
      return await newCompany.save();
    } catch (error) {
      throw error;
    }
  }

  async updateCompany(companyId: string, updateData: Partial<Company>) {
    try {
      const existingCompany = await this.companyModel
        .findById(new Types.ObjectId(companyId))
        .lean();
      if (!existingCompany) {
        throw new NotFoundException('Company not found.');
      }
      const existingName = await this.companyModel
        .findOne({ name: updateData.name })
        .lean();
      if (existingName) {
        throw new ConflictException(
          `The name "${updateData.name}" is already in use by another company.`,
        );
      }
      const updatedCompany = await this.companyModel.findByIdAndUpdate(
        companyId,
        { $set: updateData },
        { new: true },
      );
      if (!updatedCompany) {
        throw new InternalServerErrorException(
          'Failed to update company details.',
        );
      }
      return updatedCompany;
    } catch (error) {
      throw error;
    }
  }

  async deleteCompany(companyId: string) {
    await this.companyModel
      .findByIdAndDelete(new Types.ObjectId(companyId))
      .lean();
    return;
  }

  async filterCompanies(
    name?: string,
    industry?: string,
  ): Promise<CompanyDocument[]> {
    const filter: any = {};
    if (name) {
      filter.name = { $regex: name, $options: 'i' };
    }
    if (industry) {
      filter.industry = { $regex: industry, $options: 'i' };
    }
    const companies = await this.companyModel
      .find(filter)
      .select('_id name logo industry followers')
      .lean();
    return companies;
  }

  async getCompanyDetails(companyId: string): Promise<CompanyDocument> {
    try {
      const company = await this.companyModel
        .findById(new Types.ObjectId(companyId))
        .lean();
      if (!company) {
        throw new NotFoundException('Company not found.');
      }
      return company;
    } catch (error) {
      throw error;
    }
  }

  async getCompanyFollowers(companyId: string): Promise<any[]> {
    try {
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
            .select('_id name profile_picture headline')
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
      throw error;
    }
  }

  async followCompany(userId: string, companyId: string) {
    try {
      const newFollow = new this.companyConnectionModel({
        _id: new Types.ObjectId(),
        user_id: new Types.ObjectId(userId),
        company_id: new Types.ObjectId(companyId),
      });
      await newFollow.save();
      await this.companyModel.findByIdAndUpdate(
        companyId,
        { $inc: { followers: 1 } },
        { new: true },
      );
    } catch (error) {
      throw error;
    }
  }

  async unfollowCompany(userId: string, companyId: string) {
    try {
      const deletedFollow = await this.companyConnectionModel.findOneAndDelete({
        user_id: new Types.ObjectId(userId),
        company_id: new Types.ObjectId(companyId),
      });
      if (!deletedFollow) {
        throw new NotFoundException(
          'Follow record not found. User is not following this company.',
        );
      }
      await this.companyModel.findByIdAndUpdate(
        companyId,
        { $inc: { followers: -1 } },
        { new: true },
      );
    } catch (error) {
      throw error;
    }
  }

  // async followCompany(userId: string, companyId: string): Promise<Company> {
  //   try {
  //     const newFollow = new this.companyConnectionModel({
  //       _id: new Types.ObjectId(),
  //       user_id: new Types.ObjectId(userId),
  //       company_id: new Types.ObjectId(companyId),
  //     });
  //     await newFollow.save();
  //     const followedCompany = await this.companyModel.findByIdAndUpdate(
  //       companyId,
  //       { $inc: { followers: 1 } },
  //       { new: true },
  //     );
  //     if (!followedCompany) {
  //       throw new InternalServerErrorException('Failed to follow company.');
  //     }
  //     return followedCompany;
  //   } catch (error) {
  //     throw error;
  //   }
  // }

  // async unfollowCompany(userId: string, companyId: string): Promise<Company> {
  //   try {
  //     const deletedFollow = await this.companyConnectionModel.findOneAndDelete({
  //       user_id: new Types.ObjectId(userId),
  //       company_id: new Types.ObjectId(companyId),
  //     });

  //     if (!deletedFollow) {
  //       throw new NotFoundException(
  //         'Follow record not found. User is not following this company.',
  //       );
  //     }
  //     const unfollowedCompany = await this.companyModel.findByIdAndUpdate(
  //       companyId,
  //       { $inc: { followers: -1 } },
  //       { new: true },
  //     );

  //     if (!unfollowedCompany) {
  //       throw new InternalServerErrorException('Failed to unfollow company.');
  //     }

  //     return unfollowedCompany;
  //   } catch (error) {
  //     throw error;
  //   }
  // }
}
