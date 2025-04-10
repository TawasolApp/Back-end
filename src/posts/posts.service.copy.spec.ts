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
  mockParentComment,
  mockGetCommentDto,
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

  describe('deleteComment', () => {
    it('should delete a comment and update parent post comment count', async () => {
      const commentId = mockComment._id.toString();
      const userId = mockProfile._id.toString();

      // ✅ Mock comment exists
      const commentInstance = {
        ...mockComment,
        post_id: mockPost.id,
        author_id: new Types.ObjectId(userId),
        save: jest.fn(),
      };

      // ✅ Mock post exists
      const postInstance = {
        ...mockPost,
        comment_count: 1,
        save: jest.fn(),
      };

      // 🧠 Fix: mock findById twice
      commentModelMock.findById
        .mockReturnValueOnce({
          exec: jest.fn().mockResolvedValue(commentInstance),
        })
        .mockReturnValueOnce({
          exec: jest.fn().mockResolvedValue(null), // No parent comment, go to post path
        });

      postModelMock.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(postInstance),
      });

      // ✅ Mock deletions
      reactModelMock.deleteMany.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ deletedCount: 1 }),
      });
      commentModelMock.deleteOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ deletedCount: 1 }),
      });
      commentModelMock.deleteMany.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ deletedCount: 1 }),
      });

      await service.deleteComment(commentId, userId);

      // ✅ Assertions
      expect(commentModelMock.findById).toHaveBeenCalledWith(
        new Types.ObjectId(commentId),
      );
      expect(postModelMock.findById).toHaveBeenCalledWith(mockPost.id);
      expect(postInstance.comment_count).toBe(0);
      expect(postInstance.save).toHaveBeenCalled();
      expect(reactModelMock.deleteMany).toHaveBeenCalledWith({
        post_id: new Types.ObjectId(commentId),
      });
      expect(commentModelMock.deleteOne).toHaveBeenCalledWith({
        _id: new Types.ObjectId(commentId),
      });
      expect(commentModelMock.deleteMany).toHaveBeenCalledWith({
        post_id: new Types.ObjectId(commentId),
      });
    });

    it('should delete a comment and update parent comment replies', async () => {
      const commentId = mockComment._id.toString();
      const userId = mockProfile._id.toString();

      const parentCommentSave = jest.fn();

      const repliesArray = [new Types.ObjectId(commentId)];

      // 👇 Spy on .filter() of the replies array to return empty array
      jest.spyOn(repliesArray, 'filter').mockReturnValue([]);

      const commentInstance = {
        ...mockComment,
        post_id: mockParentComment._id,
        author_id: new Types.ObjectId(userId),
        save: jest.fn(),
      };

      commentModelMock.findById
        .mockReturnValueOnce({
          exec: jest.fn().mockResolvedValue(commentInstance),
        })
        .mockReturnValueOnce({
          exec: jest.fn().mockResolvedValue({
            ...mockParentComment,
            replies: repliesArray,
            save: parentCommentSave,
          }),
        });

      postModelMock.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      reactModelMock.deleteMany.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ deletedCount: 1 }),
      });
      commentModelMock.deleteOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ deletedCount: 1 }),
      });
      commentModelMock.deleteMany.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ deletedCount: 1 }),
      });

      await service.deleteComment(commentId, userId);

      expect(repliesArray.filter).toHaveBeenCalled();
      expect(parentCommentSave).toHaveBeenCalled();
    });

    it('should throw NotFoundException if comment is not found', async () => {
      commentModelMock.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(
        service.deleteComment(mockComment._id.toString(), mockUserId),
      ).rejects.toThrow('Comment not found');
    });

    it('should throw UnauthorizedException if user is not the author', async () => {
      const commentInstance = {
        ...mockComment,
        author_id: new Types.ObjectId(),
      };
      commentModelMock.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(commentInstance),
      });

      await expect(
        service.deleteComment(mockComment._id.toString(), mockUserId),
      ).rejects.toThrow('User not authorized to edit this comment');
    });

    it('should throw NotFoundException if parent post and parent comment are not found', async () => {
      const commentInstance = {
        ...mockComment,
        post_id: new Types.ObjectId(),
        author_id: new Types.ObjectId(mockUserId),
      };
      commentModelMock.findById
        .mockReturnValueOnce({
          exec: jest.fn().mockResolvedValue(mockComment),
        })
        .mockReturnValueOnce({
          exec: jest.fn().mockResolvedValue(null),
        });

      postModelMock.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(
        service.deleteComment(mockComment._id.toString(), mockUserId),
      ).rejects.toThrow('Parent not found');
    });

    it('should decrement post comment count and delete comment', async () => {
      const commentInstance = {
        ...mockComment,
        post_id: mockPost.id,
        author_id: new Types.ObjectId(mockUserId),
      };
      const postInstance = {
        ...mockPost,
        comment_count: 1,
        save: jest.fn().mockResolvedValue(mockPost),
      };

      commentModelMock.findById
        .mockReturnValueOnce({
          exec: jest.fn().mockResolvedValue(commentInstance),
        })
        .mockReturnValueOnce({
          exec: jest.fn().mockResolvedValue(null),
        });

      postModelMock.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(postInstance),
      });

      reactModelMock.deleteMany.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ deletedCount: 1 }),
      });

      commentModelMock.deleteOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ deletedCount: 1 }),
      });

      commentModelMock.deleteMany.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ deletedCount: 1 }),
      });

      await service.deleteComment(mockComment._id.toString(), mockUserId);

      expect(postInstance.comment_count).toBe(0);
      expect(postInstance.save).toHaveBeenCalled();
      expect(reactModelMock.deleteMany).toHaveBeenCalledWith({
        post_id: new Types.ObjectId(mockComment._id),
      });
      expect(commentModelMock.deleteOne).toHaveBeenCalledWith({
        _id: new Types.ObjectId(mockComment._id),
      });
      expect(commentModelMock.deleteMany).toHaveBeenCalledWith({
        post_id: new Types.ObjectId(mockComment._id),
      });
    });

    it('should update parent comment replies and delete comment', async () => {
      const commentInstance = {
        ...mockComment,
        post_id: mockParentComment._id,
        author_id: new Types.ObjectId(mockUserId),
      };
      const parentCommentInstance = {
        ...mockParentComment,
        replies: [new Types.ObjectId(mockComment._id)],
        save: jest.fn().mockResolvedValue(mockParentComment),
      };

      commentModelMock.findById
        .mockReturnValueOnce({
          exec: jest.fn().mockResolvedValue(commentInstance),
        })
        .mockReturnValueOnce({
          exec: jest.fn().mockResolvedValue(parentCommentInstance),
        });

      postModelMock.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      reactModelMock.deleteMany.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ deletedCount: 1 }),
      });

      commentModelMock.deleteOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ deletedCount: 1 }),
      });

      commentModelMock.deleteMany.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ deletedCount: 1 }),
      });

      await service.deleteComment(mockComment._id.toString(), mockUserId);

      expect(parentCommentInstance.replies).toEqual([]);
      expect(parentCommentInstance.save).toHaveBeenCalled();
      expect(reactModelMock.deleteMany).toHaveBeenCalledWith({
        post_id: new Types.ObjectId(mockComment._id),
      });
      expect(commentModelMock.deleteOne).toHaveBeenCalledWith({
        _id: new Types.ObjectId(mockComment._id),
      });
      expect(commentModelMock.deleteMany).toHaveBeenCalledWith({
        post_id: new Types.ObjectId(mockComment._id),
      });
    });

    it('should throw InternalServerErrorException if deletion fails', async () => {
      const commentInstance = {
        ...mockComment,
        post_id: mockPost.id,
        author_id: new Types.ObjectId(mockUserId),
      };

      commentModelMock.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(commentInstance),
      });

      postModelMock.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockPost),
      });

      commentModelMock.deleteOne.mockReturnValue({
        exec: jest.fn().mockRejectedValue(new Error('Delete failed')),
      });

      await expect(
        service.deleteComment(mockComment._id.toString(), mockUserId),
      ).rejects.toThrow('Failed to delete comment');
    });
  });
  describe('searchPosts', () => {
    const userId = new Types.ObjectId().toString();
    const keyword = 'developer';

    it('should return matching posts without filters (mock map)', async () => {
      const mockPosts = [{ text: 'Developer 1' }, { text: 'Developer 2' }];

      // Spy on map
      const mapSpy = jest.spyOn(mockPosts, 'map').mockImplementation((cb) => {
        return ['mocked-post-dto-1', 'mocked-post-dto-2'];
      });

      postModelMock.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockPosts),
      });

      // getPostInfo shouldn't even be called in this case, but mock to be safe
      jest.spyOn(postHelpers, 'getPostInfo').mockResolvedValue(mockGetPostDto);

      const result = await service.searchPosts(userId, keyword, false, 'all');

      expect(mapSpy).toHaveBeenCalled();
      expect(result).toEqual(['mocked-post-dto-1', 'mocked-post-dto-2']);
    });

    it('should apply 24h timeframe filter', async () => {
      const mockPosts = [{ text: 'Backend Developer' }];
      postModelMock.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockPosts),
      });

      const now = Date.now();
      jest.spyOn(global.Date, 'now').mockReturnValue(now);

      await service.searchPosts(userId, keyword, false, '24h');

      expect(postModelMock.find).toHaveBeenCalledWith({
        $or: [{ text: { $regex: /developer/i } }],
        posted_at: { $gte: new Date(now - 24 * 60 * 60 * 1000) },
      });
    });

    it('should apply week timeframe filter', async () => {
      const mockPosts = [{ text: 'Frontend Dev' }];
      postModelMock.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockPosts),
      });

      const now = Date.now();
      jest.spyOn(global.Date, 'now').mockReturnValue(now);

      await service.searchPosts(userId, keyword, false, 'week');

      expect(postModelMock.find).toHaveBeenCalledWith({
        $or: [{ text: { $regex: /developer/i } }],
        posted_at: { $gte: new Date(now - 7 * 24 * 60 * 60 * 1000) },
      });
    });

    it('should apply networkOnly filter and build author_id $in', async () => {
      const mockConnections = [
        {
          sending_party: new Types.ObjectId(userId),
          receiving_party: new Types.ObjectId(),
        },
      ];
      const mockFollowing = [{ receiving_party: new Types.ObjectId() }];

      const mockPosts = [{ text: 'Network Dev' }];

      userConnectionModelMock.find
        .mockReturnValueOnce({
          lean: jest.fn().mockResolvedValue(mockConnections),
        }) // connections
        .mockReturnValueOnce({
          lean: jest.fn().mockResolvedValue(mockFollowing),
        }); // following

      postModelMock.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockPosts),
      });

      const result = await service.searchPosts(userId, keyword, true, 'all');

      expect(postModelMock.find).toHaveBeenCalledWith(
        expect.objectContaining({
          $or: [{ text: { $regex: /developer/i } }],
          author_id: expect.objectContaining({
            $in: expect.any(Array),
          }),
        }),
      );

      expect(result).toEqual([mockGetPostDto]);
    });

    it('should throw BadRequestException for invalid userId', async () => {
      await expect(
        service.searchPosts('invalid-id', keyword, false, 'all'),
      ).rejects.toThrow('Invalid user ID format');
    });

    it('should return empty array if no posts match', async () => {
      postModelMock.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      });

      const result = await service.searchPosts(userId, 'nomatch', false, 'all');
      expect(result).toEqual([]);
    });

    it('should throw BadRequestException for invalid user ID format', async () => {
      await expect(
        service.searchPosts('invalid-id', 'developer', false, 'all'),
      ).rejects.toThrow('Invalid user ID format');
    });

    it('should throw InternalServerErrorException for database error in post query', async () => {
      postModelMock.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockRejectedValue(new Error('Database error')),
      });

      await expect(
        service.searchPosts(mockUserId, 'developer', false, 'all'),
      ).rejects.toThrow('Failed to search posts');
    });

    it('should throw InternalServerErrorException for error in network filter', async () => {
      userConnectionModelMock.find.mockImplementation(() => ({
        lean: jest.fn().mockRejectedValue(new Error('Network filter error')),
      }));

      await expect(
        service.searchPosts(mockUserId, 'developer', true, 'all'),
      ).rejects.toThrow('Failed to search posts');
    });

    it('should throw InternalServerErrorException for error in enriching posts', async () => {
      postModelMock.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockRejectedValue(new Error('Database error')),
      });

      jest
        .spyOn(postHelpers, 'getPostInfo')
        .mockRejectedValue(new Error('Enrichment error'));

      await expect(
        service.searchPosts(mockUserId, 'developer', false, 'all'),
      ).rejects.toThrow('Failed to search posts');
    });

    it('should rethrow HttpException if caught', async () => {
      const httpException = new BadRequestException('Custom error');
      postModelMock.find.mockImplementation(() => {
        throw httpException;
      });

      await expect(
        service.searchPosts(mockUserId, 'developer', false, 'all'),
      ).rejects.toThrow(httpException);
    });
  });

  describe('getRepostsOfPost', () => {
    const postId = new Types.ObjectId().toString();
    const userId = new Types.ObjectId().toString();
    const mockReposts = [
      {
        _id: new Types.ObjectId(),
        parent_post_id: postId,
        visibility: 'Public',
      },
      {
        _id: new Types.ObjectId(),
        parent_post_id: postId,
        visibility: 'Connections',
      },
    ];

    it('should return enriched reposts for a valid postId and userId', async () => {
      userConnectionModelMock.find
        .mockReturnValueOnce({
          select: jest.fn().mockReturnThis(),
          lean: jest.fn().mockResolvedValue([
            {
              sending_party: new Types.ObjectId(userId),
              receiving_party: new Types.ObjectId(),
            },
          ]),
        }) // connected users
        .mockReturnValueOnce({
          select: jest.fn().mockReturnThis(),
          lean: jest
            .fn()
            .mockResolvedValue([{ receiving_party: new Types.ObjectId() }]),
        }); // following users

      postModelMock.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockReposts),
      });

      jest.spyOn(postHelpers, 'getPostInfo').mockResolvedValue(mockGetPostDto);

      const result = await service.getRepostsOfPost(postId, userId, 1, 10);

      expect(postModelMock.find).toHaveBeenCalledWith(
        expect.objectContaining({
          parent_post_id: new Types.ObjectId(postId),
          $or: [{ visibility: 'Public' }, { author_id: expect.any(Object) }],
        }),
      );
      expect(result).toEqual([mockGetPostDto, mockGetPostDto]);
    });

    it('should throw BadRequestException for invalid postId', async () => {
      await expect(
        service.getRepostsOfPost('invalid-id', userId, 1, 10),
      ).rejects.toThrow('Invalid post ID format');
    });

    it('should throw BadRequestException for invalid userId', async () => {
      await expect(
        service.getRepostsOfPost(postId, 'invalid-id', 1, 10),
      ).rejects.toThrow('Invalid user ID format');
    });

    it('should throw InternalServerErrorException on database error', async () => {
      postModelMock.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockRejectedValue(new Error('Database error')),
      });

      await expect(
        service.getRepostsOfPost(postId, userId, 1, 10),
      ).rejects.toThrow('Failed to fetch reposts');
    });
  });

  describe('getRepostsByUser', () => {
    const userId = new Types.ObjectId().toString();
    const viewerId = new Types.ObjectId().toString();
    const mockReposts = [
      {
        _id: new Types.ObjectId(),
        author_id: userId,
        parent_post_id: new Types.ObjectId(),
      },
      {
        _id: new Types.ObjectId(),
        author_id: userId,
        parent_post_id: new Types.ObjectId(),
      },
    ];

    it('should return enriched reposts for a valid userId and viewerId', async () => {
      postModelMock.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockReposts),
      });

      jest.spyOn(postHelpers, 'getPostInfo').mockResolvedValue(mockGetPostDto);

      const result = await service.getRepostsByUser(userId, 1, 10, viewerId);

      expect(postModelMock.find).toHaveBeenCalledWith(
        expect.objectContaining({
          author_id: new Types.ObjectId(userId),
          parent_post_id: { $ne: null },
        }),
      );
      expect(result).toEqual([mockGetPostDto, mockGetPostDto]);
    });

    it('should throw BadRequestException for invalid userId', async () => {
      await expect(
        service.getRepostsByUser('invalid-id', 1, 10, viewerId),
      ).rejects.toThrow('Invalid user ID format');
    });

    it('should return an empty array if no reposts are found', async () => {
      postModelMock.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      });

      const result = await service.getRepostsByUser(userId, 1, 10, viewerId);
      expect(result).toEqual([]);
    });

    it('should throw InternalServerErrorException on database error', async () => {
      postModelMock.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockRejectedValue(new Error('Database error')),
      });

      await expect(
        service.getRepostsByUser(userId, 1, 10, viewerId),
      ).rejects.toThrow('Failed to fetch user reposts');
    });
  });

  describe('editPost', () => {
    it('should throw BadRequestException for invalid post ID format', async () => {
      await expect(
        service.editPost('invalid-id', mockEditPostDto, mockUserId),
      ).rejects.toThrow('Invalid post ID format');
    });

    it('should throw BadRequestException for invalid user ID format', async () => {
      await expect(
        service.editPost(mockPost.id.toString(), mockEditPostDto, 'invalid-id'),
      ).rejects.toThrow('Invalid user ID format');
    });

    it('should throw NotFoundException if post is not found', async () => {
      postModelMock.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(
        service.editPost(mockPost.id.toString(), mockEditPostDto, mockUserId),
      ).rejects.toThrow('Post not found');
    });

    it('should throw NotFoundException if author is not found', async () => {
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
        service.editPost(mockPost.id.toString(), mockEditPostDto, mockUserId),
      ).rejects.toThrow('Author not found');
    });
  });

  describe('getAllPosts', () => {
    it('should throw BadRequestException for invalid user ID format', async () => {
      await expect(service.getAllPosts(1, 10, 'invalid-id')).rejects.toThrow(
        'Invalid user ID format.',
      );
    });

    it('should include own posts in the result', async () => {
      const mockPost = { author_id: mockUserId, visibility: 'Public' };
      postModelMock.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([mockPost]),
      });

      userConnectionModelMock.find.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      });

      const result = await service.getAllPosts(1, 10, mockUserId);
      expect(result).toEqual([mockGetPostDto]);
    });

    it('should include posts from connected users', async () => {
      const connectedUserId = new Types.ObjectId();
      const mockPost = { author_id: connectedUserId, visibility: 'Public' };

      userConnectionModelMock.find
        .mockReturnValueOnce({
          select: jest.fn().mockReturnThis(),
          lean: jest.fn().mockResolvedValue([
            {
              sending_party: new Types.ObjectId(mockUserId),
              receiving_party: connectedUserId,
            },
          ]),
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnThis(),
          lean: jest.fn().mockResolvedValue([]),
        });

      postModelMock.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([mockPost]),
      });

      const result = await service.getAllPosts(1, 10, mockUserId);
      expect(result).toEqual([mockGetPostDto]);
    });

    it('should include public posts from followed users', async () => {
      const followedUserId = new Types.ObjectId();
      const mockPost = { author_id: followedUserId, visibility: 'Public' };

      userConnectionModelMock.find
        .mockReturnValueOnce({
          select: jest.fn().mockReturnThis(),
          lean: jest.fn().mockResolvedValue([]),
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnThis(),
          lean: jest
            .fn()
            .mockResolvedValue([{ receiving_party: followedUserId }]),
        });

      postModelMock.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([mockPost]),
      });

      const result = await service.getAllPosts(1, 10, mockUserId);
      expect(result).toEqual([mockGetPostDto]);
    });

    it('should include public posts from unrelated users with 50% chance', async () => {
      const unrelatedUserId = new Types.ObjectId();
      const mockPost = { author_id: unrelatedUserId, visibility: 'Public' };

      jest.spyOn(global.Math, 'random').mockReturnValue(0.4);

      userConnectionModelMock.find
        .mockReturnValueOnce({
          select: jest.fn().mockReturnThis(),
          lean: jest.fn().mockResolvedValue([]),
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnThis(),
          lean: jest.fn().mockResolvedValue([]),
        });

      postModelMock.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([mockPost]),
      });

      const result = await service.getAllPosts(1, 10, mockUserId);
      expect(result).toEqual([mockGetPostDto]);
    });

    it('should exclude public posts from unrelated users with 50% chance', async () => {
      const unrelatedUserId = new Types.ObjectId();
      const mockPost = { author_id: unrelatedUserId, visibility: 'Public' };

      jest.spyOn(global.Math, 'random').mockReturnValue(0.6);

      userConnectionModelMock.find
        .mockReturnValueOnce({
          select: jest.fn().mockReturnThis(),
          lean: jest.fn().mockResolvedValue([]),
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnThis(),
          lean: jest.fn().mockResolvedValue([]),
        });

      postModelMock.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([mockPost]),
      });

      const result = await service.getAllPosts(1, 10, mockUserId);
      expect(result).toEqual([]);
    });
  });

  describe('getSavedPosts', () => {
    const userId = new Types.ObjectId().toString();
    const mockSavedPosts = [
      { post_id: new Types.ObjectId().toString() },
      { post_id: new Types.ObjectId().toString() },
    ];
    const mockPost = { _id: new Types.ObjectId(), text: 'Mock Post' };

    it('should return enriched saved posts', async () => {
      saveModelMock.find.mockReturnValue({
        skip: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockSavedPosts),
      });

      postModelMock.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockPost),
      });

      jest.spyOn(postHelpers, 'getPostInfo').mockResolvedValue(mockGetPostDto);

      const result = await service.getSavedPosts(userId, 1, 10);

      expect(saveModelMock.find).toHaveBeenCalledWith({
        user_id: new Types.ObjectId(userId),
      });
      expect(postModelMock.findById).toHaveBeenCalledTimes(
        mockSavedPosts.length,
      );
      expect(result).toEqual([mockGetPostDto, mockGetPostDto]);
    });

    it('should return an empty array if no saved posts are found', async () => {
      saveModelMock.find.mockReturnValue({
        skip: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      });

      const result = await service.getSavedPosts(userId, 1, 10);

      expect(result).toEqual([]);
    });

    it('should throw NotFoundException if a post is not found', async () => {
      saveModelMock.find.mockReturnValue({
        skip: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockSavedPosts),
      });

      postModelMock.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.getSavedPosts(userId, 1, 10)).rejects.toThrow(
        'Post not found',
      );
    });

    it('should throw InternalServerErrorException on database error', async () => {
      saveModelMock.find.mockReturnValue({
        skip: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockRejectedValue(new Error('Database error')),
      });

      await expect(service.getSavedPosts(userId, 1, 10)).rejects.toThrow(
        'Failed to fetch saved posts',
      );
    });

    it('should rethrow HttpException if caught', async () => {
      const httpException = new NotFoundException('Custom error');
      saveModelMock.find.mockImplementation(() => {
        throw httpException;
      });

      await expect(service.getSavedPosts(userId, 1, 10)).rejects.toThrow(
        httpException,
      );
    });
  });

  describe('getComments', () => {
    const postId = new Types.ObjectId().toString();
    const userId = new Types.ObjectId().toString();
    const mockComments = [
      { _id: new Types.ObjectId(), content: 'Comment 1' },
      { _id: new Types.ObjectId(), content: 'Comment 2' },
    ];

    it('should return enriched comments for a valid postId and userId', async () => {
      commentModelMock.find.mockReturnValue({
        skip: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockComments),
      });

      jest
        .spyOn(postHelpers, 'getCommentInfo')
        .mockResolvedValueOnce(mockGetCommentDto)
        .mockResolvedValueOnce(mockGetCommentDto);

      const result = await service.getComments(postId, 1, 10, userId);

      expect(commentModelMock.find).toHaveBeenCalledWith({
        post_id: new Types.ObjectId(postId),
      });
      expect(result).toEqual([mockGetCommentDto, mockGetCommentDto]);
    });

    it('should return an empty array if no comments are found', async () => {
      commentModelMock.find.mockReturnValue({
        skip: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      });

      const result = await service.getComments(postId, 1, 10, userId);

      expect(result).toEqual([]);
    });

    it('should throw InternalServerErrorException on database error', async () => {
      commentModelMock.find.mockReturnValue({
        skip: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockRejectedValue(new Error('Database error')),
      });

      await expect(service.getComments(postId, 1, 10, userId)).rejects.toThrow(
        'Failed to fetch comments',
      );
    });

    it('should rethrow HttpException if caught', async () => {
      const httpException = new BadRequestException('Custom error');
      commentModelMock.find.mockImplementation(() => {
        throw httpException;
      });

      await expect(service.getComments(postId, 1, 10, userId)).rejects.toThrow(
        httpException,
      );
    });
  });
});
