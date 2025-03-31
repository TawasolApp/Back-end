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
import { Types } from 'mongoose';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';
import { CompaniesService } from './companies.service';
import { JobsService } from '../jobs/jobs.service';
import { CreateCompanyDto } from './dtos/create-company.dto';
import { UpdateCompanyDto } from './dtos/update-company.dto';
import { PostJobDto } from '../jobs/dtos/post-job.dto';

@UseGuards(JwtAuthGuard)
@UsePipes(new ValidationPipe())
@Controller('companies')
export class CompaniesController {
  constructor(
    private readonly companiesService: CompaniesService,
    private readonly jobsService: JobsService,
  ) {}

  private loggedInUser: string = '67ead2a413bb1a3bc8d01460';
  private loggedInCompany: string = '';

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createCompany(
    @Body() createCompanyDto: CreateCompanyDto,
    @Req() request: Request,
  ) {
    try {
      if (!request.user) {
        throw new UnauthorizedException('User not authenticated.');
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

  @Patch('/:companyId')
  @HttpCode(HttpStatus.OK)
  async updateCompany(
    @Param('companyId') companyId: string,
    @Body() updateCompanyDto: UpdateCompanyDto,
    @Req() request: Request,
  ) {
    try {
      if (!request.user) {
        throw new UnauthorizedException('User not authenticated.');
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

  @Delete('/:companyId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteCompany(
    @Param('companyId') companyId: string,
    @Req() request: Request,
  ) {
    try {
      if (!request.user) {
        throw new UnauthorizedException('User not authenticated.');
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

  @Get()
  @HttpCode(HttpStatus.OK)
  async filterCompanies(
    @Req() request: Request,
    @Query('name') name?: string,
    @Query('industry') industry?: string,
  ) {
    try {
      if (!request.user) {
        throw new UnauthorizedException('User not authenticated.');
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

  @Get('/:companyId')
  @HttpCode(HttpStatus.OK)
  async getCompanyDetails(
    @Param('companyId') companyId: string,
    @Req() request: Request,
  ) {
    try {
      if (!request.user) {
        throw new UnauthorizedException('User not authenticated.');
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
      throw new InternalServerErrorException(
        'Failed to retrieve company details.',
      );
    }
  }

  @Get('/:companyId/followers')
  @HttpCode(HttpStatus.OK)
  async getCompanyFollowers(
    @Param('companyId') companyId: string,
    @Req() request: Request,
  ) {
    try {
      if (!request.user) {
        throw new UnauthorizedException('User not authenticated.');
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
        'Failed to retrieve company followers.',
      );
    }
  }

  @Get('/:userId/followed')
  @HttpCode(HttpStatus.OK)
  async getFollowedCompanies(
    @Param('userId') userId: string,
    @Req() request: Request,
  ) {
    try {
      if (!request.user) {
        throw new UnauthorizedException('User not authenticated.');
      }
      const requestUserId = request.user['sub'];
      const companiesDto = await this.companiesService.getFollowedCompanies(userId);
      return companiesDto;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to retrieve list of followed companies.',
      );
    }
  }

  @Post('/:companyId/follow')
  @HttpCode(HttpStatus.CREATED)
  async followCompany(
    @Param('companyId') companyId: string,
    @Req() request: Request,
  ) {
    try {
      if (!request.user) {
        throw new UnauthorizedException('User not authenticated.');
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

  @Get('/:companyId/suggested')
  @HttpCode(HttpStatus.OK)
  async getSuggestedCompanies(
    @Param('companyId') companyId: string,
    @Req() request: Request,
  ) {
    try {
      if (!request.user) {
        throw new UnauthorizedException('User not authenticated.');
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

  @Get('/:companyId/common')
  @HttpCode(HttpStatus.OK)
  async getCommonFollowers(
    @Param('companyId') companyId: string,
    @Req() request: Request,
  ) {
    try {
      if (!request.user) {
        throw new UnauthorizedException('User not authenticated.');
      }
      if (!Types.ObjectId.isValid(companyId)) {
        throw new BadRequestException('Invalid company ID format.');
      }
      const userId = request.user['sub'];
      return await this.companiesService.getCommonFollowers(userId, companyId);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to retrieve list of common followers.',
      );
    }
  }

  @Post('/:companyId/jobs')
  @HttpCode(HttpStatus.CREATED)
  async postJob(
    @Param('companyId') companyId: string,
    @Body() postJobDto: PostJobDto,
    @Req() request: Request,
  ) {
    try {
      if (!request.user) {
        throw new UnauthorizedException('User not authenticated.');
      }
      if (!Types.ObjectId.isValid(companyId)) {
        throw new BadRequestException('Invalid company ID format.');
      }
      const newJobDto = await this.jobsService.postJob(companyId, postJobDto);
      return newJobDto;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to add job listing.');
    }
  }

  @Get('/jobs/:jobId')
  @HttpCode(HttpStatus.OK)
  async getJob(@Param('jobId') jobId: string, @Req() request: Request) {
    try {
      if (!request.user) {
        throw new UnauthorizedException('User not authenticated.');
      }
      if (!Types.ObjectId.isValid(jobId)) {
        throw new BadRequestException('Invalid job ID format.');
      }
      const userId = request.user['sub'];
      const jobDto = await this.jobsService.getJob(jobId);
      return jobDto;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to retrieve job details.');
    }
  }

  @Get('/:companyId/jobs')
  @HttpCode(HttpStatus.OK)
  async getCompanyJobs(
    @Param('companyId') companyId: string,
    @Req() request: Request,
  ) {
    try {
      if (!request.user) {
        throw new UnauthorizedException('User not authenticated.');
      }
      if (!Types.ObjectId.isValid(companyId)) {
        throw new BadRequestException('Invalid company ID format.');
      }
      const jobsDto = await this.companiesService.getCompanyJobs(companyId);
      return jobsDto;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to retrieve company jobs.',
      );
    }
  }

  // TODO: add applicant filter by name
  @Get('jobs/:jobId/applicants')
  @HttpCode(HttpStatus.OK)
  async getJobApplicants(
    @Param('jobId') jobId: string,
    @Req() request: Request,
  ) {
    try {
      if (!request.user) {
        throw new UnauthorizedException('User not authenticated.');
      }
      if (!Types.ObjectId.isValid(jobId)) {
        throw new BadRequestException('Invalid job ID format.');
      }
      const applicantsDto = await this.jobsService.getJobApplicants(jobId);
      return applicantsDto;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to retrieve job applicants.',
      );
    }
  }
}
