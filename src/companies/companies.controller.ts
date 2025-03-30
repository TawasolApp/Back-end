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
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dtos/create-company.dto';
import { UpdateCompanyDto } from './dtos/update-company.dto';
import { Types } from 'mongoose';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';

@UseGuards(JwtAuthGuard)
@UsePipes(new ValidationPipe())
@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  /*
    creates a new company with required fields: name, company size, company type, industry
  */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createCompany(
    @Body() createCompanyDto: CreateCompanyDto,
    @Req() request: Request,
  ) {
    try {
      if (!request.user) {
        throw new UnauthorizedException('User not authenticated');
      }
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

  /*
    updates company with ID as route parameter with fields presented in DTO 
  */
  @Patch('/:companyId')
  @HttpCode(HttpStatus.OK)
  async updateCompany(
    @Param('companyId') companyId: string,
    @Body() updateCompanyDto: UpdateCompanyDto,
    @Req() request: Request,
  ) {
    try {
      if (!request.user) {
        throw new UnauthorizedException('User not authenticated');
      }
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

  /*
    deletes company with ID as route parameter
  */
  @Delete('/:companyId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteCompany(
    @Param('companyId') companyId: string,
    @Req() request: Request,
  ) {
    try {
      if (!request.user) {
        throw new UnauthorizedException('User not authenticated');
      }
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

  /*
    searches for companies:
    - applies at least one filter to companies
    - filter is applied with partial matching and case insensitive
    - returns only essential fields: id, name, logo, industry, follow
  */
  @Get()
  @HttpCode(HttpStatus.OK)
  async filterCompanies(
    @Req() request: Request,
    @Query('name') name?: string,
    @Query('industry') industry?: string,
  ) {
    try {
      if (!request.user) {
        throw new UnauthorizedException('User not authenticated');
      }
      if (!name && !industry) {
        throw new BadRequestException(
          'At least one filter (name or industry) must be provided.',
        );
      }
      name = name?.trim();
      industry = industry?.trim();
      const userId = request.user['sub'];
      const companiesDto = await this.companiesService.filterCompanies(
        userId,
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

  /*
    gets all company details present in the record associated with ID in route parameter
  */
  @Get('/:companyId')
  @HttpCode(HttpStatus.OK)
  async getCompanyDetails(
    @Param('companyId') companyId: string,
    @Req() request: Request,
  ) {
    try {
      if (!request.user) {
        throw new UnauthorizedException('User not authenticated');
      }
      if (!Types.ObjectId.isValid(companyId)) {
        throw new BadRequestException('Invalid company ID format.');
      }
      const userId = request.user['sub'];
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

  /*
    - retrieves all users following the company with ID as route parameter
    - returns only essential fields: id, name, profile picture, headline
  */
  @Get('/:companyId/followers')
  @HttpCode(HttpStatus.OK)
  async getCompanyFollowers(
    @Param('companyId') companyId: string,
    @Req() request: Request,
  ) {
    try {
      if (!request.user) {
        throw new UnauthorizedException('User not authenticated');
      }
      if (!Types.ObjectId.isValid(companyId)) {
        throw new BadRequestException('Invalid company ID format.');
      }
      const followersDto =
        await this.companiesService.getCompanyFollowers(companyId);
      return followersDto;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to get company followers.',
      );
    }
  }

  // @Get('/followed')
  // @HttpCode(HttpStatus.OK)
  // async getFollowedCompanies(@Req() request: Request) {
  //   try {
  //     if (!request.user) {
  //       throw new UnauthorizedException('User not authenticated');
  //     }
  //     await this.companiesService.getSuggestedCompanies(this.loggedIn);
  //   } catch (error) {
  //     if (error instanceof HttpException) {
  //       throw error;
  //     }
  //     throw new InternalServerErrorException(
  //       'Failed to retrieve list of followed companies.',
  //     );
  //   }
  // }

  /*
    allows logged in user to follow company with ID as route parameter
  */
  @Post('/:companyId/follow')
  @HttpCode(HttpStatus.CREATED)
  async followCompany(
    @Param('companyId') companyId: string,
    @Req() request: Request,
  ) {
    try {
      if (!request.user) {
        throw new UnauthorizedException('User not authenticated');
      }
      if (!Types.ObjectId.isValid(companyId)) {
        throw new BadRequestException('Invalid company ID format.');
      }
      const userId = request.user['sub'];
      await this.companiesService.followCompany(userId, companyId);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to follow company.');
    }
  }

  /*
    allows logged in user to unfollow company with ID as route parameter
  */
  @Delete('/:companyId/unfollow')
  @HttpCode(HttpStatus.NO_CONTENT)
  async unfollowCompany(
    @Param('companyId') companyId: string,
    @Req() request: Request,
  ) {
    try {
      if (!request.user) {
        throw new UnauthorizedException('User not authenticated');
      }
      if (!Types.ObjectId.isValid(companyId)) {
        throw new BadRequestException('Invalid company ID format.');
      }
      const userId = request.user['sub'];
      await this.companiesService.unfollowCompany(userId, companyId);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to unfollow company.');
    }
  }

  /*
    - retrieves companies with the same industry and size as company with ID as route parameter
  */
  @Get('/suggested/:companyId')
  @HttpCode(HttpStatus.OK)
  async getSuggestedCompanies(
    @Param('companyId') companyId: string,
    @Req() request: Request,
  ) {
    try {
      if (!request.user) {
        throw new UnauthorizedException('User not authenticated');
      }
      if (!Types.ObjectId.isValid(companyId)) {
        throw new BadRequestException('Invalid company ID format.');
      }
      return await this.companiesService.getSuggestedCompanies(companyId);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to retrieve list of related companies.',
      );
    }
  }

  // @Get('/:companyId/common')
  // @HttpCode(HttpStatus.OK)
  // async getCommonFollowers(
  //   @Param('companyId') companyId: string,
  //   @Req() request: Request,
  // ) {
  //   try {
  //     if (!request.user) {
  //       throw new UnauthorizedException('User not authenticated');
  //     }
  //     if (!Types.ObjectId.isValid(companyId)) {
  //       throw new BadRequestException('Invalid company ID format.');
  //     }
  //     const userId = request.user['sub'];
  //     return await this.companiesService.getCommonFollowers(userId, companyId);
  //   } catch (error) {
  //     if (error instanceof HttpException) {
  //       throw error;
  //     }
  //     throw new InternalServerErrorException(
  //       'Failed to retrieve list of common followers.',
  //     );
  //   }
  // }
}
