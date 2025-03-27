import { Types } from 'mongoose';
import { CompanySize } from './infrastructure/company-size.enum';
import { CompanyType } from './infrastructure/company-type.enum';

const companyId1 = new Types.ObjectId();
const companyId2 = new Types.ObjectId();
const companyId3 = new Types.ObjectId();
const companyId4 = new Types.ObjectId();
const companyId5 = new Types.ObjectId();

const profileId1 = new Types.ObjectId();
const profileId2 = new Types.ObjectId();
const profileId3 = new Types.ObjectId();

export const mockCompanies = [
  {
    _id: companyId1,
    name: 'Test Company 1',
    company_size: CompanySize.Large,
    industry: 'Software',
    email: 'test1@gmail.com'
  },
  {
    _id: companyId2,
    name: 'Test Company 2',
    company_size: CompanySize.Large,
    industry: 'Software',
  },
  {
    _id: companyId3,
    name: 'Testing Company 3',
    company_size: CompanySize.Mini,
    industry: 'Hardware',
  },
  {
    _id: companyId4,
    name: 'Testing Company 4',
    company_size: CompanySize.Small,
    industry: 'Design',
  },
  {
    _id: companyId5,
    name: 'Testing Company 5',
    company_size: CompanySize.Medium,
    industry: 'Medicine',
  },
];

export const mockProfiles = [
  {
    _id: profileId1,
    name: 'Testing User1',
    profile_picture: 'https://example.com/pfp1.jpg',
    headline: 'Software Engineer',
  },
  {
    _id: profileId2,
    name: 'Testing User2',
    profile_picture: 'https://example.com/pfp2.jpg',
    headline: 'Product Manager',
  },
  {
    _id: profileId3,
    name: 'Testing User3',
    profile_picture: 'https://example.com/pfp3.jpg',
    headline: 'UX Designer',
  },
];

export const mockConnections = [
  {
    _id: new Types.ObjectId(),
    user_id: profileId1,
    company_id: companyId1,
    created_at: new Date().toISOString(),
  },
  {
    _id: new Types.ObjectId(),
    user_id: profileId1,
    company_id: companyId3,
    created_at: new Date().toISOString(),
  },
  {
    _id: new Types.ObjectId(),
    user_id: profileId2,
    company_id: companyId1,
    created_at: new Date().toISOString(),
  },
  {
    _id: new Types.ObjectId(),
    user_id: profileId3,
    company_id: companyId4,
    created_at: new Date().toISOString(),
  },
];
