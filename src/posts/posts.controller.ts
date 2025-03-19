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

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  @UsePipes(new ValidationPipe())
  async addPost(@Body() createPostDto: CreatePostDto) {
    //TODO : Add media upload.
    try {
      const post = await this.postsService.addPost(createPostDto);
      return post;
    } catch (error) {
      console.error('Error in addPost controller:', error);
      throw new InternalServerErrorException('Failed to create post');
    }
  }

  @Get()
  async getAllPosts(): Promise<GetPostDto[]> {
    try {
      return await this.postsService.getAllPosts();
    } catch (error) {
      console.error('Error in getAllPosts controller:', error);
      throw new InternalServerErrorException('Failed to fetch posts');
    }
  }

  @Get(':id')
  async getPost(@Param('id') id: string) {
    try {
      return await this.postsService.getPost(id);
    } catch (error) {
      console.error(`Error in getPost controller for id ${id}:`, error);
      throw error;
    }
  }

  @Delete(':id')
  async deletePost(@Param('id') id: string) {
    try {
      await this.postsService.deletePost(id);
      return { message: 'Post deleted successfully' };
    } catch (error) {
      console.error(`Error in deletePost controller for id ${id}:`, error);
      throw error;
    }
  }

  @Patch(':id')
  @UsePipes(new ValidationPipe())
  async editPost(@Param('id') id: string, @Body() editPostDto: EditPostDto) {
    try {
      const updatedPost = await this.postsService.editPost(id, editPostDto);
      return updatedPost;
    } catch (error) {
      console.error(`Error in editPost controller for id ${id}:`, error);
      throw new InternalServerErrorException('Failed to edit post');
    }
  }

  @Post(':postId/react/:userId')
  @UsePipes(new ValidationPipe())
  async updateReactions(
    @Param('postId') postId: string,
    @Param('userId') userId: string,
    @Body() updateReactionsDto: UpdateReactionsDto,
  ) {
    try {
      const updatedPost = await this.postsService.updateReactions(
        postId,
        userId,
        updateReactionsDto,
      );
      return updatedPost;
    } catch (error) {
      console.error(
        `Error in updateReactions controller for postId ${postId} and userId ${userId}:`,
        error,
      );
      throw new InternalServerErrorException('Failed to update reactions');
    }
  }

  @Get(':postId/reactions')
  async getReactions(@Param('postId') postId: string): Promise<ReactionDto[]> {
    try {
      return await this.postsService.getReactions(postId);
    } catch (error) {
      console.error(
        `Error in getReactions controller for postId ${postId}:`,
        error,
      );
      throw new InternalServerErrorException('Failed to fetch reactions');
    }
  }

  @Post(':postId/save/:userId')
  async savePost(
    @Param('postId') postId: string,
    @Param('userId') userId: string,
  ) {
    try {
      const saveResult = await this.postsService.savePost(postId, userId);
      return saveResult;
    } catch (error) {
      console.error(
        `Error in savePost controller for postId ${postId} and userId ${userId}:`,
        error,
      );
      throw new InternalServerErrorException('Failed to save post');
    }
  }

  @Get('saved/:userId')
  async getSavedPosts(@Param('userId') userId: string): Promise<GetPostDto[]> {
    try {
      return await this.postsService.getSavedPosts(userId);
    } catch (error) {
      console.error(
        `Error in getSavedPosts controller for userId ${userId}:`,
        error,
      );
      throw new InternalServerErrorException('Failed to fetch saved posts');
    }
  }

  @Post(':postId/comment/:userId')
  @UsePipes(new ValidationPipe())
  async addComment(
    @Param('postId') postId: string,
    @Param('userId') userId: string,
    @Body() createCommentDto: CreateCommentDto,
  ) {
    try {
      const comment = await this.postsService.addComment(
        postId,
        createCommentDto,
        userId,
      );
      return comment;
    } catch (error) {
      console.error(
        `Error in addComment controller for postId ${postId}:`,
        error,
      );
      throw new InternalServerErrorException('Failed to add comment');
    }
  }

  @Get(':postId/comments')
  async getComments(@Param('postId') postId: string): Promise<GetCommentDto[]> {
    try {
      return await this.postsService.getComments(postId);
    } catch (error) {
      console.error(
        `Error in getComments controller for postId ${postId}:`,
        error,
      );
      throw new InternalServerErrorException('Failed to fetch comments');
    }
  }
}
