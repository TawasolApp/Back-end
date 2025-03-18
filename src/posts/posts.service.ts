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
import {
  Profile,
  ProfileDocument,
} from '../profiles/infrastructure/database/profile.schema'; // Import Profile schema
import {
  Company,
  CompanyDocument,
} from '../companies/infrastructure/database/company.schema'; // Import Company schema
import { React, ReactDocument } from './infrastructure/database/react.schema';

@Injectable()
export class PostsService {
  constructor(
    @InjectModel(Post.name) private postModel: Model<PostDocument>,
    @InjectModel(Profile.name) private profileModel: Model<ProfileDocument>, // Inject Profile model
    @InjectModel(Company.name) private companyModel: Model<CompanyDocument>, // Inject Company model
    @InjectModel(React.name) private reactModel: Model<ReactDocument>, // Inject React model
  ) {}

  async addPost(createPostDto: CreatePostDto): Promise<{ message: string }> {
    let authorType: 'User' | 'Company';
    const authorProfile = await this.profileModel
      .find({ _id: new Types.ObjectId(createPostDto.authorId) })
      .exec();
    if (authorProfile) {
      authorType = 'User';
    } else {
      const authorCompany = await this.companyModel
        .find({ _id: new Types.ObjectId(createPostDto.authorId) })
        .exec();
      if (authorCompany) {
        authorType = 'Company';
      } else {
        throw new NotFoundException('Author not found');
      }
    }

    const createdPost = new this.postModel({
      _id: new Types.ObjectId(),
      ...createPostDto,
      author_id: createPostDto.authorId,
      author_type: authorType,
    });
    const savedPost = await createdPost.save();
    return { message: 'Post added successfully' };
  }

  async getAllPosts(): Promise<GetPostDto[]> {
    try {
      const posts = await this.postModel.find().exec();
      return Promise.all(posts.map((post) => this.mapToGetPostDto(post)));
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

  async getUserPosts(userId: string): Promise<GetPostDto[]> {
    try {
      const posts = await this.postModel
        .find({ author_id: new Types.ObjectId(userId) })
        .exec();
      return Promise.all(posts.map((post) => this.mapToGetPostDto(post)));
    } catch (error) {
      console.error(`Error fetching posts for user with id ${userId}:`, error);
      throw new InternalServerErrorException('Failed to fetch user posts');
    }
  }

  private async mapToGetPostDto(
    post: PostDocument,
    userId?: string,
  ): Promise<GetPostDto> {
    let authorProfile;
    let authorProfilePicture;
    if (post.author_type === 'User') {
      authorProfile = await this.profileModel.findById(post.author_id).exec();
      authorProfilePicture = authorProfile.profile_picture;
    } else if (post.author_type === 'Company') {
      authorProfile = await this.companyModel.findById(post.author_id).exec();
      authorProfilePicture = authorProfile.logo;
    }
    if (!authorProfile) {
      throw new NotFoundException('Author profile not found');
    }

    let userReactionType: 'Like' | 'Love' | 'Laugh' | 'Clap' | null = null;
    if (userId) {
      const userReaction = await this.reactModel
        .findOne({
          post: post._id,
          user: new Types.ObjectId(userId),
        })
        .exec();
      userReactionType = userReaction
        ? (userReaction.type as 'Like' | 'Love' | 'Laugh' | 'Clap')
        : null;
    }

    return {
      id: post.id.toString(),
      authorId: post.author_id.toString(),
      authorName: authorProfile.name, // Fetch authorName from profile
      authorPicture: authorProfilePicture, // Fetch authorPicture from profile
      authorBio: authorProfile.bio, // Fetch authorBio from profile
      content: post.text,
      media: post.media,
      likes: post.react_count,
      comments: post.comment_count,
      shares: post.share_count,
      taggedUsers: post.tags.map((tag) => tag.toString()),
      visibility: post.visibility as 'Public' | 'Connections' | 'Private',
      authorType: post.author_type as 'User' | 'Company',
      reactType: userReactionType, // Add logic to determine if the post is liked
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
