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

  async createCompany() {}
  async updateCompany() {}
  async getCompany() {}
  async getCompanies() {}
  async getCompanyFollowers() {}
}