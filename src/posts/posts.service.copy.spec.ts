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
import * as mongoose from 'mongoose';
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
  mockGetPostDto,
  mockCreatePostDto,
} from './mock.data';
import { _, r, T } from '@faker-js/faker/dist/airline-CBNP41sR';
import { mock } from 'node:test';
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UserConnection } from '../connections/infrastructure/database/schemas/user-connection.schema';
import { getPostInfo } from './helpers/posts.helpers';
import * as postHelpers from './helpers/posts.helpers';
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
    postModelMock.create = jest.fn();
    const getPostInfo = jest.fn().mockReturnValue(mockGetPostDto);
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

    reactModelMock.findOne.mockImplementation((query) => {
      console.log('reactModel.findOne query:', query);
      return {
        exec: jest
          .fn()
          .mockResolvedValue(
            query.react_type === mockReaction.react_type ? mockReaction : null,
          ),
      };
    });

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

  it('should update existing reaction type on a comment', async () => {
    const commentId = mockComment._id.toString();
    const userId = mockProfile._id.toString();

    const updateReactionsDto = {
      reactions: {
        Like: true,
        Love: false,
        Funny: false,
        Celebrate: false,
        Insightful: false,
        Support: false,
      },
      postType: 'Comment',
    };

    // ✅ mock post (not used in this case)
    postModelMock.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    });

    // ✅ comment exists
    const commentInstance = {
      ...mockComment,
      markModified: jest.fn(),
      save: jest.fn().mockResolvedValue(mockComment),
    };
    commentModelMock.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(commentInstance),
    });

    // ✅ user is profile
    profileModelMock.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockProfile),
    });

    // ✅ no existing reaction
    reactModelMock.findOne
      .mockImplementationOnce(() => ({
        exec: jest.fn().mockResolvedValue({
          ...mockReaction,
          react_type: 'Love',
          save: jest
            .fn()
            .mockResolvedValue({ ...mockReaction, react_type: 'Love' }), // Add save method
        }),
      }))
      .mockImplementationOnce(() => ({
        exec: jest.fn().mockResolvedValue(null),
      }))
      .mockImplementationOnce(() => ({
        exec: jest.fn().mockResolvedValue(null),
      }))
      .mockImplementationOnce(() => ({
        exec: jest.fn().mockResolvedValue(null),
      }))
      .mockImplementationOnce(() => ({
        exec: jest.fn().mockResolvedValue(null),
      }))
      .mockImplementationOnce(() => ({
        exec: jest.fn().mockResolvedValue(null),
      }));

    // ✅ mock save for new reaction
    const saveMock = jest
      .fn()
      .mockResolvedValue({ ...mockReaction, react_type: 'Like' });
    reactModelMock.mockImplementation(() => ({
      save: saveMock,
    }));

    const result = await service.updateReactions(
      commentId,
      userId,
      updateReactionsDto,
    );

    // console.log('result:', result);
    expect(commentInstance.react_count['Like']).toBe(1);
    expect(commentInstance.markModified).toHaveBeenCalledWith('react_count');
    expect(commentInstance.save).toHaveBeenCalled();
    expect(result).toEqual(commentInstance);
  });

  it('should update existing reaction type on a post', async () => {
    const postId = mockPost.id.toString();
    const userId = mockProfile._id.toString();

    const updateReactionsDto = {
      reactions: {
        Like: true,
        Love: false,
        Funny: false,
        Celebrate: false,
        Insightful: false,
        Support: false,
      },
      postType: 'Post',
    };

    // ✅ mock post exists
    const postInstance = {
      ...mockPost,
      react_count: { Like: 0 },
      markModified: jest.fn(),
      save: jest.fn().mockResolvedValue(mockPost),
    };
    postModelMock.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(postInstance),
    });

    // ✅ user is profile
    profileModelMock.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockProfile),
    });

    // ✅ existing reaction
    reactModelMock.findOne
      .mockImplementationOnce(() => ({
        exec: jest.fn().mockResolvedValue({
          ...mockReaction,
          react_type: 'Love',
          save: jest
            .fn()
            .mockResolvedValue({ ...mockReaction, react_type: 'Love' }), // Add save method
        }),
      }))
      .mockImplementationOnce(() => ({
        exec: jest.fn().mockResolvedValue(null),
      }));

    // ✅ mock save for new reaction
    const saveMock = jest
      .fn()
      .mockResolvedValue({ ...mockReaction, react_type: 'Like' });
    reactModelMock.mockImplementation(() => ({
      save: saveMock,
    }));

    const result = await service.updateReactions(
      postId,
      userId,
      updateReactionsDto,
    );

    // Assertions
    expect(postInstance.react_count['Like']).toBe(1);
    expect(postInstance.markModified).toHaveBeenCalledWith('react_count');
    expect(postInstance.save).toHaveBeenCalled();
    expect(result).toEqual(postInstance);
  });
  it('should create a new reaction on a post and increment count', async () => {
    const postId = mockPost.id.toString();
    const userId = mockProfile._id.toString();

    const updateReactionsDto = {
      reactions: {
        Like: true,
        Love: false,
        Funny: false,
        Celebrate: false,
        Insightful: false,
        Support: false,
      },
      postType: 'Post',
    };

    // ✅ mock post exists
    const postInstance = {
      ...mockPost,
      react_count: { Like: 0 },
      markModified: jest.fn(),
      save: jest.fn().mockResolvedValue(mockPost),
    };
    postModelMock.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(postInstance),
    });

    // ✅ user is profile
    profileModelMock.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockProfile),
    });

    // ✅ no existing reaction
    reactModelMock.findOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    });

    // ✅ mock save for new reaction
    const saveMock = jest.fn().mockResolvedValue(mockReaction);
    reactModelMock.mockImplementation(() => ({
      save: saveMock,
    }));

    const result = await service.updateReactions(
      postId,
      userId,
      updateReactionsDto,
    );

    expect(postInstance.react_count['Like']).toBe(1);
    expect(postInstance.markModified).toHaveBeenCalledWith('react_count');
    expect(postInstance.save).toHaveBeenCalled();
    expect(saveMock).toHaveBeenCalled();
    expect(result).toEqual(postInstance);
  });
});
