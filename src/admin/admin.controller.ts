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
  Query,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';
import { checkAdmin, validateId } from '../common/utils/id-validator';
import { ReportedPostsDto } from './dtos/reported-posts.dto';
import { ReportedUsersDto } from './dtos/reported-users.dto';

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

    return await this.adminService.ignoreJob(jobId);
  }

  @Get('/reports/posts')
  @HttpCode(HttpStatus.OK)
  async getReportedPosts(
    @Req() request: Request,
    @Query('status') status?: string,
  ): Promise<ReportedPostsDto[]> {
    if (!request.user) {
      throw new UnauthorizedException('User not authenticated.');
    }
    checkAdmin(request.user);
    return await this.adminService.getReportedPosts(status);
  }

  @Get('/reports/users')
  @HttpCode(HttpStatus.OK)
  async getReportedUsers(
    @Req() request: Request,
    @Query('status') status?: string,
  ): Promise<ReportedUsersDto[]> {
    if (!request.user) {
      throw new UnauthorizedException('User not authenticated.');
    }
    checkAdmin(request.user);
    return await this.adminService.getReportedUsers(status);
  }
}
