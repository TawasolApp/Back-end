import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Post, PostDocument } from './infrastructure/database/post.schema';
import { CreatePostDto } from './dto/create-post.dto';
import { GetPostDto } from './dto/get-post.dto';
import { Profile, ProfileDocument } from '../profiles/infrastructure/database/profile.schema'; // Import Profile schema

@Injectable()
export class PostsService {
  constructor(
    @InjectModel(Post.name) private postModel: Model<PostDocument>,
    @InjectModel(Profile.name) private profileModel: Model<ProfileDocument> // Inject Profile model
  ) {}

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

  async getAllPosts(): Promise<GetPostDto[]> {
    try {
      const posts = await this.postModel.find().exec();
      return Promise.all(posts.map(post => this.mapToGetPostDto(post)));
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

  
  async getPost(id: string): Promise<GetPostDto> {
    try {
      const post = await this.postModel.findById(id).exec();
      if (!post) {
        throw new NotFoundException('Post not found');
      }
      return this.mapToGetPostDto(post); // Use mapToGetPostDto method
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
  
  private async mapToGetPostDto(post: PostDocument): Promise<GetPostDto> {
    const authorProfile = await this.profileModel.findById(post.authorId).exec();
    if (!authorProfile) {
      throw new NotFoundException('Author profile not found');
    }
    return {
      id: post.id.toString(),
      authorId: post.authorId.toString(),
      authorName: authorProfile.name, // Fetch authorName from profile
      authorPicture: authorProfile.profile_picture, // Fetch authorPicture from profile
      authorBio: authorProfile.bio, // Fetch authorBio from profile
      content: post.text,
      media: post.media,
      likes: post.react_count,
      comments: post.comment_count,
      shares: post.share_count,
      taggedUsers: post.tags.map(tag => tag.toString()),
      visibility: post.visibility as 'Public' | 'Connections' | 'Private',
      authorType: post.author_type as 'User' | 'Company',
      isLiked: false, // Add logic to determine if the post is liked
      timestamp: post.posted_at,
    };
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
