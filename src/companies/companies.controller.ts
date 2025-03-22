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
import { UpdateCompanyDto } from './dtos/update-company.dto';
import { GetCompanyDto } from './dtos/get-company.dto';
import { GetFollowerDto } from './dtos/get-follower.dto';
import { Types } from 'mongoose';

@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createCompany(@Body() createCompanyDto: CreateCompanyDto) {
    try {
      const newCompanyDto =
        await this.companiesService.createCompany(createCompanyDto);
      return newCompanyDto;
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
      const updatedCompanyDto = await this.companiesService.updateCompany(
        companyId,
        updateCompanyDto,
      );
      return updatedCompanyDto;
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

  // remove user ID from parameters, will be passed in token
  @Get('/:userId')
  @HttpCode(HttpStatus.OK)
  async filterCompanies(
    @Param('userId') userId: string,
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
      const companiesDto = await this.companiesService.filterCompanies(userId,
        name,
        industry,
      );
      return companiesDto;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to retrieve list of companies.',
      );
    }
  }

  // remove user ID from parameters, will be passed in token
  @Get('/:companyId/:userId')
  @HttpCode(HttpStatus.OK)
  async getCompanyDetails(
    @Param('companyId') companyId: string,
    @Param('userId') userId: string,
  ): Promise<GetCompanyDto> {
    try {
      if (!Types.ObjectId.isValid(companyId)) {
        throw new BadRequestException('Invalid company ID format.');
      }
      const companyDto = await this.companiesService.getCompanyDetails(
        companyId,
        userId,
      );
      return companyDto;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to get company details.');
    }
  }

  // @Get('/:companyId/followers')
  // @HttpCode(HttpStatus.OK)
  // async getCompanyFollowers(
  //   @Param('companyId') companyId: string,
  // ): Promise<GetFollowerDto[]> {
  //   try {
  //     if (!Types.ObjectId.isValid(companyId)) {
  //       throw new BadRequestException('Invalid company ID format.');
  //     }
  //     const followersDto =
  //       await this.companiesService.getCompanyFollowers(companyId);
  //     return followersDto;
  //   } catch (error) {
  //     if (error instanceof HttpException) {
  //       throw error;
  //     }
  //     throw new InternalServerErrorException(
  //       'Failed to get company followers.',
  //     );
  //   }
  // }

  // remove user ID from parameters, will be passed in token
  @Post('/:companyId/:userId/follow')
  @HttpCode(HttpStatus.CREATED)
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

  // remove user ID from parameters, will be passed in token
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
