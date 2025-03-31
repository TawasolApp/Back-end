import { Types } from 'mongoose';
import { ConnectionStatus } from './enums/connection-status.enum';

const profileId1 = new Types.ObjectId();
const profileId2 = new Types.ObjectId();
const profileId3 = new Types.ObjectId();
const profileId4 = new Types.ObjectId();
const profileId5 = new Types.ObjectId();

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
    name: 'Test User3',
    profile_picture: 'https://example.com/pfp3.jpg',
    headline: 'UX Designer',
  },
  {
    _id: profileId4,
    name: 'Test User4',
    profile_picture: 'https://example.com/pfp4.jpg',
    headline: 'Architect',
  },
  {
    _id: profileId5,
    name: 'Test User5',
    profile_picture: 'https://example.com/pfp5.jpg',
    headline: 'Human Resources Expert',
  },
];

export const mockConnections = [
  {
    _id: new Types.ObjectId(),
    sending_party: profileId1,
    receiving_party: profileId2,
    status: ConnectionStatus.Pending,
    created_at: new Date().toISOString(),
  },
  {
    _id: new Types.ObjectId(),
    sending_party: profileId3,
    receiving_party: profileId1,
    status: ConnectionStatus.Pending,
    created_at: new Date().toISOString(),
  },
  {
    _id: new Types.ObjectId(),
    sending_party: profileId2,
    receiving_party: profileId3,
    status: ConnectionStatus.Connected,
    created_at: new Date().toISOString(),
  },
  {
    _id: new Types.ObjectId(),
    sending_party: profileId2,
    receiving_party: profileId4,
    status: ConnectionStatus.Connected,
    created_at: new Date().toISOString(),
  },
  {
    _id: new Types.ObjectId(),
    sending_party: profileId3,
    receiving_party: profileId4,
    status: ConnectionStatus.Following,
    created_at: new Date().toISOString(),
  },
  {
    _id: new Types.ObjectId(),
    sending_party: profileId4,
    receiving_party: profileId1,
    status: ConnectionStatus.Following,
    created_at: new Date().toISOString(),
  },
];
