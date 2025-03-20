import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
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
import { toDto, toSchema } from './dtos/get-company.mapper';
import { toFollowerDto } from './dtos/get-follower.mapper';

// id and valid data checks should be here
@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createCompany(@Body() createCompanyDto: CreateCompanyDto) {
    return await this.companiesService.createCompany(
      toSchema(createCompanyDto),
    );
  }

  @Put('/:companyId')
  @HttpCode(HttpStatus.OK)
  async updateCompany(
    @Param('companyId') companyId: string,
    @Body() createCompanyDto: CreateCompanyDto,
  ) {
    return await this.companiesService.updateCompany(
      companyId,
      toSchema(createCompanyDto),
    );
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async getCompanies(
    @Query('industry') industry: string,
  ): Promise<GetCompanyDto[]> {
    const companies = await this.companiesService.getCompanies(industry);
    return companies.map((company) => toDto(company));
  }

  @Get('/:companyId')
  @HttpCode(HttpStatus.OK)
  async getCompanyDetails(
    @Param('companyId') companyId: string,
  ): Promise<GetCompanyDto> {
    const company = await this.companiesService.getCompanyDetails(companyId);
    return toDto(company);
  }

  @Get('/:companyId/followers')
  @HttpCode(HttpStatus.OK)
  async getCompanyFollowers(
    @Param('companyId') companyId: string,
  ): Promise<GetFollowerDto[]> {
    const followers =
      await this.companiesService.getCompanyFollowers(companyId);
    return followers.map((follower) => toFollowerDto(follower));
  }

  @Post('/:companyId/follow')
  @HttpCode(HttpStatus.OK)
  async followCompany(@Param('companyId') companyId: string) {
  }

  @Delete('/:companyId/follow')
  @HttpCode(HttpStatus.OK)
  async unfollowCompany(@Param('companyId') companyId: string) {
  }
}
