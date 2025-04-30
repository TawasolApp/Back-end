import { Types } from 'mongoose';
import { CompanySize } from './enums/company-size.enum';
import { ConnectionStatus } from '../connections/enums/connection-status.enum';

const companyId1 = new Types.ObjectId();
const companyId2 = new Types.ObjectId();
const companyId3 = new Types.ObjectId();
const companyId4 = new Types.ObjectId();
const companyId5 = new Types.ObjectId();

const profileId1 = new Types.ObjectId();
const profileId2 = new Types.ObjectId();
const profileId3 = new Types.ObjectId();
const profileId4 = new Types.ObjectId();
const profileId5 = new Types.ObjectId();

export const mockCompanies = [
  {
    _id: companyId1,
    name: 'Test Company 1',
    company_size: CompanySize.Large,
    industry: 'Software',
    email: 'test1@gmail.com',
    logo: 'logo',
    address: 'address',
    description: 'description',
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

export const mockUsers = [
  {
    _id: profileId1,
    role: 'manager',
  },
  {
    _id: profileId2,
    role: 'manager',
  },
  {
    _id: profileId3,
    role: 'customer',
  },
  {
    _id: profileId4,
    role: 'customer',
  },
  {
    _id: profileId5,
    role: 'employer',
  },
];

export const mockProfiles = [
  {
    _id: profileId1,
    first_name: 'Testing',
    last_name: 'User1',
    profile_picture: 'https://example.com/pfp1.jpg',
    headline: 'Software Engineer',
  },
  {
    _id: profileId2,
    first_name: 'Testing',
    last_name: 'User2',
    profile_picture: 'https://example.com/pfp2.jpg',
    headline: 'Product Manager',
  },
  {
    _id: profileId3,
    first_name: 'Testing',
    last_name: 'User3',
    profile_picture: 'https://example.com/pfp3.jpg',
    headline: 'UX Designer',
  },
  {
    _id: profileId4,
    first_name: 'Testing',
    last_name: 'User4',
    profile_picture: 'https://example.com/pfp4.jpg',
    headline: 'Architect',
  },
  {
    _id: profileId5,
    first_name: 'Testing',
    last_name: 'User5',
    profile_picture: 'https://example.com/pfp5.jpg',
    headline: 'Professor',
  },
];

export const mockCompanyConnections = [
  {
    _id: new Types.ObjectId(),
    user_id: profileId1,
    company_id: companyId1,
    created_at: '2025-03-19T22:17:17.618Z',
  },
  {
    _id: new Types.ObjectId(),
    user_id: profileId1,
    company_id: companyId3,
    created_at: '2025-03-20T22:17:17.618Z',
  },
  {
    _id: new Types.ObjectId(),
    user_id: profileId2,
    company_id: companyId1,
    created_at: '2025-03-19T24:17:17.618Z',
  },
  {
    _id: new Types.ObjectId(),
    user_id: profileId3,
    company_id: companyId4,
    created_at: '2025-03-22T22:17:17.618Z',
  },
];

export const mockCompanyManagers = [
  {
    _id: new Types.ObjectId(),
    manager_id: profileId1,
    company_id: companyId1,
    created_at: new Date().toISOString(),
  },
  {
    _id: new Types.ObjectId(),
    manager_id: profileId1,
    company_id: companyId2,
    created_at: new Date().toISOString(),
  },
  {
    _id: new Types.ObjectId(),
    manager_id: profileId2,
    company_id: companyId2,
    created_at: new Date().toISOString(),
  },
  {
    _id: new Types.ObjectId(),
    manager_id: profileId2,
    company_id: companyId3,
    created_at: new Date().toISOString(),
  },
];

export const mockCompanyEmployers = [
  {
    _id: new Types.ObjectId(),
    employer_id: profileId5,
    company_id: companyId3,
    created_at: new Date().toISOString(),
  },
  {
    _id: new Types.ObjectId(),
    manager_id: profileId5,
    company_id: companyId1,
    created_at: new Date().toISOString(),
  },
];

export const mockJobs = [
  {
    _id: new Types.ObjectId(),
    company_id: companyId1,
    position: 'Designer',
  },
  {
    _id: new Types.ObjectId(),
    company_id: companyId1,
    position: 'Engineer',
  },
  {
    _id: new Types.ObjectId(),
    company_id: companyId2,
    position: 'Architect',
  },
];

export const mockUserConnections = [
  {
    _id: new Types.ObjectId(),
    sending_party: profileId1,
    receiving_party: profileId2,
    status: ConnectionStatus.Connected,
    created_at: '2025-03-19T22:17:17.618Z',
  },
  {
    _id: new Types.ObjectId(),
    sending_party: profileId3,
    receiving_party: profileId1,
    status: ConnectionStatus.Connected,
    created_at: '2025-03-20T22:17:17.618Z',
  },
  {
    _id: new Types.ObjectId(),
    sending_party: profileId3,
    receiving_party: profileId2,
    status: ConnectionStatus.Connected,
    created_at: '2025-03-28T22:17:17.618Z',
  },
];
