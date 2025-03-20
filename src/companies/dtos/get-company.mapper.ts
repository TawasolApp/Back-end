import { Company } from '../infrastructure/database/company.schema';
import { CreateCompanyDto } from './create-company.dto';
import { GetCompanyDto } from './get-company.dto';

export function toSchema(
  createCompanyDto: Partial<CreateCompanyDto>,
): Partial<Company> {
  return {
    name: createCompanyDto.name,
    verified: createCompanyDto.verified,
    logo: createCompanyDto.logo,
    description: createCompanyDto.description,
    employees: createCompanyDto.employees,
    company_type: createCompanyDto.companyType,
    industry: createCompanyDto.industry,
    overview: createCompanyDto.overview,
    founded: createCompanyDto.founded,
    website: createCompanyDto.website,
    address: createCompanyDto.address,
    location: createCompanyDto.location,
    email: createCompanyDto.email,
    contact_number: createCompanyDto.contactNumber,
  };
}

export function toDto(company: Partial<Company>): GetCompanyDto {
  const dto: Partial<GetCompanyDto> = {};

  if (company._id) dto.companyId = company._id.toString();
  if (company.name) dto.name = company.name;
  if (company.verified !== undefined) dto.verified = company.verified;
  if (company.logo) dto.logo = company.logo;
  if (company.description) dto.description = company.description;
  if (company.employees !== undefined) dto.employees = company.employees;
  if (company.company_type) dto.companyType = company.company_type;
  if (company.industry) dto.industry = company.industry;
  if (company.overview) dto.overview = company.overview;
  if (company.founded !== undefined) dto.founded = company.founded;
  if (company.website) dto.website = company.website;
  if (company.address) dto.address = company.address;
  if (company.location) dto.location = company.location;
  if (company.email) dto.email = company.email;
  if (company.contact_number) dto.contactNumber = company.contact_number;

  return dto as GetCompanyDto;
}
