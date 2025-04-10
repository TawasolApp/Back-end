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
    first_name: 'Testing',
    last_name: 'User1',
    profile_picture: 'https://example.com/pfp1.jpg',
    cover_photo: 'https://example.com/pfp1.jpg',
    headline: 'Software Engineer',
  },
  {
    _id: profileId2,
    first_name: 'Test',
    last_name: 'User2',
    profile_picture: 'https://example.com/pfp2.jpg',
    cover_photo: 'https://example.com/pfp2.jpg',
    headline: 'Product Manager',
    skills: [
      {
        skill_name: 'Skill1',
        position: 'Developer',
        endorsements: [profileId3],
      },
    ],
  },
  {
    _id: profileId3,
    first_name: 'Testing',
    last_name: 'User3',
    profile_picture: 'https://example.com/pfp3.jpg',
    cover_photo: 'https://example.com/pfp3.jpg',
    headline: 'UX Designer',
  },
  {
    _id: profileId4,
    first_name: 'Test',
    last_name: 'User4',
    profile_picture: 'https://example.com/pfp4.jpg',
    cover_photo: 'https://example.com/pfp4.jpg',
    headline: 'Architect',
  },
  {
    _id: profileId5,
    first_name: 'Test',
    last_name: 'User5',
    profile_picture: 'https://example.com/pfp5.jpg',
    cover_photo: 'https://example.com/pfp5.jpg',
    headline: 'Human Resources Expert',
  },
];

export const mockConnections = [
  {
    _id: new Types.ObjectId(),
    sending_party: profileId1,
    receiving_party: profileId2,
    status: ConnectionStatus.Pending,
    created_at: '2025-03-19T22:17:17.618Z',
  },
  {
    _id: new Types.ObjectId(),
    sending_party: profileId3,
    receiving_party: profileId1,
    status: ConnectionStatus.Ignored,
    created_at: '2025-03-20T22:17:17.618Z',
  },
  {
    _id: new Types.ObjectId(),
    sending_party: profileId3,
    receiving_party: profileId2,
    status: ConnectionStatus.Connected,
    created_at: '2025-03-28T22:17:17.618Z',
  },
  {
    _id: new Types.ObjectId(),
    sending_party: profileId2,
    receiving_party: profileId4,
    status: ConnectionStatus.Connected,
    created_at: '2025-03-22T22:17:17.618Z',
  },
  {
    _id: new Types.ObjectId(),
    sending_party: profileId1,
    receiving_party: profileId4,
    status: ConnectionStatus.Connected,
    created_at: '2025-03-21T22:17:17.618Z',
  },
  {
    _id: new Types.ObjectId(),
    sending_party: profileId3,
    receiving_party: profileId4,
    status: ConnectionStatus.Following,
    created_at: '2025-03-14T22:17:17.618Z',
  },
  {
    _id: new Types.ObjectId(),
    sending_party: profileId4,
    receiving_party: profileId1,
    status: ConnectionStatus.Following,
    created_at: '2025-03-17T22:17:17.618Z',
  },
  {
    _id: new Types.ObjectId(),
    sending_party: profileId4,
    receiving_party: profileId2,
    status: ConnectionStatus.Following,
    created_at: '2025-04-03T22:17:17.618Z',
  },
  {
    _id: new Types.ObjectId(),
    sending_party: profileId2,
    receiving_party: profileId5,
    status: ConnectionStatus.Blocked,
    created_at: '2025-04-01T22:17:17.618Z',
  },
];
