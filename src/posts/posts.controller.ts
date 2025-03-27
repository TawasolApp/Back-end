import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  HttpCode,
  HttpException,
  InternalServerErrorException,
  BadRequestException,
  HttpStatus,
  UseGuards,
  Req,
  UnauthorizedException,
  Body,
  ValidationPipe,
  UsePipes,
  Query,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { GetPostDto } from './dto/get-post.dto';
import { UpdateReactionsDto } from './dto/update-reactions.dto';
import { ReactionDto } from './dto/get-reactions.dto';
import { EditPostDto } from './dto/edit-post.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { GetCommentDto } from './dto/get-comment.dto';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { EditCommentDto } from './dto/edit-comment.dto';

@UseGuards(JwtAuthGuard)
@UsePipes(new ValidationPipe())
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async addPost(@Body() createPostDto: CreatePostDto, @Req() req: Request) {
    try {
      if (!req.user) throw new UnauthorizedException('User not authenticated');
      const userId = req.user['sub'];
      return await this.postsService.addPost(createPostDto, userId);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Failed to create post');
    }
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async getAllPosts(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Req() req: Request,
  ): Promise<GetPostDto[]> {
    try {
      if (!req.user) throw new UnauthorizedException('User not authenticated');
      return await this.postsService.getAllPosts(page, limit, req.user['sub']);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Failed to fetch posts');
    }
  }

  @Post('react/:postId')
  @HttpCode(HttpStatus.OK)
  async updateReactions(
    @Param('postId') postId: string,
    @Body() updateReactionsDto: UpdateReactionsDto,
    @Req() req: Request,
  ) {
    try {
      if (!req.user) throw new UnauthorizedException('User not authenticated');
      const userIdFromToken = req.user['sub'];
      return await this.postsService.updateReactions(
        postId,
        userIdFromToken,
        updateReactionsDto,
      );
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Failed to update reaction');
    }
  }

  @Get('reactions/:postId')
  @HttpCode(HttpStatus.OK)
  async getReactions(
    @Param('postId') postId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Req() req: Request,
  ): Promise<ReactionDto[]> {
    try {
      if (!req.user) throw new UnauthorizedException('User not authenticated');
      return await this.postsService.getReactions(
        postId,
        page,
        limit,
        req.user['sub'],
      );
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Failed to fetch reactions');
    }
  }

  @Get('comments/:postId')
  @HttpCode(HttpStatus.OK)
  async getComments(
    @Param('postId') postId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Req() req: Request,
  ): Promise<GetCommentDto[]> {
    try {
      if (!req.user) throw new UnauthorizedException('User not authenticated');
      return await this.postsService.getComments(
        postId,
        page,
        limit,
        req.user['sub'],
      );
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Failed to fetch comments');
    }
  }

  @Post('save/:postId')
  @HttpCode(HttpStatus.OK)
  async savePost(@Param('postId') postId: string, @Req() req: Request) {
    try {
      if (!req.user) throw new UnauthorizedException('User not authenticated');
      return await this.postsService.savePost(postId, req.user['sub']);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Failed to save post');
    }
  }

  @Get('saved')
  @HttpCode(HttpStatus.OK)
  async getSavedPosts(@Req() req: Request): Promise<GetPostDto[]> {
    try {
      if (!req.user) throw new UnauthorizedException('User not authenticated');
      return await this.postsService.getSavedPosts(req.user['sub']);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Failed to fetch saved posts');
    }
  }

  @Post('comment/:postId')
  @HttpCode(HttpStatus.CREATED)
  async addComment(
    @Param('postId') postId: string,
    @Body() createCommentDto: CreateCommentDto,
    @Req() req: Request,
  ) {
    try {
      if (!req.user) throw new UnauthorizedException('User not authenticated');
      return await this.postsService.addComment(
        postId,
        createCommentDto,
        req.user['sub'],
      );
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Failed to add comment');
    }
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getPost(@Param('id') id: string, @Req() req: Request) {
    try {
      if (!req.user) throw new UnauthorizedException('User not authenticated');
      return await this.postsService.getPost(id, req.user['sub']);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Failed to fetch post');
    }
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePost(@Param('id') id: string, @Req() req: Request) {
    try {
      if (!req.user) throw new UnauthorizedException('User not authenticated');
      await this.postsService.deletePost(id, req.user['sub']);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Failed to delete post');
    }
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  async editPost(
    @Param('id') id: string,
    @Body() editPostDto: EditPostDto,
    @Req() req: Request,
  ) {
    try {
      if (!req.user) throw new UnauthorizedException('User not authenticated');
      return await this.postsService.editPost(id, editPostDto, req.user['sub']);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Failed to edit post');
    }
  }

  @Get('user/:userId')
  @HttpCode(HttpStatus.OK)
  async getUserPosts(
    @Param('userId') searchedUserId: string,
    @Req() req: Request,
  ): Promise<GetPostDto[]> {
    try {
      if (!req.user) throw new UnauthorizedException('User not authenticated');
      return await this.postsService.getUserPosts(
        searchedUserId,
        req.user['sub'],
      );
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Failed to fetch user posts');
    }
  }

  @Delete('save/:postId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async unsavePost(@Param('postId') postId: string, @Req() req: Request) {
    try {
      if (!req.user) throw new UnauthorizedException('User not authenticated');
      await this.postsService.unsavePost(postId, req.user['sub']);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Failed to unsave post');
    }
  }

  @Patch('comment/:commentId')
  @HttpCode(HttpStatus.OK)
  async editComment(
    @Param('commentId') commentId: string,
    @Body() editCommentDto: EditCommentDto,
    @Req() req: Request,
  ) {
    try {
      if (!req.user) throw new UnauthorizedException('User not authenticated');
      return await this.postsService.editComment(
        commentId,
        editCommentDto,
        req.user['sub'],
      );
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Failed to edit comment');
    }
  }

  @Delete('comment/:commentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteComment(
    @Param('commentId') commentId: string,
    @Req() req: Request,
  ) {
    try {
      if (!req.user) throw new UnauthorizedException('User not authenticated');
      await this.postsService.deleteComment(commentId, req.user['sub']);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Failed to delete comment');
    }
  }
}
