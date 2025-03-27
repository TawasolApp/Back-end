import {
  ConflictException,
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
import { CreateCompanyDto } from './dtos/create-company.dto';
import { UpdateCompanyDto } from './dtos/update-company.dto';
import { GetCompanyDto } from './dtos/get-company.dto';
import { GetFollowerDto } from './dtos/get-follower.dto';
import {
  toCreateCompanySchema,
  toUpdateCompanySchema,
  toGetCompanyDto,
} from './dtos/company.mapper';
import { toGetFollowerDto } from './dtos/get-follower.mapper';
import {
  UserConnection,
  UserConnectionDocument,
} from '../connections/infrastructure/database/user-connection.schema';
import { ConnectionStatus } from '../connections/infrastructure/connection-status.enum';

@Injectable()
export class CompaniesService {
  constructor(
    @InjectModel(Company.name)
    private readonly companyModel: Model<CompanyDocument>,
    @InjectModel(CompanyConnection.name)
    private readonly companyConnectionModel: Model<CompanyConnectionDocument>,
    @InjectModel(Profile.name)
    private readonly profileModel: Model<ProfileDocument>,
    @InjectModel(UserConnection.name)
    private readonly userConnectionModel: Model<UserConnectionDocument>,
  ) {}

  async createCompany(
    createCompanyDto: Partial<CreateCompanyDto>,
  ): Promise<GetCompanyDto> {
    try {
      const companyData = toCreateCompanySchema(createCompanyDto);
      const existingFields = await this.companyModel
        .findOne({
          $or: [
            { name: companyData.name },
            { website: companyData.website },
            { email: companyData.email },
            { contact_number: companyData.contact_number },
          ],
        })
        .lean();
      if (existingFields) {
        throw new ConflictException(
          'Company name, website, email and contact number must be unique.',
        );
      }
      const newCompany = new this.companyModel({
        _id: new Types.ObjectId(),
        followers: 0,
        verified: false,
        ...companyData,
      });
      return toGetCompanyDto(await newCompany.save());
    } catch (error) {
      throw error;
    }
  }

  async updateCompany(
    companyId: string,
    updateCompanyDto: Partial<UpdateCompanyDto>,
  ) {
    try {
      const updateData = toUpdateCompanySchema(updateCompanyDto);
      const existingCompany = await this.companyModel
        .findById(new Types.ObjectId(companyId))
        .lean();
      if (!existingCompany) {
        throw new NotFoundException('Company not found.');
      }
      const existingFields = await this.companyModel
        .findOne({
          $or: [
            { name: updateData.name },
            { website: updateData.website },
            { email: updateData.email },
            { contact_number: updateData.contact_number },
          ],
        })
        .lean();
      if (existingFields) {
        throw new ConflictException(
          'Company name, website, email and contact number must be unique.',
        );
      }
      const updatedCompany = await this.companyModel.findByIdAndUpdate(
        new Types.ObjectId(companyId),
        { $set: updateData },
        { new: true },
      );
      return toGetCompanyDto(updatedCompany!);
    } catch (error) {
      throw error;
    }
  }

  async deleteCompany(companyId: string) {
    try {
      const existingCompany = await this.companyModel
        .findById(new Types.ObjectId(companyId))
        .lean();
      if (!existingCompany) {
        throw new NotFoundException('Company not found.');
      }
      await this.companyModel
        .findByIdAndDelete(new Types.ObjectId(companyId))
        .lean();
      await this.companyConnectionModel.deleteMany({
        company_id: new Types.ObjectId(companyId),
      });
      return;
    } catch (error) {
      throw error;
    }
  }

  async getCompanyDetails(companyId: string, userId: string) {
    try {
      const company = await this.companyModel
        .findById(new Types.ObjectId(companyId))
        .lean();
      if (!company) {
        throw new NotFoundException('Company not found.');
      }
      const isFollowing = await this.companyConnectionModel.findOne({
        user_id: new Types.ObjectId(userId),
        company_id: new Types.ObjectId(companyId),
      });
      const companyDto = toGetCompanyDto(company);
      companyDto.isFollowing = !!isFollowing;
      return companyDto;
    } catch (error) {
      throw error;
    }
  }

  async filterCompanies(userId: string, name?: string, industry?: string) {
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
      .sort({ followers: -1 })
      .lean();

    const companyIds = companies.map((company) => company._id);
    const userConnections = await this.companyConnectionModel
      .find({
        user_id: userId,
        company_id: { $in: companyIds },
      })
      .lean();

    const followedCompanyIds = new Set(
      userConnections.map((connection) => connection.company_id.toString()),
    );

    return companies.map((company) => {
      const companyDto = toGetCompanyDto(company);
      companyDto.isFollowing = followedCompanyIds.has(company._id.toString());
      return companyDto;
    });
  }

  async getCompanyFollowers(companyId: string) {
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
      return result.map(toGetFollowerDto);
    } catch (error) {
      throw error;
    }
  }

  async getFollowedCompanies(userId: string) {
    try {
      const connections = await this.companyConnectionModel
        .find({ user_id: new Types.ObjectId(userId) })
        .select('company_id')
        .lean();
      const followedCompanyIds = connections.map((c) => c.company_id);
      const companies = await this.companyModel
        .find({ _id: { $in: followedCompanyIds } })
        .select('_id name logo industry followers')
        .sort({ created_at: -1 })
        .lean();
      return companies.map(toGetCompanyDto);
    } catch (error) {
      throw error;
    }
  }

  async followCompany(userId: string, companyId: string) {
    try {
      const company = await this.companyModel
        .findById(new Types.ObjectId(companyId))
        .lean();
      if (!company) {
        throw new NotFoundException('Company not found.');
      }
      const existingFollow = await this.companyConnectionModel
        .findOne({
          user_id: new Types.ObjectId(userId),
          company_id: new Types.ObjectId(companyId),
        })
        .lean();
      if (existingFollow) {
        throw new ConflictException('User already follows this company.');
      }
      const newFollow = new this.companyConnectionModel({
        _id: new Types.ObjectId(),
        user_id: new Types.ObjectId(userId),
        company_id: new Types.ObjectId(companyId),
      });
      await newFollow.save();
      await this.companyModel.findByIdAndUpdate(
        new Types.ObjectId(companyId),
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
        new Types.ObjectId(companyId),
        { $inc: { followers: -1 } },
        { new: true },
      );
    } catch (error) {
      throw error;
    }
  }

  async getSuggestedCompanies(companyId: string) {
    try {
      const company = await this.companyModel
        .findById(new Types.ObjectId(companyId))
        .select('industry company_size')
        .lean();
      if (!company) {
        throw new NotFoundException('Company not found');
      }
      const suggestedCompanies = await this.companyModel
        .find({
          _id: { $ne: new Types.ObjectId(companyId) },
          industry: company.industry,
          company_size: company.company_size,
        })
        .select('_id name logo industry followers')
        .sort({ followers: -1 })
        .lean();
      return suggestedCompanies.map(toGetCompanyDto);
    } catch (error) {
      throw error;
    }
  }

  // async getCommonFollowers(userId: string, companyId: string) {
  //   try {
  //     const company = await this.companyModel
  //       .findById(new Types.ObjectId(companyId))
  //       .lean();
  //     if (!company) {
  //       throw new NotFoundException('Company not found');
  //     }
  //     const connections = await this.userConnectionModel
  //       .find({
  //         $or: [
  //           { sending_party: new Types.ObjectId(userId) },
  //           { receiving_party: new Types.ObjectId(userId) },
  //         ],
  //         status: ConnectionStatus.Connected,
  //       })
  //       .select('sending_party receiving_party')
  //       .lean();
  //     const connectionIds = connections.map((connection) =>
  //       connection.sending_party.equals(new Types.ObjectId(userId))
  //         ? connection.receiving_party
  //         : connection.sending_party,
  //     );
  //     const followers = await this.companyConnectionModel
  //       .find({
  //         user_id: { $in: connectionIds },
  //         company_id: companyId,
  //       })
  //       .select('user_id')
  //       .lean();

  //     const followerIds = followers.map((follower) => follower.user_id);

  //     const profiles = await this.profileModel
  //       .find({ _id: { $in: followerIds } })
  //       .select('_id name profile_picture headline')
  //       .lean();

  //     return profiles.map(toGetFollowerDto);
  //   } catch (error) {
  //     throw error;
  //   }
  // }
}
