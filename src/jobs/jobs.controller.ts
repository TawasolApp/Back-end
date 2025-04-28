import {
  Controller,
  Get,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
  BadRequestException,
  Delete,
  Param,
  Patch,
  ForbiddenException,
  UnauthorizedException,
  ParseIntPipe,
  Post,
  Body,
} from '@nestjs/common';
import { JobsService } from './jobs.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';
import { ApplyJobDto } from './dtos/apply-job.dto';
import { ApplicationDto } from './dtos/application.dto';
import { validateId } from '../common/utils/id-validator';
import { GetJobDto } from './dtos/get-job.dto';

@UseGuards(JwtAuthGuard)
@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async getJobs(
    @Req() request: Request,
    @Query('page', ParseIntPipe) page: number,
    @Query('limit', ParseIntPipe) limit: number,
    @Query('keyword') keyword?: string,
    @Query('location') location?: string,
    @Query('industry') industry?: string,
    @Query('experienceLevel') experienceLevel?: string,
    @Query('company') company?: string,
    @Query('minSalary') minSalary?: number,
    @Query('maxSalary') maxSalary?: number,
  ) {
    if (!request.user) {
      throw new BadRequestException('User not authenticated.');
    }

    const userId = request.user['sub'];
    const filters = {
      keyword,
      location,
      industry,
      experienceLevel,
      company,
      minSalary,
      maxSalary,
    };

    return await this.jobsService.getJobs(userId, filters, page, limit);
  }

  @Get('/saved')
  @HttpCode(HttpStatus.OK)
  async getSavedJobs(
    @Req() request: Request,
    @Query('page', ParseIntPipe) page: number,
    @Query('limit', ParseIntPipe) limit: number,
  ) {
    if (!request.user) {
      throw new UnauthorizedException('User not authenticated.');
    }

    const userId = request.user['sub'];
    return await this.jobsService.getSavedJobs(userId, page, limit);
  }

  @Get('/:jobId')
  @HttpCode(HttpStatus.OK)
  async getJob(@Param('jobId') jobId: string, @Req() request: Request) {
    if (!request.user) {
      throw new UnauthorizedException('User not authenticated.');
    }
    const userId = request.user['sub'];
    const jobDto = await this.jobsService.getJob(jobId, userId);
    return jobDto;
  }

  @Patch('/:jobId/save')
  @HttpCode(HttpStatus.OK)
  async saveJob(@Param('jobId') jobId: string, @Req() request: Request) {
    if (!request.user) {
      throw new UnauthorizedException('User not authenticated.');
    }

    const userId = request.user['sub'];
    await this.jobsService.saveJob(userId, jobId);
  }

  @Delete('/:jobId/unsave')
  @HttpCode(HttpStatus.NO_CONTENT)
  async unsaveJob(@Param('jobId') jobId: string, @Req() request: Request) {
    if (!request.user) {
      throw new UnauthorizedException('User not authenticated.');
    }

    const userId = request.user['sub'];
    await this.jobsService.unsaveJob(userId, jobId);
  }

  @Delete('/:jobId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteJob(@Req() request: Request, @Param('jobId') jobId: string) {
    if (!request.user) {
      throw new BadRequestException('User not authenticated.');
    }

    const userId = request.user['sub'];
    await this.jobsService.deleteJob(userId, jobId);
  }

  @Post('/apply')
  @HttpCode(HttpStatus.CREATED)
  async applyForJob(@Req() request: Request, @Body() applyJobDto: ApplyJobDto) {
    if (!request.user) {
      throw new UnauthorizedException('User not authenticated.');
    }

    const userId = request.user['sub'];
    await this.jobsService.addApplication(userId, applyJobDto);
  }

  @Get('/applications/applied')
  @HttpCode(HttpStatus.OK)
  async getAppliedApplications(
    @Req() request: Request,
    @Query('page', ParseIntPipe) page: number,
    @Query('limit', ParseIntPipe) limit: number,
  ): Promise<{
    jobs: GetJobDto[];
    totalItems: number;
    totalPages: number;
    currentPage: number;
  }> {
    if (!request.user) {
      throw new UnauthorizedException('User not authenticated.');
    }

    const userId = request.user['sub'];
    return await this.jobsService.getAppliedApplications(userId, page, limit);
  }

  @Get('/:jobId/applicants')
  @HttpCode(HttpStatus.OK)
  async getJobApplicants(
    @Param('jobId') jobId: string,
    @Req() request: Request,
    @Query('page', ParseIntPipe) page: number,
    @Query('limit', ParseIntPipe) limit: number,
    @Query('name') name?: string,
  ) {
    if (!request.user) {
      throw new UnauthorizedException('User not authenticated.');
    }
    validateId(jobId, 'job');
    const userId = request.user['sub'];
    // const role = request.user['role'];
    // if (role !== 'manager' && role !== 'employer') {
    //   throw new ForbiddenException('User cannot access this endpoint.');
    // }
    const applicantsDto = await this.jobsService.getJobApplicants(
      userId,
      jobId,
      page,
      limit,
    );
    return applicantsDto;
  }

  @Patch('/applications/:applicationId/status')
  @HttpCode(HttpStatus.OK)
  async updateApplicationStatus(
    @Param('applicationId') applicationId: string,
    @Req() request: Request,
    @Body('status') status: 'Accepted' | 'Rejected',
  ) {
    if (!request.user) {
      throw new UnauthorizedException('User not authenticated.');
    }
    validateId(applicationId, 'application');
    const userId = request.user['sub'];
    await this.jobsService.updateApplicationStatus(
      userId,
      applicationId,
      status,
    );
    return { message: 'Application status updated successfully.' };
  }
}
