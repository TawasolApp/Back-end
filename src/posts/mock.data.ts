import { Types } from 'mongoose';

export const mockUserId = '60d0fe4f5311236168a109ca';
export const mockCompanyId = '60d0fe4f5311236168a109ca';

export const mockPostDto = {
  content: 'This is a mock post',
  media: ['http://example.com/image.jpg'],
  visibility: 'Public',
};

export const mockCreatePostDto = {
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
  is_edited: false,
  is_silent_repost: false,
  parent_post_id: null,
};

export const mockCompanyPost = {
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
  author_type: 'Company',
  posted_at: new Date(),
  is_edited: false,
  is_silent_repost: false,
  parent_post_id: null,
};

export const mockProfile = {
  _id: '60d0fe4f5311236168a109cc',
  first_name: 'Mock',
  last_name: 'User',
  profile_picture: 'http://example.com/profile.jpg',
  bio: 'This is a mock bio',
  headline: 'This is a mock bio',
};

export const mockCompany = {
  _id: '60d0fe4f5311236168a109cc',
  name: 'Mock Company',
  logo: 'http://example.com/logo.jpg',
  description: 'This is a mock company',
  followers: 100,
};

export const mockComment = {
  _id: '60d0fe4f5311236168a109cd',
  author_id: '60d0fe4f5311236168a109ca',
  post_id: '60d0fe4f5311236168a109cb',
  content: 'This is a mock comment',
  react_count: {
    Like: 0,
    Love: 0,
    Funny: 0,
    Celebrate: 0,
    Insightful: 0,
    Support: 0,
  },
  replies: 0,
  commented_at: new Date(),
  tags: [],
  is_edited: false,
  is_following: false,
  is_connected: false,
  author_type: 'User',
};

export const mockReaction = {
  _id: '60d0fe4f5311236168a109ce',
  post_id: '60d0fe4f5311236168a109cb',
  user_id: '60d0fe4f5311236168a109ca',
  react_type: 'Like',
  user_type: 'User',
  post_type: 'Post',
};

export const mockCompanyReaction = {
  _id: '60d0fe4f5311236168a109cf',
  post_id: '60d0fe4f5311236168a109cb',
  user_id: '60d0fe4f5311236168a109ca',
  react_type: 'Like',
  user_type: 'Company',
  post_type: 'Post',
};

export const mockSave = {
  _id: '60d0fe4f5311236168a109cf',
  user_id: '60d0fe4f5311236168a109ca',
  post_id: '60d0fe4f5311236168a109cb',
};

export const mockEditPostDto = {
  content: 'This is an edited post',
};

export const mockGetCommentDto = {
  id: '60d0fe4f5311236168a109cd',
  authorId: '60d0fe4f5311236168a109ca',
  authorName: 'Mock User',
  authorPicture: 'http://example.com/profile.jpg',
  authorBio: 'This is a mock bio',
  authorType: 'User' as 'User' | 'Company',
  content: 'This is a mock comment',
  reactCounts: {
    Like: 0,
    Love: 0,
    Funny: 0,
    Celebrate: 0,
    Insightful: 0,
    Support: 0,
  },
  replies: 0,
  timestamp: new Date().toISOString(),
  isEdited: false,
  postId: '60d0fe4f5311236168a109cb',
  repliesCount: 0,
  taggedUsers: [],
  reactType: null,
  isFollowing: false,
  isConnected: false,
};

export const mockEditCommentDto = {
  content: 'Updated mock comment content',
  tagged: ['507f1f77bcf86cd799439011'],
};

export const mockProfiles = [
  mockProfile,
  {
    ...mockProfile,
    _id: '60d0fe4f5311236168a109dd',
    first_name: 'Mock',
    last_name: 'User 2',
  },
];
export const mockCompanies = [
  mockCompany,
  { ...mockCompany, _id: new Types.ObjectId(), name: 'Mock Company 2' },
];
export const mockReacts = [
  mockReaction,
  { ...mockReaction, _id: new Types.ObjectId(), react_type: 'Love' },
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

export const mockPostWithMedia = {
  ...mockPost,
  media: ['media1.jpg', 'media2.jpg'],
};

export const mockPostWithTags = {
  ...mockPost,
  tags: [new Types.ObjectId(), new Types.ObjectId()],
};

export const mockPostWithShares = {
  ...mockPost,
  share_count: 5,
};

export const mockParentComment = {
  ...mockComment,
  _id: new Types.ObjectId(),
};

export const mockPostWithComments = {
  ...mockPost,
  comment_count: 10,
};

export const mockPostWithReacts = {
  ...mockPost,
  react_count: {
    Like: 5,
    Love: 3,
    Funny: 2,
    Celebrate: 1,
    Insightful: 4,
    Support: 0,
  },
};

export const mockCommentWithReacts = {
  ...mockComment,
  react_count: {
    Like: 1,
    Love: 1,
    Funny: 1,
    Celebrate: 1,
    Insightful: 1,
    Support: 1,
  },
};

export const mockInvalidPostId = 'invalidPostId';
export const mockInvalidUserId = 'invalidUserId';
export const mockInvalidCommentId = 'invalidCommentId';

export const mockCommentDto = {
  content: 'This is a mock comment',
  media: ['http://example.com/comment-image.jpg'],
  tagged: ['60d0fe4f5311236168a109ca'],
  isReply: false,
};

export const mockGetPostDto = {
  id: '60d0fe4f5311236168a109cb',
  authorId: '60d0fe4f5311236168a109ca',
  authorName: 'Mock User',
  authorPicture: 'http://example.com/profile.jpg',
  authorBio: 'This is a mock bio',
  authorType: 'User' as 'User' | 'Company',
  content: 'This is a mock post',
  media: ['http://example.com/image.jpg'],
  reactCounts: {
    Like: 0,
    Love: 0,
    Funny: 0,
    Celebrate: 0,
    Insightful: 0,
    Support: 0,
  },
  comments: 0,
  shares: 0,
  taggedUsers: [],
  visibility: 'Public' as 'Public' | 'Connections' | 'Private',
  reactType: null,
  timestamp: new Date().toISOString(),
  isSaved: false,
  isSilentRepost: false,
  isConnected: false,
  isFollowing: false,
  isEdited: false,
  parentPost: undefined, // Change from null to undefined for type compatibility
};

export const mockPostWithReaction = {
  _id: new Types.ObjectId(),
  react_count: { Like: 0 },
  markModified: jest.fn(),
  save: jest.fn(),
};
