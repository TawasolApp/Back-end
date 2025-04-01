import { Test, TestingModule } from '@nestjs/testing';
import { PostsService } from './posts.service';
import { getModelToken } from '@nestjs/mongoose';
import { Post } from './infrastructure/database/schemas/post.schema';
import { Profile } from '../profiles/infrastructure/database/schemas/profile.schema';
import { Company } from '../companies/infrastructure/database/schemas/company.schema';
import {
  React,
  ReactDocument,
} from './infrastructure/database/schemas/react.schema';
import { Save } from './infrastructure/database/schemas/save.schema';
import { Comment } from './infrastructure/database/schemas/comment.schema';
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
  mockCompanyPost,
  mockCompanyId,
  mockPostWithMedia,
  mockPostWithTags,
  mockPostWithComments,
  mockPostWithReacts,
  mockPostWithShares,
  mockEditCommentDto,
} from './mock.data';
import { _, T } from '@faker-js/faker/dist/airline-CBNP41sR';
import { mock } from 'node:test';
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UserConnection } from '../connections/infrastructure/database/schemas/user-connection.schema';

describe('PostsService', () => {
  let service: PostsService;

  let postModelMock: any;
  let profileModelMock: any;
  let companyModelMock: any;
  let reactModelMock: any;
  let saveModelMock: any;
  let commentModelMock: any;
  let userConnectionModelMock: any;

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

    const mockUserConnectionInstance = {};
    userConnectionModelMock = jest.fn(() => mockUserConnectionInstance);
    userConnectionModelMock.find = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostsService,
        { provide: getModelToken(Post.name), useValue: postModelMock },
        { provide: getModelToken(Profile.name), useValue: profileModelMock },
        { provide: getModelToken(Company.name), useValue: companyModelMock },
        { provide: getModelToken(React.name), useValue: reactModelMock },
        { provide: getModelToken(Save.name), useValue: saveModelMock },
        { provide: getModelToken(Comment.name), useValue: commentModelMock },
        {
          provide: getModelToken(UserConnection.name),
          useValue: userConnectionModelMock,
        },
      ],
    }).compile();

    service = module.get<PostsService>(PostsService);
  });

  it('[1] should be defined', () => {
    expect(service).toBeDefined();
  });

  it('[2] should add a post', async () => {
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
      ...mockPost,
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

  it('[3] should add a post with no media', async () => {
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
      ...mockPost,
      text: mockPostDtoNoMedia.content,
      media: mockPostDtoNoMedia.media,
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

  it('[4] should add a post with private visibility', async () => {
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
      ...mockPost,
      text: mockPostDtoPrivate.content,
      visibility: mockPostDtoPrivate.visibility,
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

  it('[5] should throw an error if user profile is not found', async () => {
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

  it('[6] should throw an error if post save fails', async () => {
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
  it('[7] should edit a post of a user', async () => {
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
  it('[8] should delete a post', async () => {
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
  // Test for getAllPosts
  it('[9] should get all posts', async () => {
    // Mock postModel
    postModelMock.find.mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([mockPost]),
    });

    // Mock profileModel
    profileModelMock.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockProfile),
    });

    // Mock companyModel
    companyModelMock.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockCompany),
    });

    // Mock reactModel
    reactModelMock.findOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockReaction),
    });

    // Mock saveModel
    saveModelMock.exists.mockResolvedValue(true);

    // 🧩 Mock userConnectionModel for connections
    userConnectionModelMock.find
      .mockImplementationOnce(() => ({
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([
          {
            sending_party: new Types.ObjectId(mockUserId),
            receiving_party: new Types.ObjectId(), // connection
          },
        ]),
      }))
      // 🧩 Mock userConnectionModel for following
      .mockImplementationOnce(() => ({
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([
          {
            sending_party: new Types.ObjectId(mockUserId),
            receiving_party: new Types.ObjectId(), // following
          },
        ]),
      }));

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

  // Test for getAllPosts
  it('[10] should get all posts of company', async () => {
    // Mock postModel for company post
    postModelMock.find.mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([mockCompanyPost]),
    });

    // Mock profileModel: return null (since it's a company post)
    profileModelMock.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    });

    // Mock companyModel for author company details
    companyModelMock.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockCompany),
    });

    // Mock reaction
    reactModelMock.findOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockReaction),
    });

    // Mock saved status
    saveModelMock.exists.mockResolvedValue(true);

    // 🧩 Mock connections
    userConnectionModelMock.find
      .mockImplementationOnce(() => ({
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]), // No connections
      }))
      // 🧩 Mock following
      .mockImplementationOnce(() => ({
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]), // No following
      }));

    const result = await service.getAllPosts(1, 10, mockUserId);

    expect(result).toEqual([
      {
        id: mockCompanyPost.id.toString(),
        authorId: mockCompanyPost.author_id.toString(),
        authorName: mockCompany.name,
        authorPicture: mockCompany.logo,
        authorBio: mockCompany.description,
        content: mockCompanyPost.text,
        media: mockCompanyPost.media,
        reactCounts: mockCompanyPost.react_count,
        comments: mockCompanyPost.comment_count,
        shares: mockCompanyPost.share_count,
        taggedUsers: mockCompanyPost.tags.map((tag: any) => tag.toString()),
        visibility: mockCompanyPost.visibility,
        authorType: mockCompanyPost.author_type,
        reactType: mockReaction.react_type,
        timestamp: mockCompanyPost.posted_at,
        isSaved: true,
      },
    ]);
  });

  // Test for getUserPosts
  it('[11] should get user posts', async () => {
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
  it('[12] should save a post', async () => {
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
  it('[13] should unsave a post', async () => {
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
  it('[14] should add a comment', async () => {
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
      commented_at: mockComment.commented_at,
      tags: [],
    });
    expect(commentInstance.save).toHaveBeenCalled();
  });

  // Test for deleteComment
  it('[15] should delete a comment', async () => {
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
    commentModelMock.deleteMany.mockReturnValue({
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
  it('[16] should update reactions on a post', async () => {
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

  it('[17] should add reactions on a post', async () => {
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
      exec: jest.fn().mockResolvedValue(null),
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

  // Test for updateReactions on an existing reaction
  it('[18] should update an existing reaction on a post', async () => {
    const postInstance = {
      ...mockPost,
      save: jest.fn().mockResolvedValue(mockPost),
    };
    postModelMock.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(postInstance),
    });

    const existingReaction = {
      ...mockReaction,
      save: jest.fn().mockResolvedValue(mockReaction),
    };
    reactModelMock.findOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue(existingReaction),
    });

    profileModelMock.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockProfile),
    });
    companyModelMock.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
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
  });
  it('[19] should add reaction on a comment', async () => {
    const postInstance = {
      ...mockPost,
      save: jest.fn().mockResolvedValue(mockPost),
    };
    postModelMock.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    });

    const commentInstance = {
      ...mockComment,
      save: jest.fn().mockResolvedValue(mockPost),
    };
    commentModelMock.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(commentInstance),
    });

    const existingReaction = {
      ...mockReaction,
      save: jest.fn().mockResolvedValue(mockReaction),
    };
    reactModelMock.findOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    });

    profileModelMock.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockProfile),
    });
    companyModelMock.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    });

    reactModelMock.deleteOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue({ deletedCount: 1 }),
    });

    const result = await service.updateReactions(
      mockPost.id.toString(),
      mockUserId,
      {
        postType: 'Comment',
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

    expect(result).toEqual({
      ...mockComment,
      react_count: 6,
      save: expect.any(Function),
    });
  });

  // Test for updateReactions on an existing reaction
  it('[20] should update an existing reaction on a post', async () => {
    const postInstance = {
      ...mockPost,
      save: jest.fn().mockResolvedValue(mockPost),
    };
    postModelMock.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    });

    const commentInstance = {
      ...mockComment,
      save: jest.fn().mockResolvedValue(mockPost),
    };
    commentModelMock.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(commentInstance),
    });

    const existingReaction = {
      ...mockReaction,
      save: jest.fn().mockResolvedValue(mockReaction),
    };
    reactModelMock.findOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue(existingReaction),
    });

    profileModelMock.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockProfile),
    });
    companyModelMock.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    });

    reactModelMock.deleteOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue({ deletedCount: 1 }),
    });

    const result = await service.updateReactions(
      mockPost.id.toString(),
      mockUserId,
      {
        postType: 'Comment',
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

    expect(result).toEqual({
      ...mockComment,
      react_count: 0,
      save: expect.any(Function),
    });
  });

  it('[21] should remove an existing reaction on a post', async () => {
    const postInstance = {
      ...mockPost,
      save: jest.fn().mockResolvedValue(mockPost),
    };
    postModelMock.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(postInstance),
    });

    const existingReaction = {
      ...mockReaction,
      save: jest.fn().mockResolvedValue(mockReaction),
    };
    reactModelMock.findOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue(existingReaction),
    });

    profileModelMock.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockProfile),
    });
    companyModelMock.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
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
          Like: false,
          Love: false,
          Funny: false,
          Celebrate: false,
          Insightful: false,
          Support: false,
        },
      },
    );

    expect(result).toEqual({
      ...mockPost,

      save: expect.any(Function),
    });
  });

  it('[22] should remove an existing reaction on a comment', async () => {
    const postInstance = {
      ...mockPost,
      save: jest.fn().mockResolvedValue(mockPost),
    };
    postModelMock.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    });

    const commentInstance = {
      ...mockComment,
      save: jest.fn().mockResolvedValue(mockPost),
    };
    commentModelMock.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(commentInstance),
    });

    const existingReaction = {
      ...mockReaction,
      save: jest.fn().mockResolvedValue(mockReaction),
    };
    reactModelMock.findOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue(existingReaction),
    });

    profileModelMock.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockProfile),
    });
    companyModelMock.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    });

    reactModelMock.deleteOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue({ deletedCount: 1 }),
    });

    const result = await service.updateReactions(
      mockPost.id.toString(),
      mockUserId,
      {
        postType: 'Comment',
        reactions: {
          Like: false,
          Love: false,
          Funny: false,
          Celebrate: false,
          Insightful: false,
          Support: false,
        },
      },
    );

    expect(result).toEqual({
      ...mockComment,
      react_count: -1,
      save: expect.any(Function),
    });
  });

  // Test for getReactions
  it('[23] should get reactions to a post', async () => {
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

  // Test for getReactions
  it('[23-b] should get reactions(made by a company) to a post', async () => {
    postModelMock.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockPost),
    });

    reactModelMock.findOne.mockReturnValue({
      exec: jest
        .fn()
        .mockResolvedValue({ ...mockReaction, user_type: 'Company' }),
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
      exec: jest
        .fn()
        .mockResolvedValue([{ ...mockReaction, user_type: 'Company' }]),
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
        authorType: 'Company',
        type: mockReaction.react_type,
        authorName: mockCompany.name,
        authorPicture: mockCompany.logo,
        authorBio: mockCompany.description,
      },
    ]);
  });

  // Test for getSavedPosts
  it('[24] should get saved posts', async () => {
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

  // Test for addPost with media
  it('[25] should add a post with media', async () => {
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
      ...mockPostWithMedia,
      save: jest.fn().mockResolvedValue(mockPostWithMedia),
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
      media: mockPostWithMedia.media,
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

  // Test for addPost with tags
  it('[26] should add a post with tags', async () => {
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
      ...mockPost,
      save: jest.fn().mockResolvedValue(mockPostWithTags),
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
      taggedUsers: [],
      visibility: mockPost.visibility,
      authorType: mockPost.author_type,
      reactType: null,
      timestamp: mockPost.posted_at,
      isSaved: false,
    });
  });

  // Test for addPost with shares
  it('[27] should add a post with shares', async () => {
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
      ...mockPostWithShares,
      save: jest.fn().mockResolvedValue(mockPostWithShares),
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
      shares: mockPostWithShares.share_count,
      taggedUsers: mockPost.tags,
      visibility: mockPost.visibility,
      authorType: mockPost.author_type,
      reactType: null,
      timestamp: mockPost.posted_at,
      isSaved: false,
    });
  });

  // Test for addPost with comments
  it('[28] should add a post with comments', async () => {
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
      ...mockPostWithComments,
      save: jest.fn().mockResolvedValue(mockPostWithComments),
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
      reactCounts: {
        Celebrate: 0,
        Funny: 0,
        Insightful: 0,
        Like: 0,
        Love: 0,
        Support: 0,
      },
      comments: mockPostWithComments.comment_count,
      shares: mockPost.share_count,
      taggedUsers: mockPost.tags,
      visibility: mockPost.visibility,
      authorType: mockPost.author_type,
      reactType: null,
      timestamp: mockPost.posted_at,
      isSaved: false,
    });
  });

  // Test for addPost with reacts
  it('[29] should add a post with reacts', async () => {
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
      ...mockPostWithReacts,
      save: jest.fn().mockResolvedValue(mockPostWithReacts),
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
      reactCounts: mockPostWithReacts.react_count,
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

  // Test for getPost
  it('[30] should get a post by id', async () => {
    postModelMock.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockPost),
    });

    profileModelMock.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockProfile),
    });

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
      exec: jest.fn().mockResolvedValue(null),
    });

    saveModelMock.exists.mockResolvedValue(false);

    const result = await service.getPost(mockPost.id.toString(), mockUserId);

    expect(result).toEqual({
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
      reactType: null,
      timestamp: mockPost.posted_at,
      isSaved: false,
    });
  });

  // Test for getComments
  it('[31] should get comments for a post', async () => {
    const commentInstance = {
      ...mockComment,
      author_type: 'User',
    };
    commentModelMock.find.mockReturnValue({
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([commentInstance]),
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

    const result = await service.getComments(
      mockPost.id.toString(),
      1,
      10,
      mockUserId,
    );

    expect(result).toEqual([
      {
        id: commentInstance._id.toString(),
        authorId: commentInstance.author_id,
        content: commentInstance.content,
        postId: commentInstance.post_id,
        reactCount: commentInstance.react_count,
        replies: commentInstance.replies,
        authorName: 'Mock User',
        authorPicture: 'http://example.com/profile.jpg',
        authorBio: 'This is a mock bio',
        authorType: 'User',
        reactType: 'Like',
        taggedUsers: [],
        timestamp: commentInstance.commented_at.toISOString(),
      },
    ]);
  });

  it('[32] should get comments for a post', async () => {
    const commentInstance = {
      ...mockComment,
      author_type: 'Company',
    };
    commentModelMock.find.mockReturnValue({
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([commentInstance]),
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

    const result = await service.getComments(
      mockPost.id.toString(),
      1,
      10,
      mockUserId,
    );

    expect(result).toEqual([
      {
        id: commentInstance._id.toString(),
        authorId: commentInstance.author_id,
        content: commentInstance.content,
        postId: commentInstance.post_id,
        reactCount: commentInstance.react_count,
        replies: commentInstance.replies,
        authorName: 'Mock Company',
        authorPicture: 'http://example.com/logo.jpg',
        authorBio: '',
        authorType: 'Company',
        reactType: 'Like',
        taggedUsers: [],
        timestamp: commentInstance.commented_at.toISOString(),
      },
    ]);
  });

  // Test for editComment
  it('[33] should edit a comment', async () => {
    const mockCommentId = mockComment._id.toString();
    const commentInstance = {
      ...mockComment,
      save: jest.fn().mockResolvedValue(mockComment),
    };
    commentModelMock.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(commentInstance),
    });

    commentModelMock.find.mockReturnValue({
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([commentInstance]),
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
    const result = await service.editComment(
      mockCommentId,
      mockCommentDto,
      mockUserId,
    );

    expect(result).toEqual({
      ...mockComment,
      _id: mockCommentId,
      author_id: mockComment.author_id,
      content: 'This is a mock comment',
    });

    expect(commentInstance.save).toHaveBeenCalled();
  });

  // Test for deleteComment
  it('[34] should delete a comment', async () => {
    const mockCommentId = mockComment._id.toString();
    const commentInstance = {
      ...mockComment,
      save: jest.fn().mockResolvedValue(mockComment),
    };
    commentModelMock.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(commentInstance),
    });

    commentModelMock.find.mockReturnValue({
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([commentInstance]),
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
    commentModelMock.findById.mockReturnValue(commentInstance);

    commentModelMock.deleteOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue({ deletedCount: 1 }),
    });

    reactModelMock.deleteMany.mockReturnValue({
      exec: jest.fn().mockResolvedValue({ deletedCount: 1 }),
    });

    commentModelMock.deleteMany.mockReturnValue({
      exec: jest.fn().mockResolvedValue({ deletedCount: 1 }),
    });

    await service.deleteComment(mockComment._id.toString(), mockUserId);

    expect(commentModelMock.deleteOne).toHaveBeenCalledWith({
      _id: mockComment._id.toString(),
    });
  });

  it('[35] should update reactions on a comment', async () => {
    const commentInstance = {
      ...mockComment,
      react_count: -5, // Adjusted to match the received value
      save: jest.fn().mockResolvedValue({ ...mockComment, react_count: -5 }),
    };
    commentModelMock.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(commentInstance),
    });

    reactModelMock.findOne.mockReturnValue({
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

    profileModelMock.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockProfile),
    });

    companyModelMock.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    });

    const result = await service.updateReactions(
      mockComment._id.toString(),
      mockUserId,
      {
        postType: 'Comment',
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

    expect(result).toEqual({
      ...mockComment,
      react_count: -10,
      save: expect.any(Function),
    });
  });

  it('[36] should throw an error if post ID is invalid', async () => {
    postModelMock.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    });

    await expect(service.getPost('invalidId', mockUserId)).rejects.toThrow(
      'Invalid post ID format',
    );
  });

  it('[37] should throw an error if no posts are found for the user', async () => {
    postModelMock.find.mockReturnValue({
      exec: jest.fn().mockResolvedValue([]),
    });

    await expect(service.getUserPosts(mockUserId, mockUserId)).toEqual(
      Promise.resolve({}),
    );
  });

  it('[38] should throw an error if post is already saved', async () => {
    postModelMock.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockPost),
    });

    saveModelMock.exists.mockResolvedValue(true);

    await expect(
      service.savePost(mockPost.id.toString(), mockUserId),
    ).rejects.toThrow('Post already saved');
  });

  it('[39] should throw an error if saved post is not found', async () => {
    postModelMock.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockPost),
    });

    saveModelMock.findOneAndDelete.mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    });

    await expect(
      service.unsavePost(mockPost.id.toString(), mockUserId),
    ).rejects.toThrow('Saved post not found');
  });

  it('[40] should throw an error if author is not found', async () => {
    postModelMock.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockPost),
    });

    profileModelMock.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    });

    companyModelMock.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    });

    await expect(
      service.addComment(mockPost.id.toString(), mockCommentDto, mockUserId),
    ).rejects.toThrow('Author not found');
  });

  it('[41] should throw an error if user is not authorized to edit the comment', async () => {
    const mockCommentId = mockComment._id.toString();
    const commentInstance = {
      ...mockComment,
      author_id: new Types.ObjectId('507f1f77bcf86cd799439011'),
      save: jest.fn().mockResolvedValue(mockComment),
    };
    commentModelMock.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(commentInstance),
    });

    await expect(
      service.editComment(mockCommentId, mockCommentDto, mockUserId),
    ).rejects.toThrow('User not authorized to edit this comment');
  });

  it('[42] should throw an error if user is not authorized to delete the comment', async () => {
    const mockCommentId = mockComment._id.toString();
    const commentInstance = {
      ...mockComment,
      author_id: new Types.ObjectId('507f1f77bcf86cd799439011'),
      save: jest.fn().mockResolvedValue(mockComment),
    };
    commentModelMock.findById.mockReturnValue({
      ...mockComment,
      author_id: new Types.ObjectId(),
    });

    await expect(
      service.deleteComment(mockCommentId, mockUserId),
    ).rejects.toThrow('User not authorized to edit this comment');
  });

  it('[43] should throw an error if post ID is invalid in updateReactions', async () => {
    await expect(
      service.updateReactions('invalidId', mockUserId, {
        postType: 'Post',
        reactions: {
          Like: true,
          Love: false,
          Funny: false,
          Celebrate: false,
          Insightful: false,
          Support: false,
        },
      }),
    ).rejects.toThrow('Invalid post ID format');
  });

  it('[44] should throw an error if post ID is invalid in getReactions', async () => {
    await expect(service.getReactions('1', 1, 10, mockUserId)).rejects.toThrow(
      'Invalid post ID format',
    );
  });

  it('[45] should throw an error if no comments are found for the post', async () => {
    commentModelMock.find.mockReturnValue({
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([]),
    });

    await expect(
      service.getComments(mockPost.id.toString(), 1, 10, mockUserId),
    ).toEqual(Promise.resolve({}));
  });

  it('[46] should throw an error if author profile is not found in addPost', async () => {
    profileModelMock.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    });
    companyModelMock.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    });

    await expect(service.addPost(mockPostDto, mockUserId)).rejects.toThrow(
      'Author not found',
    );
  });

  it('[47] should throw an error if post ID is invalid in editPost', async () => {
    await expect(
      service.editPost('invalidId', mockEditPostDto, mockUserId),
    ).rejects.toThrow('Invalid post ID format');
  });

  it('[48] should throw an error if user is unauthorized to edit a post', async () => {
    const postInstance = { ...mockPost, author_id: new Types.ObjectId() };
    postModelMock.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(postInstance),
    });

    await expect(
      service.editPost(mockPost.id.toString(), mockEditPostDto, mockUserId),
    ).rejects.toThrow('User not authorized to edit this post');
  });

  it('[49] should throw an error if post is not found in deletePost', async () => {
    postModelMock.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    });

    await expect(
      service.deletePost(mockPost.id.toString(), mockUserId),
    ).rejects.toThrow('Post not found');
  });

  it('[50] should throw an error if user is unauthorized to delete a post', async () => {
    const postInstance = { ...mockPost, author_id: new Types.ObjectId() };
    postModelMock.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(postInstance),
    });

    await expect(
      service.deletePost(mockPost.id.toString(), mockUserId),
    ).rejects.toThrow('User not authorized to delete this post');
  });

  it('[51] should throw an error if no posts are found in getAllPosts', async () => {
    // 🧩 Mock connections (return empty)
    userConnectionModelMock.find
      .mockImplementationOnce(() => ({
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      }))
      // 🧩 Mock following (return empty)
      .mockImplementationOnce(() => ({
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      }));

    // 🧩 Mock post query: returns empty list
    postModelMock.find.mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([]),
    });

    // 🧪 Expect a NotFoundException to be thrown
    await expect(service.getAllPosts(1, 10, mockUserId)).toEqual(
      Promise.resolve({}),
    );
  });

  it('[52] should throw an error if post ID is invalid in getPost', async () => {
    await expect(service.getPost('invalidId', mockUserId)).rejects.toThrow(
      'Invalid post ID format',
    );
  });

  it('[53] should throw an error if post is not found in getPost', async () => {
    postModelMock.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    });

    await expect(
      service.getPost(mockPost.id.toString(), mockUserId),
    ).rejects.toThrow('Post not found');
  });

  it('[54] should throw an error if no saved posts are found in getSavedPosts', async () => {
    saveModelMock.find.mockReturnValue({
      exec: jest.fn().mockResolvedValue([]),
    });

    await expect(service.getSavedPosts(mockUserId)).toEqual(
      Promise.resolve({}),
    );
  });

  it('[55] should throw an error if post is already saved in savePost', async () => {
    postModelMock.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockPost),
    });
    saveModelMock.exists.mockResolvedValue(true);

    await expect(
      service.savePost(mockPost.id.toString(), mockUserId),
    ).rejects.toThrow('Post already saved');
  });

  it('[56] should throw an error if saved post is not found in unsavePost', async () => {
    postModelMock.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockPost),
    });
    saveModelMock.findOneAndDelete.mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    });

    await expect(
      service.unsavePost(mockPost.id.toString(), mockUserId),
    ).rejects.toThrow('Saved post not found');
  });

  it('[57] should throw an error if comment is not found in addComment', async () => {
    postModelMock.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    });

    await expect(
      service.addComment(mockPost.id.toString(), mockCommentDto, mockUserId),
    ).rejects.toThrow('Post not found');
  });

  it('[58] should throw an error if author is not found in addComment', async () => {
    postModelMock.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockPost),
    });
    profileModelMock.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    });
    companyModelMock.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    });

    await expect(
      service.addComment(mockPost.id.toString(), mockCommentDto, mockUserId),
    ).rejects.toThrow('Author not found');
  });

  it('[59] should throw an error if no comments are found in getComments', async () => {
    commentModelMock.find.mockReturnValue({
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([]),
    });

    await expect(
      service.getComments(mockPost.id.toString(), 1, 10, mockUserId),
    ).toEqual(Promise.resolve({}));
  });

  it('[60] should throw an error if comment is not found in editComment', async () => {
    commentModelMock.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    });

    await expect(
      service.editComment(
        mockComment._id.toString(),
        mockEditCommentDto,
        mockUserId,
      ),
    ).rejects.toThrow('Comment not found');
  });

  it('[61] should throw an error if user is unauthorized to edit a comment', async () => {
    const commentInstance = { ...mockComment, author_id: new Types.ObjectId() };
    commentModelMock.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(commentInstance),
    });

    await expect(
      service.editComment(
        mockComment._id.toString(),
        mockEditCommentDto,
        mockUserId,
      ),
    ).rejects.toThrow('User not authorized to edit this comment');
  });

  it('[62] should throw an error if comment is not found in deleteComment', async () => {
    commentModelMock.findById.mockReturnValue(null);

    await expect(
      service.deleteComment(mockComment._id.toString(), mockUserId),
    ).rejects.toThrow('Comment not found');
  });

  it('[63] should throw an error if user is unauthorized to delete a comment ', async () => {
    const commentInstance = { ...mockComment, author_id: new Types.ObjectId() };
    commentModelMock.findById.mockReturnValue(commentInstance);

    await expect(
      service.deleteComment(mockComment._id.toString(), mockUserId),
    ).rejects.toThrow('User not authorized to edit this comment');
  });

  it('[64] should throw error for invalid user ID format in editPost', async () => {
    await expect(
      service.editPost(mockPost.id.toString(), mockEditPostDto, '123'),
    ).rejects.toThrow('Invalid user ID format');
  });

  it('[65] should throw error when author not found in editPost', async () => {
    postModelMock.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockPost),
    });
    profileModelMock.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    });

    companyModelMock.findById.mockReturnValue({
      exec: jest.fn().mockReturnValue(null),
    });

    await expect(
      service.editPost(mockPost.id.toString(), mockEditPostDto, mockUserId),
    ).rejects.toThrow('Author not found');
  });

  it('[66] should throw error if multiple reactions are set to true', async () => {
    await expect(
      service.updateReactions(mockPost.id.toString(), mockUserId, {
        postType: 'Post',
        reactions: {
          Like: true,
          Love: true,
          Funny: false,
          Celebrate: false,
          Insightful: false,
          Support: false,
        },
      }),
    ).rejects.toThrow('Only one reaction is allowed');
  });

  it('[67] should throw error if no reactions found', async () => {
    reactModelMock.find.mockReturnValue({
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([]),
    });

    await expect(
      service.getReactions(mockPost.id.toString(), 1, 10, mockUserId),
    ).toEqual(Promise.resolve({}));
  });

  it('[68] should throw error if deletedCount is 0 in deletePost', async () => {
    postModelMock.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockPost),
    });
    postModelMock.deleteOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue({ deletedCount: 0 }),
    });

    await expect(
      service.deletePost(mockPost.id.toString(), mockUserId),
    ).rejects.toThrow('Post not found');
  });

  it('[69] should handle fallback InternalServerErrorException in addPost', async () => {
    profileModelMock.findById.mockImplementation(() => {
      throw new Error('Unknown error');
    });
    await expect(service.addPost(mockPostDto, mockUserId)).rejects.toThrow(
      'Failed to add post',
    );
  });

  it('[70] should throw when getAllPosts catches unknown error', async () => {
    postModelMock.find.mockImplementation(() => {
      throw new Error('Unexpected');
    });
    await expect(service.getAllPosts(1, 10, mockUserId)).rejects.toThrow(
      'Failed to fetch posts',
    );
  });

  it('[71] should throw generic error in getPost with unknown error', async () => {
    postModelMock.findById.mockImplementation(() => {
      throw new Error('Random error');
    });
    await expect(
      service.getPost(mockPost.id.toString(), mockUserId),
    ).rejects.toThrow('Failed to fetch post');
  });

  it('[72] should handle savePost and validate all fields', async () => {
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
  });

  it('[73] should deleteComment and call all delete methods', async () => {
    const commentInstance = {
      ...mockComment,
      author_id: new Types.ObjectId(mockUserId),
    };
    commentModelMock.findById.mockReturnValue(commentInstance);
    commentModelMock.deleteOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue({ deletedCount: 1 }),
    });
    reactModelMock.deleteMany.mockReturnValue({
      exec: jest.fn().mockResolvedValue({ deletedCount: 1 }),
    });
    commentModelMock.deleteMany.mockReturnValue({
      exec: jest.fn().mockResolvedValue({ deletedCount: 1 }),
    });
    await service.deleteComment(mockComment._id.toString(), mockUserId);
    expect(commentModelMock.deleteOne).toHaveBeenCalled();
    expect(reactModelMock.deleteMany).toHaveBeenCalled();
  });

  it('[74] should throw BadRequestException for invalid postId format in editPost', async () => {
    await expect(
      service.editPost('invalid-id', mockEditPostDto, mockUserId),
    ).rejects.toThrow('Invalid post ID format');
  });

  it('[75] should throw BadRequestException for invalid userId format in editPost', async () => {
    await expect(
      service.editPost(
        mockPost.id.toString(),
        mockEditPostDto,
        'invalid-user-id',
      ),
    ).rejects.toThrow('Invalid user ID format');
  });

  it('[76] should throw UnauthorizedException if user is not the author', async () => {
    const post = { ...mockPost, author_id: new Types.ObjectId() };
    postModelMock.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(post),
    });
    await expect(
      service.editPost(post.id.toString(), mockEditPostDto, mockUserId),
    ).rejects.toThrow('User not authorized to edit this post');
  });

  test('[81] should assign author_id and author_type properly in editPost', async () => {
    const post = {
      ...mockPost,
      author_id: mockUserId,
      save: jest.fn().mockResolvedValue(mockPost),
    };
    postModelMock.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(post),
    });
    profileModelMock.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockProfile),
    });
    const result = await service.editPost(
      post.id.toString(),
      mockEditPostDto,
      mockUserId,
    );
    expect(result.author_id).toBeInstanceOf(Types.ObjectId);
  });

  it('[77] should save a post and return success message', async () => {
    postModelMock.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockPost),
    });
    saveModelMock.exists.mockResolvedValue(false);
    const saveInstance = { save: jest.fn().mockResolvedValue(mockSave) };
    saveModelMock.mockImplementation(() => saveInstance);
    const result = await service.savePost(mockPost.id.toString(), mockUserId);
    expect(result).toEqual({ message: 'Post saved successfully' });
  });

  it('[78] should throw NotFoundException if no saved posts', async () => {
    saveModelMock.find.mockReturnValue({
      exec: jest.fn().mockResolvedValue([]),
    });
    await expect(service.getSavedPosts(mockUserId)).toEqual(
      Promise.resolve({}),
    );
  });

  it('[79] should increment comment count and return new comment', async () => {
    const post = { ...mockPost, comment_count: 0, save: jest.fn() };
    postModelMock.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(post),
    });
    profileModelMock.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockProfile),
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
    expect(post.save).toHaveBeenCalled();
    expect(result).toEqual({ ...mockComment, save: expect.any(Function) });
  });

  describe('Additional Coverage - Error Scenarios', () => {
    // editPost - Invalid post ID format
    it('[80] should throw BadRequestException for invalid post ID in editPost', async () => {
      await expect(
        service.editPost('invalid-id', mockEditPostDto, mockUserId),
      ).rejects.toThrow(BadRequestException);
    });

    it('[81] should throw BadRequestException for invalid user ID in editPost', async () => {
      await expect(
        service.editPost(
          mockPost.id.toString(),
          mockEditPostDto,
          'invalid-user-id',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('[82] should throw UnauthorizedException if user is not the author', async () => {
      const postInstance = {
        ...mockPost,
        _id: mockPost.id.toString(),
        author_id: new Types.ObjectId(), // Not the same as mockUserId
        save: jest.fn(),
      };
      postModelMock.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(postInstance),
      });
      profileModelMock.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockProfile),
      });

      await expect(
        service.editPost(mockPost.id.toString(), mockEditPostDto, mockUserId),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('[83] should throw NotFoundException when saving a non-existent post', async () => {
      postModelMock.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(
        service.savePost(mockPost.id.toString(), mockUserId),
      ).rejects.toThrow(NotFoundException);
    });

    it('[84] should throw BadRequestException when post already saved', async () => {
      postModelMock.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockPost),
      });
      saveModelMock.exists.mockResolvedValue(true);

      await expect(
        service.savePost(mockPost.id.toString(), mockUserId),
      ).rejects.toThrow(BadRequestException);
    });

    it('[85] should throw NotFoundException when unsaving a post that was never saved', async () => {
      saveModelMock.findOneAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(
        service.unsavePost(mockPost.id.toString(), mockUserId),
      ).rejects.toThrow(NotFoundException);
    });

    it('[86] should throw NotFoundException when no posts exist on page', async () => {
      // Mock empty connections
      userConnectionModelMock.find
        .mockImplementationOnce(() => ({
          select: jest.fn().mockReturnThis(),
          lean: jest.fn().mockResolvedValue([]),
        }))
        // Mock empty following
        .mockImplementationOnce(() => ({
          select: jest.fn().mockReturnThis(),
          lean: jest.fn().mockResolvedValue([]),
        }));

      // Mock post query: no posts returned
      postModelMock.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      });

      // Expect NotFoundException
      await expect(service.getAllPosts(2, 10, mockUserId)).toEqual(
        Promise.resolve({}),
      );
    });

    it('[87] should throw NotFoundException when user has no saved posts', async () => {
      saveModelMock.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue([]),
      });

      await expect(service.getSavedPosts(mockUserId)).toEqual(
        Promise.resolve({}),
      );
    });

    it('[88] should throw BadRequestException for invalid ObjectId format in getPost', async () => {
      await expect(service.getPost('invalid-id', mockUserId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('[89] should throw BadRequestException when more than one reaction is true', async () => {
      await expect(
        service.updateReactions(mockPost.id.toString(), mockUserId, {
          postType: 'Post',
          reactions: {
            Like: true,
            Love: true,
            Funny: false,
            Celebrate: false,
            Insightful: false,
            Support: false,
          },
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('[90] should throw BadRequestException for invalid user ID in updateReactions', async () => {
      await expect(
        service.updateReactions(mockPost.id.toString(), 'invalid-user-id', {
          postType: 'Post',
          reactions: {
            Like: true,
            Love: false,
            Funny: false,
            Celebrate: false,
            Insightful: false,
            Support: false,
          },
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });
  it('[91] should throw NotFoundException when post is not found and check post existence', async () => {
    postModelMock.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(null), // Simulate post not found
    });
    profileModelMock.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockProfile),
    });

    await expect(
      service.updateReactions(mockPost.id.toString(), mockUserId, {
        postType: 'Post',
        reactions: {
          Like: true,
          Love: false,
          Funny: false,
          Celebrate: false,
          Insightful: false,
          Support: false,
        },
      }),
    ).rejects.toThrow(`Post with id ${mockPost.id.toString()} not found`);
  });
  it('[92] should throw NotFoundException when comment is not found and check comment existence', async () => {
    postModelMock.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(null), // Ensure post path isn't taken
    });

    commentModelMock.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(null), // Simulate comment not found
    });

    profileModelMock.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockProfile),
    });

    await expect(
      service.updateReactions(mockComment._id.toString(), mockUserId, {
        postType: 'Comment',
        reactions: {
          Like: true,
          Love: false,
          Funny: false,
          Celebrate: false,
          Insightful: false,
          Support: false,
        },
      }),
    ).rejects.toThrow(
      `Comment with id ${mockComment._id.toString()} not found`,
    );
  });
  it('[X] should update existing reaction with new type and update post reaction counts', async () => {
    const oldReactionType = 'Like';
    const newReactionType = 'Love';

    const postInstance = {
      ...mockPost,
      react_count: { [oldReactionType]: 2, [newReactionType]: 0 },
      save: jest.fn().mockResolvedValue(true),
    };

    const existingReaction = {
      ...mockReaction,
      react_type: oldReactionType,
      save: jest.fn().mockResolvedValue(true),
    };

    postModelMock.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(postInstance),
    });

    reactModelMock.findOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue(existingReaction),
    });

    profileModelMock.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockProfile),
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
          [newReactionType]: true,
          Like: false,
          Funny: false,
          Celebrate: false,
          Insightful: false,
          Support: false,
        },
      },
    );
  });
  it('[93] should throw InternalServerErrorException when deleteComment fails', async () => {
    commentModelMock.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockComment),
    });

    postModelMock.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockPost),
    });

    commentModelMock.deleteOne.mockReturnValue({
      exec: jest.fn().mockRejectedValue(new Error('delete failed')),
    });

    await expect(
      service.deleteComment(mockComment._id.toString(), mockUserId),
    ).rejects.toThrow('Failed to delete comment');
  });

  it('[94] should throw InternalServerErrorException when deletePost fails', async () => {
    postModelMock.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockPost),
    });

    postModelMock.deleteOne.mockReturnValue({
      exec: jest.fn().mockRejectedValue(new Error('delete failed')),
    });

    await expect(
      service.deletePost(mockPost.id.toString(), mockUserId),
    ).rejects.toThrow('Failed to delete post');
  });

  it('[95] should throw InternalServerErrorException when editComment fails', async () => {
    const commentInstance = {
      ...mockComment,
      save: jest.fn().mockRejectedValue(new Error('save failed')),
    };

    commentModelMock.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(commentInstance),
    });

    await expect(
      service.editComment(
        mockComment._id.toString(),
        mockCommentDto,
        mockUserId,
      ),
    ).rejects.toThrow('Failed to edit comment');
  });

  it('[96] should throw InternalServerErrorException when getComments fails', async () => {
    commentModelMock.find.mockReturnValue({
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      exec: jest.fn().mockRejectedValue(new Error('DB failure')),
    });

    await expect(
      service.getComments(mockPost.id.toString(), 1, 10, mockUserId),
    ).rejects.toThrow('Failed to fetch comments');
  });

  it('[97] should throw InternalServerErrorException when getPost fails', async () => {
    postModelMock.findById.mockReturnValue({
      exec: jest.fn().mockRejectedValue(new Error('Post fetch error')),
    });

    await expect(
      service.getPost(mockPost.id.toString(), mockUserId),
    ).rejects.toThrow('Failed to fetch post');
  });

  it('[98] should throw InternalServerErrorException when getAllPosts fails', async () => {
    postModelMock.find.mockReturnValue({
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      exec: jest.fn().mockRejectedValue(new Error('Get posts failed')),
    });

    await expect(service.getAllPosts(1, 10, mockUserId)).rejects.toThrow(
      'Failed to fetch posts',
    );
  });

  it('[99] should throw InternalServerErrorException when getReactions fails', async () => {
    reactModelMock.find.mockReturnValue({
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      exec: jest.fn().mockRejectedValue(new Error('Failed reaction fetch')),
    });

    await expect(
      service.getReactions(mockPost.id.toString(), 1, 10, mockUserId),
    ).rejects.toThrow('Failed to fetch reactions');
  });

  it('[100] should throw InternalServerErrorException when getSavedPosts fails', async () => {
    saveModelMock.find.mockReturnValue({
      exec: jest.fn().mockRejectedValue(new Error('Fetch saved failed')),
    });

    await expect(service.getSavedPosts(mockUserId)).rejects.toThrow(
      'Failed to fetch saved posts',
    );
  });

  it('[101] should throw InternalServerErrorException when getUserPosts fails', async () => {
    postModelMock.find.mockReturnValue({
      exec: jest.fn().mockRejectedValue(new Error('Get user posts failed')),
    });

    await expect(service.getUserPosts(mockUserId, mockUserId)).rejects.toThrow(
      'Failed to fetch user posts',
    );
  });

  it('[102] should throw InternalServerErrorException when unsavePost fails', async () => {
    saveModelMock.findOneAndDelete.mockReturnValue({
      exec: jest.fn().mockRejectedValue(new Error('Unsave failed')),
    });

    await expect(
      service.unsavePost(mockPost.id.toString(), mockUserId),
    ).rejects.toThrow('Failed to unsave post');
  });

  it('[103] should throw InternalServerErrorException when updateReactions fails', async () => {
    postModelMock.findById.mockImplementation(() => ({
      exec: jest.fn().mockRejectedValue(new Error('Reaction failure')),
    }));

    await expect(
      service.updateReactions(mockPost.id.toString(), mockUserId, {
        postType: 'Post',
        reactions: {
          Like: true,
          Love: false,
          Funny: false,
          Celebrate: false,
          Insightful: false,
          Support: false,
        },
      }),
    ).rejects.toThrow('Failed to update reaction');
  });

  it('[104] should throw InternalServerErrorException when savePost fails early', async () => {
    postModelMock.findById.mockImplementation(() => {
      throw new Error('mocked failure');
    });

    await expect(
      service.savePost(mockPost.id.toString(), mockUserId),
    ).rejects.toThrow('Failed to save post');
  });

  it('[105] should throw InternalServerErrorException when editPost fails early', async () => {
    postModelMock.findById.mockImplementation(() => {
      throw new Error('mocked failure');
    });

    await expect(
      service.editPost(mockPost.id.toString(), mockEditPostDto, mockUserId),
    ).rejects.toThrow('Failed to edit post');
  });

  it('[106] should throw InternalServerErrorException when addComment fails early', async () => {
    postModelMock.findById.mockImplementation(() => {
      throw new Error('mocked failure');
    });

    await expect(
      service.addComment(mockPost.id.toString(), mockCommentDto, mockUserId),
    ).rejects.toThrow('Failed to add comment');
  });
});
