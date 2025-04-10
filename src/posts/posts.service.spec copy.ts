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
  InternalServerErrorException,
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

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

describe('PostsService - Additional Tests for Uncovered Statements', () => {
  let service: PostsService;
  let postModelMock: any;
  let profileModelMock: any;
  let companyModelMock: any;
  let reactModelMock: any;
  let saveModelMock: any;
  let commentModelMock: any;
  let userConnectionModelMock: any;

  beforeEach(async () => {
    const mockPostInstance = { save: jest.fn() };
    postModelMock = jest.fn(() => mockPostInstance);
    postModelMock.findById = jest.fn();
    postModelMock.find = jest.fn();
    postModelMock.deleteOne = jest.fn();

    profileModelMock = { findById: jest.fn() };
    companyModelMock = { findById: jest.fn() };
    reactModelMock = { findOne: jest.fn(), deleteOne: jest.fn() };
    saveModelMock = { findOneAndDelete: jest.fn(), exists: jest.fn() };
    commentModelMock = { findById: jest.fn(), deleteOne: jest.fn() };
    userConnectionModelMock = { find: jest.fn() };

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

  it('should throw BadRequestException for invalid user ID in getAllPosts', async () => {
    await expect(service.getAllPosts(1, 10, 'invalid-user-id')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('should throw NotFoundException if parent post is not found in addPost', async () => {
    postModelMock.findById.mockResolvedValue(null);

    await expect(
      service.addPost(
        { content: 'Test content', parentPostId: 'invalid-parent-id' } as any,
        'valid-author-id',
      ),
    ).rejects.toThrow(NotFoundException);
  });

  it('should throw InternalServerErrorException when updateReactions fails', async () => {
    reactModelMock.findOne.mockRejectedValue(new Error('DB error'));

    await expect(
      service.updateReactions('valid-post-id', 'valid-user-id', {
        postType: 'Post',
        reactions: { Like: true , Love: false ,Sad: false .},
        },
      }),
    ).rejects.toThrow(InternalServerErrorException);
  });

  it('should throw NotFoundException when deleting a non-existent comment', async () => {
    commentModelMock.findById.mockResolvedValue(null);

    await expect(
      service.deleteComment('non-existent-comment-id', 'valid-user-id'),
    ).rejects.toThrow(NotFoundException);
  });

  it('should throw UnauthorizedException when editing a comment by a different user', async () => {
    commentModelMock.findById.mockResolvedValue({
      author_id: new Types.ObjectId('different-user-id'),
    });

    await expect(
      service.editComment(
        'valid-comment-id',
        { content: 'Updated content' },
        'valid-user-id',
      ),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should throw BadRequestException for invalid post ID in getReactions', async () => {
    await expect(
      service.getReactions('invalid-post-id', 1, 10, 'All', 'valid-user-id'),
    ).rejects.toThrow(BadRequestException);
  });

  it('should throw NotFoundException when unsaving a non-existent saved post', async () => {
    saveModelMock.findOneAndDelete.mockResolvedValue(null);

    await expect(
      service.unsavePost('non-existent-post-id', 'valid-user-id'),
    ).rejects.toThrow(NotFoundException);
  });

  it('should throw InternalServerErrorException when getSavedPosts fails', async () => {
    saveModelMock.find.mockRejectedValue(new Error('DB error'));

    await expect(service.getSavedPosts('valid-user-id', 1, 10)).rejects.toThrow(
      InternalServerErrorException,
    );
  });
});
