import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Post, PostDocument } from './infrastructure/database/post.schema';
import { CreatePostDto } from './dto/create-post.dto';

@Injectable()
export class PostsService {
  constructor(@InjectModel(Post.name) private postModel: Model<PostDocument>) {}

  async addPost(createPostDto: CreatePostDto): Promise<Post> {
    //TODO : Add User Authentication
    //TODO : Make sure that the creator id and the tagged users are valid.
    try {
      const post = new this.postModel(createPostDto);
      return await post.save();
    } catch (error) {
      console.error('Error creating post:', error);
      if (error.name === 'ValidationError') {
        throw new InternalServerErrorException(
          'Validation failed for the post data',
        );
      }
      throw new InternalServerErrorException('Failed to create post');
    }
  }

  async getAllPosts(): Promise<Post[]> {
    try {
      return await this.postModel.find().exec();
    } catch (error) {
      console.error('Error fetching all posts:', error);
      if (error.name === 'NetworkError') {
        throw new InternalServerErrorException(
          'Network error occurred while fetching posts',
        );
      }
      throw new InternalServerErrorException('Failed to fetch posts');
    }
  }

  async getPost(id: string): Promise<Post> {
    try {
      const post = await this.postModel.findById(id).exec();
      if (!post) {
        throw new NotFoundException('Post not found');
      }
      return post;
    } catch (error) {
      console.error(`Error fetching post with id ${id}:`, error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      if (error.name === 'CastError') {
        throw new NotFoundException('Invalid post id format');
      }
      throw new InternalServerErrorException('Failed to fetch post');
    }
  }

  async deletePost(id: string): Promise<void> {
    try {
      const result = await this.postModel.deleteOne({ _id: id }).exec();
      if (result.deletedCount === 0) {
        throw new NotFoundException('Post not found');
      }
    } catch (error) {
      console.error(`Error deleting post with id ${id}:`, error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      if (error.name === 'CastError') {
        throw new NotFoundException('Invalid post id');
      }
      if (error.name === 'NetworkError') {
        throw new InternalServerErrorException(
          'Network error occurred while deleting post',
        );
      }
      throw new InternalServerErrorException('Failed to delete post');
    }
  }
}
