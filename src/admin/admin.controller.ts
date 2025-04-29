import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
  UnauthorizedException,
  Patch,
  Param,
  NotFoundException,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';
import { checkAdmin, validateId } from '../common/utils/id-validator';

@UseGuards(JwtAuthGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('/analytics/users')
  @HttpCode(HttpStatus.OK)
  async getUserAnalytics(@Req() request: Request) {
    if (!request.user) {
      throw new UnauthorizedException('User not authenticated.');
    }
    checkAdmin(request.user);
    return await this.adminService.getUserAnalytics();
  }

  @Get('/analytics/posts')
  @HttpCode(HttpStatus.OK)
  async getPostAnalytics(@Req() request: Request) {
    if (!request.user) {
      throw new UnauthorizedException('User not authenticated.');
    }
    checkAdmin(request.user);
    return await this.adminService.getPostAnalytics();
  }

  @Get('/analytics/jobs')
  @HttpCode(HttpStatus.OK)
  async getJobAnalytics(@Req() request: Request) {
    if (!request.user) {
      throw new UnauthorizedException('User not authenticated.');
    }
    checkAdmin(request.user);
    return await this.adminService.getJobAnalytics();
  }

  @Patch('/:jobId/ignore')
  @HttpCode(HttpStatus.OK)
  async ignoreJob(@Param('jobId') jobId: string, @Req() request: Request) {
    validateId(jobId, 'job');
    if (!request.user) {
      throw new UnauthorizedException('User not authenticated.');
    }
    checkAdmin(request.user);

    const result = await this.adminService.ignoreJob(jobId);
    if (!result) {
      throw new NotFoundException('Job not found.');
    }

    return { message: 'Job successfully ignored.' };
  }
}
