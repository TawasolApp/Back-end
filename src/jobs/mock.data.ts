import { Types } from 'mongoose';

const companyId1 = new Types.ObjectId();
const companyId2 = new Types.ObjectId();

const profileId1 = new Types.ObjectId();
const profileId2 = new Types.ObjectId();
const profileId3 = new Types.ObjectId();
const profileId4 = new Types.ObjectId();

const jobId1 = new Types.ObjectId();
const jobId2 = new Types.ObjectId();

export const mockCompanies = [
  {
    _id: companyId1,
    name: 'Test Company 1',
  },
  {
    _id: companyId2,
    name: 'Test Company 2',
  },
];

export const mockUsers = [
  {
    _id: profileId1,
    role: 'manager',
  },
  {
    _id: profileId2,
    role: 'employer',
  },
  {
    _id: profileId3,
    role: 'customer',
  },
  {
    _id: profileId4,
    role: 'customer',
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
  ,
];

export const mockCompanyEmployers = [
  {
    _id: new Types.ObjectId(),
    employer_id: profileId2,
    company_id: companyId1,
    created_at: new Date().toISOString(),
  },
  {
    _id: new Types.ObjectId(),
    manager_id: profileId2,
    company_id: companyId2,
    created_at: new Date().toISOString(),
  },
];

export const mockJobs = [
  {
    _id: jobId1,
    company_id: companyId1,
    position: 'Designer',
  },
  {
    _id: jobId2,
    company_id: companyId1,
    position: 'Engineer',
  },
  {
    _id: new Types.ObjectId(),
    company_id: companyId2,
    position: 'Architect',
  },
];

export const mockApplications = [
  {
    _id: new Types.ObjectId(),
    user_id: profileId3,
    job_id: jobId1,
  },
  {
    _id: new Types.ObjectId(),
    user_id: profileId4,
    job_id: jobId1,
  },
  {
    _id: new Types.ObjectId(),
    user_id: profileId3,
    job_id: jobId2,
  },
];
