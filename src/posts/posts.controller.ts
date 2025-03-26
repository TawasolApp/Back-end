import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UsePipes,
  ValidationPipe,
  InternalServerErrorException,
  Query,
  Patch,
  Req,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { GetPostDto } from './dto/get-post.dto';
import { Post as PostEntity } from './infrastructure/database/post.schema';
import { UpdateReactionsDto } from './dto/update-reactions.dto';
import { ReactionDto } from './dto/get-reactions.dto';
import { EditPostDto } from './dto/edit-post.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { GetCommentDto } from './dto/get-comment.dto';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { EditCommentDto } from './dto/edit-comment.dto';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  @UsePipes(new ValidationPipe())
  @UseGuards(JwtAuthGuard)
  async addPost(@Body() createPostDto: CreatePostDto, @Req() req: Request) {
    console.log('req:', req);
    if (!req.user) {
      throw new UnauthorizedException('User not authenticated');
    }
    //TODO : Add media upload.
    try {
      const userId = req.user['sub'];
      console.log('userId:', userId);
      const post = await this.postsService.addPost(createPostDto, userId);
      return post;
    } catch (error) {
      console.error('Error in addPost controller:', error);
      throw error;
    }
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async getAllPosts(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Req() req: Request,
  ): Promise<GetPostDto[]> {
    if (!req.user) {
      throw new UnauthorizedException('User not authenticated');
    }
    try {
      return await this.postsService.getAllPosts(page, limit, req.user['sub']);
    } catch (error) {
      console.error('Error in getAllPosts controller:', error);
      throw error;
    }
  }

  @Post('react/:postId')
  @UsePipes(new ValidationPipe())
  @UseGuards(JwtAuthGuard)
  async updateReactions(
    @Param('postId') postId: string,
    @Body() updateReactionsDto: UpdateReactionsDto,
    @Req() req: Request,
  ) {
    if (!req.user) {
      throw new UnauthorizedException('User not authenticated');
    }
    const userIdFromToken = req.user['sub'];
    try {
      const updatedPost = await this.postsService.updateReactions(
        postId,
        userIdFromToken,
        updateReactionsDto,
      );
      return updatedPost;
    } catch (error) {
      console.error(
        `Error in updateReactions controller for postId ${postId}:`,
        error,
      );
      throw error;
    }
  }

  @Get('reactions/:postId')
  @UseGuards(JwtAuthGuard)
  async getReactions(
    @Param('postId') postId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Req() req: Request,
  ): Promise<ReactionDto[]> {
    if (!req.user) {
      throw new UnauthorizedException('User not authenticated');
    }
    const userId = req.user['sub'];
    console.log(userId);
    try {
      return await this.postsService.getReactions(postId, page, limit, userId);
    } catch (error) {
      console.error(
        `Error in getReactions controller for postId ${postId}:`,
        error,
      );
      throw error;
    }
  }

  @Get('comments/:postId')
  @UseGuards(JwtAuthGuard)
  async getComments(
    @Param('postId') postId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Req() req: Request,
  ): Promise<GetCommentDto[]> {
    if (!req.user) {
      throw new UnauthorizedException('User not authenticated');
    }
    const userId = req.user['sub'];
    try {
      return await this.postsService.getComments(postId, page, limit, userId);
    } catch (error) {
      console.error(
        `Error in getComments controller for postId ${postId}:`,
        error,
      );
      throw error;
    }
  }

  @Post('save/:postId')
  @UseGuards(JwtAuthGuard)
  async savePost(@Param('postId') postId: string, @Req() req: Request) {
    if (!req.user) {
      throw new UnauthorizedException('User not authenticated');
    }
    const userIdFromToken = req.user['sub'];
    try {
      const saveResult = await this.postsService.savePost(
        postId,
        userIdFromToken,
      );
      return saveResult;
    } catch (error) {
      console.error(
        `Error in savePost controller for postId ${postId}:`,
        error,
      );
      throw error;
    }
  }

  @Get('saved')
  @UseGuards(JwtAuthGuard)
  async getSavedPosts(@Req() req: Request): Promise<GetPostDto[]> {
    if (!req.user) {
      throw new UnauthorizedException('User not authenticated');
    }
    const userIdFromToken = req.user['sub'];
    try {
      return await this.postsService.getSavedPosts(userIdFromToken);
    } catch (error) {
      console.error(
        `Error in getSavedPosts controller for userId ${userIdFromToken}:`,
        error,
      );
      throw error;
    }
  }

  @Post('comment/:postId')
  @UsePipes(new ValidationPipe())
  @UseGuards(JwtAuthGuard)
  async addComment(
    @Param('postId') postId: string,
    @Body() createCommentDto: CreateCommentDto,
    @Req() req: Request,
  ) {
    if (!req.user) {
      throw new UnauthorizedException('User not authenticated');
    }
    const userIdFromToken = req.user['sub'];
    try {
      const comment = await this.postsService.addComment(
        postId,
        createCommentDto,
        userIdFromToken,
      );
      return comment;
    } catch (error) {
      console.error(
        `Error in addComment controller for postId ${postId}:`,
        error,
      );
      throw error;
    }
  }
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getPost(@Param('id') id: string, @Req() req: Request) {
    if (!req.user) {
      throw new UnauthorizedException('User not authenticated');
    }
    const userId = req.user['sub'];
    try {
      return await this.postsService.getPost(id, userId);
    } catch (error) {
      console.error(`Error in getPost controller for id ${id}:`, error);
      throw error;
    }
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async deletePost(@Param('id') id: string, @Req() req: Request) {
    if (!req.user) {
      throw new UnauthorizedException('User not authenticated');
    }
    const userId = req.user['sub'];
    try {
      await this.postsService.deletePost(id, userId);
      return { message: 'Post deleted successfully' };
    } catch (error) {
      console.error(`Error in deletePost controller for id ${id}:`, error);
      throw error;
    }
  }

  @Patch(':id')
  @UsePipes(new ValidationPipe())
  @UseGuards(JwtAuthGuard)
  async editPost(
    @Param('id') id: string,
    @Body() editPostDto: EditPostDto,
    @Req() req: Request,
  ) {
    if (!req.user) {
      throw new UnauthorizedException('User not authenticated');
    }
    const userId = req.user['sub'];
    try {
      const updatedPost = await this.postsService.editPost(
        id,
        editPostDto,
        userId,
      );
      return updatedPost;
    } catch (error) {
      console.error(`Error in editPost controller for id ${id}:`, error);
      throw error;
    }
  }

  @Get('user/:userId')
  @UseGuards(JwtAuthGuard)
  async getUserPosts(
    @Param('userId') searchedUserId: string,
    @Req() req: Request,
  ): Promise<GetPostDto[]> {
    if (!req.user) {
      throw new UnauthorizedException('User not authenticated');
    }
    const userId = req.user['sub'];
    console.log(`Fetching posts for userId: ${searchedUserId}`);
    try {
      return await this.postsService.getUserPosts(searchedUserId, userId);
    } catch (error) {
      console.error(
        `Error in getUserPosts controller for userId ${userId}:`,
        error,
      );
      throw error;
    }
  }

  @Delete('save/:postId')
  @UseGuards(JwtAuthGuard)
  async unsavePost(@Param('postId') postId: string, @Req() req: Request) {
    if (!req.user) {
      throw new UnauthorizedException('User not authenticated');
    }
    const userIdFromToken = req.user['sub'];
    try {
      const unsaveResult = await this.postsService.unsavePost(
        postId,
        userIdFromToken,
      );
      return unsaveResult;
    } catch (error) {
      console.error(
        `Error in unsavePost controller for postId ${postId}:`,
        error,
      );
      throw error;
    }
  }

  @Patch('comment/:commentId')
  @UsePipes(new ValidationPipe())
  @UseGuards(JwtAuthGuard)
  async editComment(
    @Param('commentId') commentId: string,
    @Body() editCommentDto: EditCommentDto,
    @Req() req: Request,
  ) {
    if (!req.user) {
      throw new UnauthorizedException('User not authenticated');
    }
    const userIdFromToken = req.user['sub'];
    try {
      const updatedComment = await this.postsService.editComment(
        commentId,
        editCommentDto,
        userIdFromToken,
      );
      return updatedComment;
    } catch (error) {
      console.error(
        `Error in editComment controller for commentId ${commentId}:`,
        error,
      );
      throw error;
    }
  }

  @Delete('comment/:commentId')
  @UseGuards(JwtAuthGuard)
  async deleteComment(
    @Param('commentId') commentId: string,
    @Req() req: Request,
  ) {
    if (!req.user) {
      throw new UnauthorizedException('User not authenticated');
    }
    const userIdFromToken = req.user['sub'];
    try {
      await this.postsService.deleteComment(commentId, userIdFromToken);
      return { message: 'Comment deleted successfully' };
    } catch (error) {
      console.error(
        `Error in deleteComment controller for commentId ${commentId}:`,
        error,
      );
      throw new InternalServerErrorException('Failed to delete comment');
    }
  }
}
