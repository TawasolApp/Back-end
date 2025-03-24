import { Test, TestingModule } from '@nestjs/testing';
import { PostsService } from './posts.service';
import { getModelToken } from '@nestjs/mongoose';
import { Post } from './infrastructure/database/post.schema';
import { Profile } from '../profiles/infrastructure/database/profile.schema';
import { Company } from '../companies/infrastructure/database/company.schema';
import { React } from './infrastructure/database/react.schema';
import { Save } from './infrastructure/database/save.schema';
import { Comment } from './infrastructure/database/comment.schema';
import { Types } from 'mongoose';
import {
  mockUserId,
  mockPostDto,
  mockPostDtoNoMedia,
  mockPostDtoPrivate,
  mockPost,
  mockProfile,
  mockComment,
  mockReaction,
  mockSave,
  mockCompany,
  mockProfiles,
  mockCompanies,
  mockComments,
  mockReacts,
  mockSaves,
  mockEditPostDto,
  mockCommentDto,
} from './mock.data';
import { _ } from '@faker-js/faker/dist/airline-CBNP41sR';
import { mock } from 'node:test';

describe('PostsService', () => {
  let service: PostsService;

  let postModelMock: any;
  let profileModelMock: any;
  let companyModelMock: any;
  let reactModelMock: any;
  let saveModelMock: any;
  let commentModelMock: any;

  beforeEach(async () => {
    // Setup post constructor and instance
    const mockPostInstance = {
      save: jest.fn(),
    };
    postModelMock = jest.fn(() => mockPostInstance);
    postModelMock.save = jest.fn();
    postModelMock.findById = jest.fn();
    postModelMock.deleteOne = jest.fn();
    postModelMock.find = jest.fn();
    postModelMock.skip = jest.fn().mockReturnThis();
    postModelMock.limit = jest.fn().mockReturnThis();
    postModelMock.exec = jest.fn();
    postModelMock.findPostById = jest.fn();

    const mockProfileInstance = {
      profile_picture: 'mockProfilePicture',
      name: 'mockProfileName',
      bio: 'mockProfileBio',
    };
    profileModelMock = jest.fn(() => mockProfileInstance);
    profileModelMock.find = jest.fn();
    profileModelMock.findById = jest.fn();

    const mockCompanyInstance = {
      logo: 'mockCompanyLogo',
      name: 'mockCompanyName',
      bio: 'mockCompanyBio',
    };
    companyModelMock = jest.fn(() => mockCompanyInstance);
    companyModelMock.find = jest.fn();
    companyModelMock.findById = jest.fn();

    const mockReactInstance = {
      save: jest.fn().mockResolvedValue(mockReaction),
    };
    reactModelMock = jest.fn(() => mockReactInstance);
    reactModelMock.findOne = jest.fn();
    reactModelMock.find = jest.fn();
    reactModelMock.deleteOne = jest.fn();
    reactModelMock.deleteMany = jest.fn();
    reactModelMock.updateOne = jest.fn();

    const mockSaveInstance = {};
    saveModelMock = jest.fn(() => mockSaveInstance);
    saveModelMock.exists = jest.fn();
    saveModelMock.findOneAndDelete = jest.fn();
    saveModelMock.find = jest.fn();
    saveModelMock.deleteMany = jest.fn();

    const mockCommentInstance = {
      save: jest.fn().mockResolvedValue(mockComment),
    };
    commentModelMock = jest.fn(() => mockCommentInstance);
    commentModelMock.findById = jest.fn();
    commentModelMock.find = jest.fn();
    commentModelMock.countDocuments = jest.fn();
    commentModelMock.deleteMany = jest.fn();
    commentModelMock.deleteOne = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostsService,
        { provide: getModelToken(Post.name), useValue: postModelMock },
        { provide: getModelToken(Profile.name), useValue: profileModelMock },
        { provide: getModelToken(Company.name), useValue: companyModelMock },
        { provide: getModelToken(React.name), useValue: reactModelMock },
        { provide: getModelToken(Save.name), useValue: saveModelMock },
        { provide: getModelToken(Comment.name), useValue: commentModelMock },
      ],
    }).compile();

    service = module.get<PostsService>(PostsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should add a post', async () => {
    profileModelMock.find.mockReturnValue({
      exec: jest.fn().mockResolvedValue([mockProfile]),
    });

    profileModelMock.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockProfile),
    });

    companyModelMock.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    });

    reactModelMock.findOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    });

    saveModelMock.exists.mockResolvedValue(false);

    const postInstance = {
      save: jest.fn().mockResolvedValue(mockPost),
    };
    postModelMock.mockImplementation(() => postInstance);

    const result = await service.addPost(mockPostDto, mockUserId);

    expect(result).toEqual({
      id: mockPost.id.toString(),
      authorId: mockPost.author_id,
      authorName: mockProfile.name,
      authorPicture: mockProfile.profile_picture,
      authorBio: mockProfile.bio,
      content: mockPost.text,
      media: mockPost.media,
      reactCounts: mockPost.react_count,
      comments: mockPost.comment_count,
      shares: mockPost.share_count,
      taggedUsers: mockPost.tags,
      visibility: mockPost.visibility,
      authorType: mockPost.author_type,
      reactType: null,
      timestamp: mockPost.posted_at,
      isSaved: false,
    });
  });

  it('should add a post with no media', async () => {
    profileModelMock.find.mockReturnValue({
      exec: jest.fn().mockResolvedValue([mockProfile]),
    });

    profileModelMock.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockProfile),
    });

    companyModelMock.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    });

    reactModelMock.findOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    });

    saveModelMock.exists.mockResolvedValue(false);

    const postInstance = {
      save: jest.fn().mockResolvedValue({
        ...mockPost,
        text: mockPostDtoNoMedia.content,
        media: mockPostDtoNoMedia.media,
      }),
    };
    postModelMock.mockImplementation(() => postInstance);

    const result = await service.addPost(mockPostDtoNoMedia, mockUserId);

    expect(result).toEqual({
      id: mockPost.id.toString(),
      authorId: mockPost.author_id,
      authorName: mockProfile.name,
      authorPicture: mockProfile.profile_picture,
      authorBio: mockProfile.bio,
      content: mockPostDtoNoMedia.content,
      media: mockPostDtoNoMedia.media,
      reactCounts: mockPost.react_count,
      comments: mockPost.comment_count,
      shares: mockPost.share_count,
      taggedUsers: mockPost.tags,
      visibility: mockPost.visibility,
      authorType: mockPost.author_type,
      reactType: null,
      timestamp: mockPost.posted_at,
      isSaved: false,
    });
  });

  it('should add a post with private visibility', async () => {
    profileModelMock.find.mockReturnValue({
      exec: jest.fn().mockResolvedValue([mockProfile]),
    });

    profileModelMock.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockProfile),
    });

    companyModelMock.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    });

    reactModelMock.findOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    });

    saveModelMock.exists.mockResolvedValue(false);

    const postInstance = {
      save: jest.fn().mockResolvedValue({
        ...mockPost,
        text: mockPostDtoPrivate.content,
        visibility: mockPostDtoPrivate.visibility,
      }),
    };
    postModelMock.mockImplementation(() => postInstance);

    const result = await service.addPost(mockPostDtoPrivate, mockUserId);

    expect(result).toEqual({
      id: mockPost.id.toString(),
      authorId: mockPost.author_id,
      authorName: mockProfile.name,
      authorPicture: mockProfile.profile_picture,
      authorBio: mockProfile.bio,
      content: mockPostDtoPrivate.content,
      media: mockPost.media,
      reactCounts: mockPost.react_count,
      comments: mockPost.comment_count,
      shares: mockPost.share_count,
      taggedUsers: mockPost.tags,
      visibility: mockPostDtoPrivate.visibility,
      authorType: mockPost.author_type,
      reactType: null,
      timestamp: mockPost.posted_at,
      isSaved: false,
    });
  });

  it('should throw an error if user profile is not found', async () => {
    profileModelMock.find.mockReturnValue({
      exec: jest.fn().mockRejectedValue(new Error('User profile not found')),
    });

    profileModelMock.findById.mockReturnValue({
      exec: jest.fn().mockRejectedValue(new Error('User profile not found')),
    });

    companyModelMock.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    });

    await expect(service.addPost(mockPostDto, mockUserId)).rejects.toThrow(
      'Failed to add post',
    );
  });

  it('should throw an error if post save fails', async () => {
    profileModelMock.find.mockReturnValue({
      exec: jest.fn().mockResolvedValue([mockProfile]),
    });

    profileModelMock.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockProfile),
    });

    companyModelMock.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    });

    reactModelMock.findOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    });

    saveModelMock.exists.mockResolvedValue(false);

    const postInstance = {
      save: jest.fn().mockRejectedValue(new Error('Post save failed')),
    };
    postModelMock.mockImplementation(() => postInstance);

    await expect(service.addPost(mockPostDto, mockUserId)).rejects.toThrow(
      'Failed to add post',
    );
  });

  // Test for editPost
  it('should edit a post', async () => {
    const mockPostId = mockPost.id.toString();
    const postInstance = {
      ...mockPost,
      _id: mockPostId,
      author_id: mockUserId,
      save: jest.fn().mockResolvedValue(mockPost),
    };
    postModelMock.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(postInstance),
    });
    profileModelMock.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockProfile),
    });
    companyModelMock.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    });

    const result = await service.editPost(
      mockPostId,
      mockEditPostDto,
      mockUserId,
    );

    expect(result).toEqual({
      ...mockPost,
      _id: mockPostId,
      author_id: new Types.ObjectId(mockPost.author_id),
      content: mockEditPostDto.content,
      save: expect.any(Function),
    });

    expect(postInstance.save).toHaveBeenCalled();
  });

  // Test for deletePost
  it('should delete a post', async () => {
    postModelMock.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockPost),
    });

    postModelMock.deleteOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue({ deletedCount: 1 }),
    });

    reactModelMock.deleteMany.mockReturnValue({
      exec: jest.fn().mockResolvedValue({ deletedCount: 1 }),
    });

    commentModelMock.deleteMany.mockReturnValue({
      exec: jest.fn().mockResolvedValue({ deletedCount: 1 }),
    });

    saveModelMock.deleteMany.mockReturnValue({
      exec: jest.fn().mockResolvedValue({ deletedCount: 1 }),
    });

    await service.deletePost(mockPost.id.toString(), mockUserId);

    expect(postModelMock.deleteOne).toHaveBeenCalledWith({
      _id: mockPost.id.toString(),
    });
    expect(reactModelMock.deleteMany).toHaveBeenCalledWith({
      post_id: mockPost.id.toString(),
    });
    expect(commentModelMock.deleteMany).toHaveBeenCalledWith({
      post_id: mockPost.id.toString(),
    });
    expect(saveModelMock.deleteMany).toHaveBeenCalledWith({
      post_id: mockPost.id.toString(),
    });
  });

  // Test for getAllPosts
  it('should get all posts', async () => {
    postModelMock.find.mockReturnValue({
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([mockPost]),
    });

    profileModelMock.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockProfile),
    });

    companyModelMock.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockCompany),
    });

    reactModelMock.findOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockReaction),
    });

    saveModelMock.exists.mockResolvedValue(true);

    const result = await service.getAllPosts(1, 10, mockUserId);

    expect(result).toEqual([
      {
        id: mockPost.id.toString(),
        authorId: mockPost.author_id.toString(),
        authorName: mockProfile.name,
        authorPicture: mockProfile.profile_picture,
        authorBio: mockProfile.bio,
        content: mockPost.text,
        media: mockPost.media,
        reactCounts: mockPost.react_count,
        comments: mockPost.comment_count,
        shares: mockPost.share_count,
        taggedUsers: mockPost.tags.map((tag: any) => tag.toString()),
        visibility: mockPost.visibility,
        authorType: mockPost.author_type,
        reactType: mockReaction.react_type,
        timestamp: mockPost.posted_at,
        isSaved: true,
      },
    ]);
  });

  // Test for getUserPosts
  it('should get user posts', async () => {
    postModelMock.find.mockReturnValue({
      exec: jest.fn().mockResolvedValue([mockPost]),
    });

    profileModelMock.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockProfile),
    });

    profileModelMock.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockProfile),
    });

    companyModelMock.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockCompany),
    });

    reactModelMock.findOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockReaction),
    });

    saveModelMock.exists.mockResolvedValue(true);

    const result = await service.getUserPosts(mockUserId, mockUserId);

    expect(result).toEqual([
      {
        id: mockPost.id.toString(),
        authorId: mockPost.author_id.toString(),
        authorName: mockProfile.name,
        authorPicture: mockProfile.profile_picture,
        authorBio: mockProfile.bio,
        content: mockPost.text,
        media: mockPost.media,
        reactCounts: mockPost.react_count,
        comments: mockPost.comment_count,
        shares: mockPost.share_count,
        taggedUsers: mockPost.tags.map((tag: any) => tag.toString()),
        visibility: mockPost.visibility,
        authorType: mockPost.author_type,
        reactType: mockReaction.react_type,
        timestamp: mockPost.posted_at,
        isSaved: true,
      },
    ]);
  });

  // Test for savePost
  it('should save a post', async () => {
    postModelMock.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockPost),
    });

    saveModelMock.exists.mockResolvedValue(false);

    const saveInstance = {
      save: jest.fn().mockResolvedValue(mockSave),
    };
    saveModelMock.mockImplementation(() => saveInstance);

    const result = await service.savePost(mockPost.id.toString(), mockUserId);

    expect(result).toEqual({ message: 'Post saved successfully' });
    expect(saveInstance.save).toHaveBeenCalled();
  });

  // Test for unsavePost
  it('should unsave a post', async () => {
    postModelMock.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockPost),
    });

    saveModelMock.findOneAndDelete.mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockSave),
    });

    const result = await service.unsavePost(mockPost.id.toString(), mockUserId);

    expect(result).toEqual({ message: 'Post unsaved successfully' });
  });

  // Test for addComment
  it('should add a comment', async () => {
    postModelMock.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue({
        ...mockPost,
        save: jest.fn().mockResolvedValue(mockPost),
      }),
    });

    profileModelMock.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockProfile),
    });

    companyModelMock.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    });

    const commentInstance = {
      ...mockComment,
      save: jest.fn().mockResolvedValue(mockComment),
    };
    commentModelMock.mockImplementation(() => commentInstance);

    const result = await service.addComment(
      mockPost.id.toString(),
      mockCommentDto,
      mockUserId,
    );

    expect(result).toEqual({
      _id: mockComment._id.toString(),
      author_id: mockComment.author_id,
      content: mockComment.content,
      post_id: mockComment.post_id,
      react_count: mockComment.react_count,
      replies: mockComment.replies,
      save: expect.any(Function),
    });
    expect(commentInstance.save).toHaveBeenCalled();
  });

  // Test for deleteComment
  it('should delete a comment', async () => {
    commentModelMock.findById.mockReturnValue(mockComment);

    postModelMock.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue({
        ...mockPost,
        save: jest.fn().mockResolvedValue(mockPost),
      }),
    });

    commentModelMock.deleteOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue({ deletedCount: 1 }),
    });

    reactModelMock.find.mockReturnValue({
      exec: jest.fn().mockResolvedValue([mockReaction]),
    });

    reactModelMock.deleteMany.mockReturnValue({
      exec: jest.fn().mockResolvedValue({ deletedCount: 1 }),
    });

    await service.deleteComment(mockComment._id.toString(), mockUserId);

    expect(commentModelMock.findById).toHaveBeenCalledWith(
      mockComment._id.toString(),
    );
    expect(commentModelMock.deleteOne).toHaveBeenCalledWith({
      _id: mockComment._id.toString(),
    });
  });

  // Test for updateReactions
  it('should update reactions on a post', async () => {
    const postInstance = {
      ...mockPost,
      save: jest.fn().mockResolvedValue(mockPost),
    };
    postModelMock.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(postInstance),
    });

    reactModelMock.findOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    });
    profileModelMock.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockProfile),
    });
    companyModelMock.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    });

    const reactInstance = {
      ...mockReaction,
      save: jest.fn().mockResolvedValue(mockReaction),
    };
    reactModelMock.mockImplementation(() => reactInstance);

    const existingReaction = {
      ...mockReaction,
      save: jest.fn().mockResolvedValue(mockReaction),
    };
    reactModelMock.findOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue(existingReaction),
    });

    reactModelMock.deleteOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue({ deletedCount: 1 }),
    });

    const result = await service.updateReactions(
      mockPost.id.toString(),
      mockUserId,
      {
        postType: 'Post',
        reactions: {
          Like: true,
          Love: false,
          Funny: false,
          Celebrate: false,
          Insightful: false,
          Support: false,
        },
      },
    );

    expect(result).toEqual({ ...mockPost, save: expect.any(Function) });
    // expect(existingReaction.save).toHaveBeenCalled();
  });

  // Test for getReactions
  it('should get reactions to a post', async () => {
    postModelMock.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockPost),
    });

    reactModelMock.findOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockReaction),
    });
    profileModelMock.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockProfile),
    });
    companyModelMock.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    });
    reactModelMock.find.mockReturnValue({
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([mockReaction]),
    });

    profileModelMock.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockProfile),
    });

    companyModelMock.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockCompany),
    });

    const result = await service.getReactions(
      mockPost.id.toString(),
      1,
      10,
      mockUserId,
    );

    expect(result).toEqual([
      {
        likeId: mockReaction._id.toString(),
        postId: mockReaction.post_id.toString(),
        authorId: mockReaction.user_id.toString(),
        authorType: mockReaction.user_type,
        type: mockReaction.react_type,
        authorName: mockProfile.name,
        authorPicture: mockProfile.profile_picture,
        authorBio: mockProfile.bio,
      },
    ]);
  });

  // Test for getSavedPosts
  it('should get saved posts', async () => {
    saveModelMock.find.mockReturnValue({
      exec: jest.fn().mockResolvedValue([mockSave]),
    });

    postModelMock.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockPost),
    });

    profileModelMock.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockProfile),
    });
    profileModelMock.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockProfile),
    });

    companyModelMock.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockCompany),
    });

    reactModelMock.findOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockReaction),
    });
    saveModelMock.exists.mockResolvedValue(true);
    const result = await service.getSavedPosts(mockUserId);
    expect(result).toEqual([
      {
        id: mockPost.id.toString(),
        authorId: mockPost.author_id.toString(),
        authorName: mockProfile.name,
        authorPicture: mockProfile.profile_picture,
        authorBio: mockProfile.bio,
        content: mockPost.text,
        media: mockPost.media,
        reactCounts: mockPost.react_count,
        comments: mockPost.comment_count,
        shares: mockPost.share_count,
        taggedUsers: mockPost.tags.map((tag: any) => tag.toString()),
        visibility: mockPost.visibility,
        authorType: mockPost.author_type,
        reactType: mockReaction.react_type,
        timestamp: mockPost.posted_at,
        isSaved: true,
      },
    ]);
  });
});
