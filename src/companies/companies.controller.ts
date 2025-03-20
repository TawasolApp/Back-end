import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dtos/create-company.dto';
import { GetCompaniesDto } from './dtos/get-companies.dto';
import { GetCompanyDto } from './dtos/get-company.dto';
import { GetFollowerDto } from './dtos/get-follower.dto';

@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Post()
  async createCompany(@Body() createCompanyDto: CreateCompanyDto): Promise<GetCompanyDto> {
    const company = await this.companiesService.createCompany({ ...createCompanyDto });
    return this.mapToGetCompanyDto(company);
  }

  @Patch(':companyId')
  async updateCompany(
    @Param('companyId') companyId: string,
    @Body() updateData: Partial<CreateCompanyDto>,
  ): Promise<GetCompanyDto> {
    const updatedCompany = await this.companiesService.updateCompany(companyId, { ...updateData });
    return this.mapToGetCompanyDto(updatedCompany);
  }

  // ✅ Get list of companies (Controller converts DB response -> DTOs)
  @Get()
  async getCompanies(): Promise<GetCompaniesDto[]> {
    const companies = await this.companiesService.getCompanies();
    return companies.map(company => this.mapToGetCompaniesDto(company));
  }

  // ✅ Get company details
  @Get(':companyId')
  async getCompanyDetails(@Param('companyId') companyId: string): Promise<GetCompanyDto> {
    const company = await this.companiesService.getCompanyDetails(companyId);
    return this.mapToGetCompanyDto(company);
  }

  // ✅ Get company followers
  @Get(':companyId/followers')
  async getCompanyFollowers(@Param('companyId') companyId: string): Promise<GetFollowerDto[]> {
    return this.companiesService.getCompanyFollowers(companyId);
  }

  // ✅ Mapping methods to convert Entities -> DTOs
  private mapToGetCompanyDto(company: any): GetCompanyDto {
    return {
      companyId: company._id.toString(),
      name: company.name,
      verified: company.verified,
      logo: company.logo,
      description: company.description,
      employees: company.employees,
      companyType: company.company_type,
      industry: company.industry,
      overview: company.overview,
      founded: company.founded,
      website: company.website,
      address: company.address,
      location: company.location,
      email: company.email,
      contactNumber: company.contact_number,
    };
  }

  private mapToGetCompaniesDto(company: any): GetCompaniesDto {
    return {
      companyId: company._id.toString(),
      name: company.name,
      logo: company.logo,
      followers: company.followers,
    };
  }
}
