import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';
import { CompaniesService } from './companies.service';
import { JobsService } from '../jobs/jobs.service';
import { CreateCompanyDto } from './dtos/create-company.dto';
import { UpdateCompanyDto } from './dtos/update-company.dto';
import { PostJobDto } from '../jobs/dtos/post-job.dto';
import { validateId } from '../common/utils/id-validator';

@UseGuards(JwtAuthGuard)
@UsePipes(new ValidationPipe())
@Controller('companies')
export class CompaniesController {
  constructor(
    private readonly companiesService: CompaniesService,
    private readonly jobsService: JobsService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createCompany(
    @Body() createCompanyDto: CreateCompanyDto,
    @Req() request: Request,
  ) {
    if (!request.user) {
      throw new UnauthorizedException('User not authenticated.');
    }
    const userId = request.user['sub'];
    const newCompanyDto = await this.companiesService.createCompany(
      userId,
      createCompanyDto,
    );
    return newCompanyDto;
  }

  @Patch('/:companyId')
  @HttpCode(HttpStatus.OK)
  async updateCompany(
    @Param('companyId') companyId: string,
    @Body() updateCompanyDto: UpdateCompanyDto,
    @Req() request: Request,
  ) {
    if (!request.user) {
      throw new UnauthorizedException('User not authenticated.');
    }
    validateId(companyId, 'company');
    const userId = request.user['sub'];
    const role = request.user['role'];
    if (role !== 'manager') {
      throw new ForbiddenException('User cannot access this endpoint.');
    }
    if (!updateCompanyDto || !Object.keys(updateCompanyDto).length) {
      throw new BadRequestException('No update data provided.');
    }
    const updatedCompanyDto = await this.companiesService.updateCompany(
      userId,
      companyId,
      updateCompanyDto,
    );
    return updatedCompanyDto;
  }

  @Delete('/:companyId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteCompany(
    @Param('companyId') companyId: string,
    @Req() request: Request,
  ) {
    if (!request.user) {
      throw new UnauthorizedException('User not authenticated.');
    }
    validateId(companyId, 'company');
    const userId = request.user['sub'];
    const role = request.user['role'];
    if (role !== 'manager') {
      throw new ForbiddenException('User cannot access this endpoint.');
    }
    await this.companiesService.deleteCompany(userId, companyId);
  }

  @Get('/:companyId')
  @HttpCode(HttpStatus.OK)
  async getCompanyDetails(
    @Param('companyId') companyId: string,
    @Req() request: Request,
  ) {
    if (!request.user) {
      throw new UnauthorizedException('User not authenticated.');
    }
    validateId(companyId, 'company');
    const userId = request.user['sub'];
    const companyDto = await this.companiesService.getCompanyDetails(
      userId,
      companyId,
    );
    return companyDto;
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async filterCompanies(
    @Req() request: Request,
    @Query('name') name?: string,
    @Query('industry') industry?: string,
  ) {
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
  }

  @Get('/:companyId/followers')
  @HttpCode(HttpStatus.OK)
  async getCompanyFollowers(
    @Req() request: Request,
    @Param('companyId') companyId: string,
    @Query('name') name?: string,
  ) {
    if (!request.user) {
      throw new UnauthorizedException('User not authenticated.');
    }
    validateId(companyId, 'company');
    const followersDto = await this.companiesService.getCompanyFollowers(
      companyId,
      name,
    );
    return followersDto;
  }

  @Get('/:userId/followed')
  @HttpCode(HttpStatus.OK)
  async getFollowedCompanies(
    @Param('userId') userId: string,
    @Req() request: Request,
  ) {
    if (!request.user) {
      throw new UnauthorizedException('User not authenticated.');
    }
    validateId(userId, 'user');
    const requestUserId = request.user['sub'];
    const companiesDto =
      await this.companiesService.getFollowedCompanies(userId);
    return companiesDto;
  }

  @Post('/:companyId/follow')
  @HttpCode(HttpStatus.CREATED)
  async followCompany(
    @Param('companyId') companyId: string,
    @Req() request: Request,
  ) {
    if (!request.user) {
      throw new UnauthorizedException('User not authenticated.');
    }
    validateId(companyId, 'company');
    const userId = request.user['sub'];
    await this.companiesService.followCompany(userId, companyId);
  }

  @Delete('/:companyId/unfollow')
  @HttpCode(HttpStatus.NO_CONTENT)
  async unfollowCompany(
    @Param('companyId') companyId: string,
    @Req() request: Request,
  ) {
    if (!request.user) {
      throw new UnauthorizedException('User not authenticated');
    }
    validateId(companyId, 'company');
    const userId = request.user['sub'];
    await this.companiesService.unfollowCompany(userId, companyId);
  }

  @Get('/:companyId/suggested')
  @HttpCode(HttpStatus.OK)
  async getSuggestedCompanies(
    @Param('companyId') companyId: string,
    @Req() request: Request,
  ) {
    if (!request.user) {
      throw new UnauthorizedException('User not authenticated.');
    }
    validateId(companyId, 'company');
    return await this.companiesService.getSuggestedCompanies(companyId);
  }

  @Get('/:companyId/common')
  @HttpCode(HttpStatus.OK)
  async getCommonFollowers(
    @Param('companyId') companyId: string,
    @Req() request: Request,
  ) {
    if (!request.user) {
      throw new UnauthorizedException('User not authenticated.');
    }
    validateId(companyId, 'company');
    const userId = request.user['sub'];
    return await this.companiesService.getCommonFollowers(userId, companyId);
  }

  @Post('/:companyId/jobs')
  @HttpCode(HttpStatus.CREATED)
  async postJob(
    @Param('companyId') companyId: string,
    @Body() postJobDto: PostJobDto,
    @Req() request: Request,
  ) {
    if (!request.user) {
      throw new UnauthorizedException('User not authenticated.');
    }
    validateId(companyId, 'company');
    const userId = request.user['sub'];
    const role = request.user['role'];
    if (role !== 'manager' && role !== 'employer') {
      throw new ForbiddenException('User cannot access this endpoint.');
    }
    const newJobDto = await this.jobsService.postJob(
      userId,
      companyId,
      postJobDto,
    );
    return newJobDto;
  }

  @Get('/jobs/:jobId')
  @HttpCode(HttpStatus.OK)
  async getJob(@Param('jobId') jobId: string, @Req() request: Request) {
    if (!request.user) {
      throw new UnauthorizedException('User not authenticated.');
    }
    validateId(jobId, 'job');
    const userId = request.user['sub'];
    const jobDto = await this.jobsService.getJob(jobId);
    return jobDto;
  }

  @Get('/:companyId/jobs')
  @HttpCode(HttpStatus.OK)
  async getCompanyJobs(
    @Param('companyId') companyId: string,
    @Req() request: Request,
  ) {
    if (!request.user) {
      throw new UnauthorizedException('User not authenticated.');
    }
    validateId(companyId, 'company');
    const jobsDto = await this.companiesService.getCompanyJobs(companyId);
    return jobsDto;
  }

  @Get('jobs/:jobId/applicants')
  @HttpCode(HttpStatus.OK)
  async getJobApplicants(
    @Param('jobId') jobId: string,
    @Req() request: Request,
    @Query('name') name?: string,
  ) {
    if (!request.user) {
      throw new UnauthorizedException('User not authenticated.');
    }
    validateId(jobId, 'job');
    const userId = request.user['sub'];
    const role = request.user['role'];
    if (role !== 'manager' && role !== 'employer') {
      throw new ForbiddenException('User cannot access this endpoint.');
    }
    const applicantsDto = await this.jobsService.getJobApplicants(
      userId,
      jobId,
      name,
    );
    return applicantsDto;
  }

  @Post('/:companyId/managers/:userId')
  @HttpCode(HttpStatus.CREATED)
  async addCompanyManager(
    @Param('companyId') companyId: string,
    @Param('userId') newManagerId: string,
    @Req() request: Request,
  ) {
    if (!request.user) {
      throw new UnauthorizedException('User not authenticated.');
    }
    validateId(companyId, 'company');
    validateId(newManagerId, 'user');
    const userId = request.user['sub'];
    const role = request.user['role'];
    if (role !== 'manager') {
      throw new ForbiddenException('User cannot access this endpoint.');
    }
    await this.companiesService.addCompanyManager(
      userId,
      companyId,
      newManagerId,
    );
  }

  @Post('/:companyId/employers/:userId')
  @HttpCode(HttpStatus.CREATED)
  async addCompanyEmployer(
    @Param('companyId') companyId: string,
    @Param('userId') newEmployerId: string,
    @Req() request: Request,
  ) {
    if (!request.user) {
      throw new UnauthorizedException('User not authenticated.');
    }
    validateId(companyId, 'company');
    validateId(newEmployerId, 'user');
    const userId = request.user['sub'];
    const role = request.user['role'];
    if (role !== 'manager') {
      throw new ForbiddenException('User cannot access this endpoint.');
    }
    await this.companiesService.addCompanyEmployer(
      userId,
      companyId,
      newEmployerId,
    );
  }

  @Get('/:companyId/managers')
  @HttpCode(HttpStatus.OK)
  async getCompanyManagers(
    @Param('companyId') companyId: string,
    @Req() request: Request,
  ) {
    if (!request.user) {
      throw new UnauthorizedException('User not authenticated.');
    }
    validateId(companyId, 'company');
    const userId = request.user['sub'];
    const role = request.user['role'];
    if (role !== 'manager') {
      throw new ForbiddenException('User cannot access this endpoint.');
    }
    await this.companiesService.getCompanyManagers(companyId, userId);
  }

  @Get('/:companyId/employers')
  @HttpCode(HttpStatus.OK)
  async getCompanyEmployers(
    @Param('companyId') companyId: string,
    @Req() request: Request,
  ) {
    if (!request.user) {
      throw new UnauthorizedException('User not authenticated.');
    }
    validateId(companyId, 'company');
    const userId = request.user['sub'];
    const role = request.user['role'];
    if (role !== 'manager') {
      throw new ForbiddenException('User cannot access this endpoint.');
    }
    await this.companiesService.getCompanyEmployers(companyId, userId);
  }
}
