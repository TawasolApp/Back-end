import { Test, TestingModule } from '@nestjs/testing';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  ExecutionContext,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { UpdateReactionsDto } from './dto/update-reactions.dto';

describe('PostsController', () => {
  let controller: PostsController;
  let service: PostsService;

  const mockService = {
    addPost: jest.fn(),
    getAllPosts: jest.fn(),
    updateReactions: jest.fn(),
    getReactions: jest.fn(),
    getComments: jest.fn(),
    savePost: jest.fn(),
    getSavedPosts: jest.fn(),
    addComment: jest.fn(),
    getPost: jest.fn(),
    deletePost: jest.fn(),
    editPost: jest.fn(),
    getUserPosts: jest.fn(),
    unsavePost: jest.fn(),
    editComment: jest.fn(),
    deleteComment: jest.fn(),
  };

  const mockRequest = {
    user: { sub: 'userId' },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PostsController],
      providers: [{ provide: PostsService, useValue: mockService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          const req = context.switchToHttp().getRequest();
          req.user = mockRequest.user;
          return true;
        },
      })
      .compile();

    controller = module.get<PostsController>(PostsController);
    service = module.get<PostsService>(PostsService);
  });

  const methods = [
    { name: 'addPost', args: [{ content: 'hi' }, { user: mockRequest.user }] },
    { name: 'getAllPosts', args: [1, 10, { user: mockRequest.user }] },
    {
      name: 'updateReactions',
      args: ['123', { reactions: {} }, { user: mockRequest.user }],
    },
    { name: 'getReactions', args: ['123', 1, 10, { user: mockRequest.user }] },
    { name: 'getComments', args: ['123', 1, 10, { user: mockRequest.user }] },
    { name: 'savePost', args: ['123', { user: mockRequest.user }] },
    { name: 'getSavedPosts', args: [{ user: mockRequest.user }] },
    {
      name: 'addComment',
      args: ['123', { content: 'comment' }, { user: mockRequest.user }],
    },
    { name: 'getPost', args: ['123', { user: mockRequest.user }] },
    { name: 'deletePost', args: ['123', { user: mockRequest.user }] },
    {
      name: 'editPost',
      args: ['123', { content: 'edit' }, { user: mockRequest.user }],
    },
    { name: 'getUserPosts', args: ['321', { user: mockRequest.user }] },
    { name: 'unsavePost', args: ['456', { user: mockRequest.user }] },
    {
      name: 'editComment',
      args: ['777', { content: 'edit comment' }, { user: mockRequest.user }],
    },
    { name: 'deleteComment', args: ['888', { user: mockRequest.user }] },
  ];

  const reqWithoutUser = {} as any;

  it('addPost should throw UnauthorizedException if user is missing', async () => {
    await expect(
      controller.addPost({ content: 'test' }, reqWithoutUser),
    ).rejects.toThrow(new UnauthorizedException('User not authenticated'));
  });

  it('getAllPosts should throw UnauthorizedException if user is missing', async () => {
    await expect(controller.getAllPosts(1, 10, reqWithoutUser)).rejects.toThrow(
      new UnauthorizedException('User not authenticated'),
    );
  });

  it('updateReactions should throw UnauthorizedException if user is missing', async () => {
    await expect(
      controller.updateReactions(
        'postId',
        {
          postType: 'Post',
          reactions: {
            Like: true,
            Love: true,
            Funny: false,
            Celebrate: false,
            Insightful: false,
            Support: false,
          },
        },
        reqWithoutUser,
      ),
    ).rejects.toThrow(new UnauthorizedException('User not authenticated'));
  });

  it('getReactions should throw UnauthorizedException if user is missing', async () => {
    await expect(
      controller.getReactions('postId', 1, 10, reqWithoutUser),
    ).rejects.toThrow(new UnauthorizedException('User not authenticated'));
  });

  it('getComments should throw UnauthorizedException if user is missing', async () => {
    await expect(
      controller.getComments('postId', 1, 10, reqWithoutUser),
    ).rejects.toThrow(new UnauthorizedException('User not authenticated'));
  });

  it('savePost should throw UnauthorizedException if user is missing', async () => {
    await expect(controller.savePost('postId', reqWithoutUser)).rejects.toThrow(
      new UnauthorizedException('User not authenticated'),
    );
  });

  it('getSavedPosts should throw UnauthorizedException if user is missing', async () => {
    await expect(controller.getSavedPosts(reqWithoutUser)).rejects.toThrow(
      new UnauthorizedException('User not authenticated'),
    );
  });

  it('addComment should throw UnauthorizedException if user is missing', async () => {
    await expect(
      controller.addComment('postId', { content: 'comment' }, reqWithoutUser),
    ).rejects.toThrow(new UnauthorizedException('User not authenticated'));
  });

  it('getPost should throw UnauthorizedException if user is missing', async () => {
    await expect(controller.getPost('postId', reqWithoutUser)).rejects.toThrow(
      new UnauthorizedException('User not authenticated'),
    );
  });

  it('deletePost should throw UnauthorizedException if user is missing', async () => {
    await expect(
      controller.deletePost('postId', reqWithoutUser),
    ).rejects.toThrow(new UnauthorizedException('User not authenticated'));
  });

  it('editPost should throw UnauthorizedException if user is missing', async () => {
    await expect(
      controller.editPost('postId', { content: 'edit' }, reqWithoutUser),
    ).rejects.toThrow(new UnauthorizedException('User not authenticated'));
  });

  it('getUserPosts should throw UnauthorizedException if user is missing', async () => {
    await expect(
      controller.getUserPosts('userId', reqWithoutUser),
    ).rejects.toThrow(new UnauthorizedException('User not authenticated'));
  });

  it('unsavePost should throw UnauthorizedException if user is missing', async () => {
    await expect(
      controller.unsavePost('postId', reqWithoutUser),
    ).rejects.toThrow(new UnauthorizedException('User not authenticated'));
  });

  it('editComment should throw UnauthorizedException if user is missing', async () => {
    await expect(
      controller.editComment('commentId', { content: 'edit' }, reqWithoutUser),
    ).rejects.toThrow(new UnauthorizedException('User not authenticated'));
  });

  it('deleteComment should throw UnauthorizedException if user is missing', async () => {
    await expect(
      controller.deleteComment('commentId', reqWithoutUser),
    ).rejects.toThrow(new UnauthorizedException('User not authenticated'));
  });
});
