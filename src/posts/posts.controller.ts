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
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { Post as PostEntity } from './infrastructure/database/post.schema';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  @UsePipes(new ValidationPipe())
  async addPost(@Body() createPostDto: CreatePostDto) {
    try {
      console.log('Received request to create post:', createPostDto);
      const post = await this.postsService.addPost(createPostDto);
      console.log('Post created successfully:', post);
      return post;
    } catch (error) {
      console.error('Error in addPost controller:', error);
      throw new InternalServerErrorException('Failed to create post');
    }
  }

  @Get()
  async getAllPosts() {
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
}
