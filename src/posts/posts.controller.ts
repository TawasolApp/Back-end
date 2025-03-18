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
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { GetPostDto } from './dto/get-post.dto';
import { Post as PostEntity } from './infrastructure/database/post.schema';
import { UpdateReactionsDto } from './dto/update-reactions.dto';
import { ReactionDto } from './dto/get-reactions.dto';

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
}
