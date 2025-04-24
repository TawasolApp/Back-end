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
  ParseIntPipe,
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
import { AddAccessDto } from './dtos/add-access.dto';

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
    // const role = request.user['role'];
    // if (role !== 'manager') {
    //   throw new ForbiddenException('User cannot access this endpoint.');
    // }
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
    // const role = request.user['role'];
    // if (role !== 'manager') {
    //   throw new ForbiddenException('User cannot access this endpoint.');
    // }
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
    @Query('page', ParseIntPipe) page: number,
    @Query('limit', ParseIntPipe) limit: number,
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
      page,
      limit,
      name,
      industry,
    );
    return companiesDto;
  }

  @Get('/:companyId/followers')
  @HttpCode(HttpStatus.OK)
  async getCompanyFollowers(
    @Req() request: Request,
    @Query('page', ParseIntPipe) page: number,
    @Query('limit', ParseIntPipe) limit: number,
    @Param('companyId') companyId: string,
    @Query('name') name?: string,
  ) {
    if (!request.user) {
      throw new UnauthorizedException('User not authenticated.');
    }
    validateId(companyId, 'company');
    const followersDto = await this.companiesService.getCompanyFollowers(
      companyId,
      page,
      limit,
    );
    return followersDto;
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
    @Query('page', ParseIntPipe) page: number,
    @Query('limit', ParseIntPipe) limit: number,
    @Req() request: Request,
  ) {
    if (!request.user) {
      throw new UnauthorizedException('User not authenticated.');
    }
    validateId(companyId, 'company');
    const userId = request.user['sub'];
    return await this.companiesService.getSuggestedCompanies(
      userId,
      companyId,
      page,
      limit,
    );
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
    // const role = request.user['role'];
    // if (role !== 'manager' && role !== 'employer') {
    //   throw new ForbiddenException('User cannot access this endpoint.');
    // }
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
    const jobDto = await this.jobsService.getJob(jobId,userId);
    return jobDto;
  }

  @Get('/:companyId/jobs')
  @HttpCode(HttpStatus.OK)
  async getCompanyJobs(
    @Param('companyId') companyId: string,
    @Query('page', ParseIntPipe) page: number,
    @Query('limit', ParseIntPipe) limit: number,
    @Req() request: Request,
  ) {
    if (!request.user) {
      throw new UnauthorizedException('User not authenticated.');
    }
    validateId(companyId, 'company');
    const jobsDto = await this.companiesService.getCompanyJobs(
      companyId,
      page,
      limit,
    );
    return jobsDto;
  }

  @Get('jobs/:jobId/applicants')
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
      limit
    );
    return applicantsDto;
  }

  @Post('/:companyId/managers')
  @HttpCode(HttpStatus.CREATED)
  async addCompanyManager(
    @Param('companyId') companyId: string,
    @Body() addAccessDto: AddAccessDto,
    @Req() request: Request,
  ) {
    if (!request.user) {
      throw new UnauthorizedException('User not authenticated.');
    }
    validateId(companyId, 'company');
    const userId = request.user['sub'];
    // const role = request.user['role'];
    // if (role !== 'manager') {
    //   throw new ForbiddenException('User cannot access this endpoint.');
    // }
    await this.companiesService.addCompanyManager(
      userId,
      companyId,
      addAccessDto,
    );
  }

  @Post('/:companyId/employers')
  @HttpCode(HttpStatus.CREATED)
  async addCompanyEmployer(
    @Param('companyId') companyId: string,
    @Body() addAccessDto: AddAccessDto,
    @Req() request: Request,
  ) {
    if (!request.user) {
      throw new UnauthorizedException('User not authenticated.');
    }
    validateId(companyId, 'company');
    const userId = request.user['sub'];
    const role = request.user['role'];
    // if (role !== 'manager') {
    //   throw new ForbiddenException('User cannot access this endpoint.');
    // }
    await this.companiesService.addCompanyEmployer(
      userId,
      companyId,
      addAccessDto,
    );
  }

  @Get('/:companyId/managers')
  @HttpCode(HttpStatus.OK)
  async getCompanyManagers(
    @Param('companyId') companyId: string,
    @Query('page', ParseIntPipe) page: number,
    @Query('limit', ParseIntPipe) limit: number,
    @Req() request: Request,
  ) {
    if (!request.user) {
      throw new UnauthorizedException('User not authenticated.');
    }
    validateId(companyId, 'company');
    const userId = request.user['sub'];
    const role = request.user['role'];
    // if (role !== 'manager') {
    //   throw new ForbiddenException('User cannot access this endpoint.');
    // }
    return await this.companiesService.getCompanyManagers(
      companyId,
      userId,
      page,
      limit,
    );
  }

  @Get('/:companyId/employers')
  @HttpCode(HttpStatus.OK)
  async getCompanyEmployers(
    @Param('companyId') companyId: string,
    @Query('page', ParseIntPipe) page: number,
    @Query('limit', ParseIntPipe) limit: number,
    @Req() request: Request,
  ) {
    if (!request.user) {
      throw new UnauthorizedException('User not authenticated.');
    }
    validateId(companyId, 'company');
    const userId = request.user['sub'];
    const role = request.user['role'];
    // if (role !== 'manager') {
    //   throw new ForbiddenException('User cannot access this endpoint.');
    // }
    return await this.companiesService.getCompanyEmployers(
      companyId,
      userId,
      page,
      limit,
    );
  }
}
