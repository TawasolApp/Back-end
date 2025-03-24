import { Types } from 'mongoose';

export const mockUserId = '60d0fe4f5311236168a109ca';

export const mockPostDto = {
  content: 'This is a mock post',
  media: ['http://example.com/image.jpg'],
  visibility: 'Public',
};

export const mockPostDtoNoMedia = {
  content: 'This is a mock post with no media',
  media: [],
  visibility: 'Public',
};

export const mockPostDtoPrivate = {
  content: 'This is a mock post with private visibility',
  media: ['http://example.com/image.jpg'],
  visibility: 'Private',
};

export const objectId = new Types.ObjectId();

export const mockPost = {
  id: '60d0fe4f5311236168a109cb',
  author_id: '60d0fe4f5311236168a109ca',
  text: 'This is a mock post',
  media: ['http://example.com/image.jpg'],
  react_count: {
    Like: 0,
    Love: 0,
    Funny: 0,
    Celebrate: 0,
    Insightful: 0,
    Support: 0,
  },
  comment_count: 0,
  share_count: 0,
  tags: [],
  visibility: 'Public',
  author_type: 'User',
  posted_at: new Date(),
};

export const mockProfile = {
  _id: '60d0fe4f5311236168a109cc',
  name: 'Mock User',
  profile_picture: 'http://example.com/profile.jpg',
  bio: 'This is a mock bio',
};

export const mockComment = {
  _id: '60d0fe4f5311236168a109cd',
  author_id: '60d0fe4f5311236168a109ca',
  post_id: '60d0fe4f5311236168a109cb',
  content: 'This is a mock comment',
  react_count: 0,
  replies: [],
};

export const mockCommentDto = {
  content: 'This is a mock comment',
};

export const mockReaction = {
  _id: '60d0fe4f5311236168a109ce',
  post_id: '60d0fe4f5311236168a109cb',
  user_id: '60d0fe4f5311236168a109ca',
  react_type: 'Like',
  user_type: 'User',
};

export const mockSave = {
  _id: '60d0fe4f5311236168a109cf',
  user_id: '60d0fe4f5311236168a109ca',
  post_id: '60d0fe4f5311236168a109cb',
};

export const mockCompany = {
  _id: new Types.ObjectId(),
  name: 'Mock Company',
  logo: 'http://example.com/logo.jpg',
  description: 'This is a mock company',
  followers: 100,
};

export const mockEditPostDto = {
  content: 'This is an edited post',
};

// Mock arrays
export const mockProfiles = [
  mockProfile,
  { ...mockProfile, _id: '60d0fe4f5311236168a109dd', name: 'Mock User 2' },
];
export const mockCompanies = [
  mockCompany,
  { ...mockCompany, _id: new Types.ObjectId(), name: 'Mock Company 2' },
];
export const mockReacts = [
  mockReaction,
  { ...mockReaction, _id: new Types.ObjectId(), type: 'Love' },
];
export const mockSaves = [
  mockSave,
  {
    ...mockSave,
    _id: new Types.ObjectId(),
    post_id: '60d0fe4f5311236168a109dd',
  },
];
export const mockComments = [
  mockComment,
  {
    ...mockComment,
    _id: new Types.ObjectId(),
    content: 'This is another mock comment',
  },
];
