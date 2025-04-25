import {
  Controller,
  Get,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { JobsService } from './jobs.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';


@UseGuards(JwtAuthGuard)
@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async getJobs(
    @Req() request: Request,
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

    return await this.jobsService.getJobs(userId, filters);
  }
}
