import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dtos/create-company.dto';
import { GetCompanyDto } from './dtos/get-company.dto';
import { GetFollowerDto } from './dtos/get-follower.dto';
import {
  toCreateCompanySchema,
  toUpdateCompanySchema,
  toGetCompanyDto,
} from './dtos/company.mapper';
import { toGetFollowerDto } from './dtos/get-follower.mapper';
import { Types } from 'mongoose';
import { UpdateCompanyDto } from './dtos/update-company.dto';

@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createCompany(@Body() createCompanyDto: CreateCompanyDto) {
    try {
      const newCompany = await this.companiesService.createCompany(
        toCreateCompanySchema(createCompanyDto),
      );
      return toGetCompanyDto(newCompany);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to create company.');
    }
  }

  @Patch('/:companyId')
  @HttpCode(HttpStatus.OK)
  async updateCompany(
    @Param('companyId') companyId: string,
    @Body() updateCompanyDto: UpdateCompanyDto,
  ) {
    try {
      if (!Types.ObjectId.isValid(companyId)) {
        throw new BadRequestException('Invalid company ID format.');
      }
      if (!updateCompanyDto || !Object.keys(updateCompanyDto).length) {
        throw new BadRequestException('No update data provided.');
      }
      const updatedCompany = await this.companiesService.updateCompany(
        companyId,
        toUpdateCompanySchema(updateCompanyDto),
      );
      return toGetCompanyDto(updatedCompany);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to update company details.',
      );
    }
  }

  @Delete('/:companyId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteCompany(@Param('companyId') companyId: string) {
    try {
      if (!Types.ObjectId.isValid(companyId)) {
        throw new BadRequestException('Invalid company ID format.');
      }
      await this.companiesService.deleteCompany(companyId);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to delete company.');
    }
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async filterCompanies(
    @Query('name') name?: string,
    @Query('industry') industry?: string,
  ): Promise<GetCompanyDto[]> {
    try {
      if (!name && !industry) {
        throw new BadRequestException(
          'At least one filter (name or industry) must be provided.',
        );
      }
      name = name?.trim();
      industry = industry?.trim();
      const companies = await this.companiesService.filterCompanies(
        name,
        industry,
      );
      return companies.map((company) => toGetCompanyDto(company));
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to retrieve list of companies.',
      );
    }
  }

  @Get('/:companyId')
  @HttpCode(HttpStatus.OK)
  async getCompanyDetails(
    @Param('companyId') companyId: string,
  ): Promise<GetCompanyDto> {
    try {
      if (!Types.ObjectId.isValid(companyId)) {
        throw new BadRequestException('Invalid company ID format.');
      }
      const company = await this.companiesService.getCompanyDetails(companyId);
      return toGetCompanyDto(company);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to get company details.');
    }
  }

  @Get('/:companyId/followers')
  @HttpCode(HttpStatus.OK)
  async getCompanyFollowers(
    @Param('companyId') companyId: string,
  ): Promise<GetFollowerDto[]> {
    try {
      if (!Types.ObjectId.isValid(companyId)) {
        throw new BadRequestException('Invalid company ID format.');
      }
      const followers =
        await this.companiesService.getCompanyFollowers(companyId);
      return followers.map(toGetFollowerDto);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to get company followers.',
      );
    }
  }

  @Post('/:companyId/:userId/follow')
  @HttpCode(HttpStatus.NO_CONTENT)
  async followCompany(
    @Param('companyId') companyId: string,
    @Param('userId') userId: string,
  ) {
    try {
      if (!Types.ObjectId.isValid(companyId)) {
        throw new BadRequestException('Invalid company ID format.');
      }
      await this.companiesService.followCompany(userId, companyId);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to follow company.');
    }
  }

  @Delete('/:companyId/:userId/unfollow')
  @HttpCode(HttpStatus.NO_CONTENT)
  async unfollowCompany(
    @Param('companyId') companyId: string,
    @Param('userId') userId: string,
  ) {
    try {
      if (!Types.ObjectId.isValid(companyId)) {
        throw new BadRequestException('Invalid company ID format.');
      }
      await this.companiesService.unfollowCompany(userId, companyId);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to unfollow company.');
    }
  }
}
