import {
  Body,
  Controller,
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
import { GetCompaniesDto } from './dtos/get-companies.dto';
import { GetCompanyDto } from './dtos/get-company.dto';
import { GetFollowerDto } from './dtos/get-follower.dto';
import { toDto, toSchema } from './dtos/company.mapper';

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

  // map to dto
  @Get()
  @HttpCode(HttpStatus.OK)
  async getCompanies(
    @Query('industry') industry: string,
  ): Promise<GetCompaniesDto[]> {
    return await this.companiesService.getCompanies(industry);
  }

  // map to dto
  @Get('/:companyId')
  @HttpCode(HttpStatus.OK)
  async getCompanyDetails(
    @Param('companyId') companyId: string,
  ): Promise<GetCompanyDto> {
    return await this.companiesService.getCompanyDetails(companyId);
  }

  @Get('/:companyId/followers')
  @HttpCode(HttpStatus.OK)
  async getCompanyFollowers(
    @Param('companyId') companyId: string,
  ): Promise<GetFollowerDto[]> {
    return await this.companiesService.getCompanyFollowers(companyId);
  }
}
