import { Company } from '../infrastructure/database/schemas/company.schema';
import { CreateCompanyDto } from '../dtos/create-company.dto';
import { UpdateCompanyDto } from '../dtos/update-company.dto';
import { GetCompanyDto } from '../dtos/get-company.dto';

export function toCreateCompanySchema(
  createCompanyDto: Partial<CreateCompanyDto>,
): Partial<Company> {
  return {
    name: createCompanyDto.name,
    logo: createCompanyDto.logo,
    banner: createCompanyDto.banner,
    description: createCompanyDto.description,
    company_size: createCompanyDto.companySize,
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

export function toUpdateCompanySchema(
  updateCompanyDto: Partial<UpdateCompanyDto>,
): Partial<Company> {
  return {
    name: updateCompanyDto.name,
    verified: updateCompanyDto.isVerified,
    logo: updateCompanyDto.logo,
    banner: updateCompanyDto.banner,
    description: updateCompanyDto.description,
    company_size: updateCompanyDto.companySize,
    company_type: updateCompanyDto.companyType,
    industry: updateCompanyDto.industry,
    overview: updateCompanyDto.overview,
    founded: updateCompanyDto.founded,
    website: updateCompanyDto.website,
    address: updateCompanyDto.address,
    location: updateCompanyDto.location,
    email: updateCompanyDto.email,
    contact_number: updateCompanyDto.contactNumber,
  };
}

export function toGetCompanyDto(company: Partial<Company>): GetCompanyDto {
  const dto: Partial<GetCompanyDto> = {};

  if (company._id) dto.companyId = company._id.toString();
  if (company.name) dto.name = company.name;
  if (company.verified !== undefined) dto.isVerified = company.verified;
  if (company.logo) dto.logo = company.logo;
  if (company.banner) dto.banner = company.banner;
  if (company.description) dto.description = company.description;
  if (company.followers != undefined) dto.followers = company.followers;
  if (company.company_size) dto.companySize = company.company_size;
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
