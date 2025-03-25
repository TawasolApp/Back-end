import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
  UnauthorizedException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Post, PostDocument } from './infrastructure/database/post.schema';
import { CreatePostDto } from './dto/create-post.dto';
import { GetPostDto } from './dto/get-post.dto';
import {
  Profile,
  ProfileDocument,
} from '../profiles/infrastructure/database/profile.schema';
import {
  Company,
  CompanyDocument,
} from '../companies/infrastructure/database/company.schema';
import { React, ReactDocument } from './infrastructure/database/react.schema';
import { Reactions, UpdateReactionsDto } from './dto/update-reactions.dto';
import { ReactionDto } from './dto/get-reactions.dto';
import { Save, SaveDocument } from './infrastructure/database/save.schema';
import { EditPostDto } from './dto/edit-post.dto';
import {
  Comment,
  CommentDocument,
} from './infrastructure/database/comment.schema';
import { CreateCommentDto } from './dto/create-comment.dto';
import { GetCommentDto } from './dto/get-comment.dto';
import { EditCommentDto } from './dto/edit-comment.dto';
import { th } from '@faker-js/faker/.';

@Injectable()
export class PostsService {
  constructor(
    @InjectModel(Post.name) private postModel: Model<PostDocument>,
    @InjectModel(Profile.name) private profileModel: Model<ProfileDocument>,
    @InjectModel(Company.name) private companyModel: Model<CompanyDocument>,
    @InjectModel(React.name) private reactModel: Model<ReactDocument>,
    @InjectModel(Save.name) private saveModel: Model<SaveDocument>,
    @InjectModel(Comment.name) private commentModel: Model<CommentDocument>,
  ) {}

  async editPost(
    id: string,
    editPostDto: EditPostDto,
    userId: string,
  ): Promise<Post> {
    try {
      // Validate post ID format
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException('Invalid post ID format');
      }

      const post = await this.findPostById(id);
      if (!post) {
        throw new NotFoundException('Post not found');
      }

      // Check if the user is authorized to edit the post
      if (post.author_id.toString() !== userId) {
        throw new UnauthorizedException(
          'User not authorized to edit this post',
        );
      }

      // Validate user ID format
      if (!Types.ObjectId.isValid(userId)) {
        throw new BadRequestException('Invalid user ID format');
      }

      let authorType: 'User' | 'Company';
      const authorProfile = await this.profileModel
        .findById(new Types.ObjectId(userId))
        .exec();
      if (authorProfile) {
        authorType = 'User';
      } else {
        const authorCompany = await this.companyModel
          .find({ _id: new Types.ObjectId(userId) })
          .exec();
        if (authorCompany) {
          authorType = 'Company';
        } else {
          throw new NotFoundException('Author not found');
        }
      }
      post.author_id = new Types.ObjectId(userId);
      post.author_type = authorType;

      Object.assign(post, editPostDto);
      await post.save();
      return post;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ConflictException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }
      console.error('Internal server error:', error);
      throw new InternalServerErrorException('Failed to edit post');
    }
  }

  async addPost(
    createPostDto: CreatePostDto,
    author_id: string,
  ): Promise<GetPostDto> {
    try {
      // Validate author ID format
      if (!Types.ObjectId.isValid(author_id)) {
        throw new BadRequestException('Invalid author ID format');
      }

      let authorType: 'User' | 'Company';
      // Check if the author is a User
      const authorProfile = await this.profileModel
        .findById(new Types.ObjectId(author_id))
        .exec();
      if (authorProfile) {
        authorType = 'User';
      } else {
        // Check if the author is a Company
        const authorCompany = await this.companyModel
          .findById(new Types.ObjectId(author_id))
          .exec();
        if (authorCompany) {
          authorType = 'Company';
        } else {
          throw new NotFoundException('Author not found');
        }
      }

      // Create a new post
      const createdPost = new this.postModel({
        _id: new Types.ObjectId(),
        text: createPostDto.content,
        media: createPostDto.media,
        tags: (createPostDto.taggedUsers ?? []).map(
          (tag) => new Types.ObjectId(tag),
        ),
        visibility: createPostDto.visibility,
        author_id: new Types.ObjectId(author_id),
        author_type: authorType,
      });

      // Save the post to the database
      const savedPost = await createdPost.save();
      return this.mapToGetPostDto(savedPost, author_id);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      console.error('Internal server error:', error);
      throw new InternalServerErrorException('Failed to add post');
    }
  }

  async getAllPosts(
    page: number,
    limit: number,
    userId: string,
  ): Promise<GetPostDto[]> {
    const skip = (page - 1) * limit;
    try {
      const posts = await this.postModel.find().skip(skip).limit(limit).exec();
      if (posts.length === 0) {
        throw new NotFoundException('No posts found for the requested page');
      }
      return Promise.all(
        posts.map((post) => this.mapToGetPostDto(post, userId)),
      );
    } catch (error) {
      console.error('Error fetching all posts:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      if (error.name === 'NetworkError') {
        throw new InternalServerErrorException(
          'Network error occurred while fetching posts',
        );
      }
      throw new InternalServerErrorException('Failed to fetch posts');
    }
  }

  async getPost(id: string, userId: string): Promise<GetPostDto> {
    try {
      const post = await this.postModel.findById(new Types.ObjectId(id)).exec();
      if (!post) {
        throw new NotFoundException('Post not found');
      }
      return this.mapToGetPostDto(post, userId); // Use mapToGetPostDto method
    } catch (error) {
      console.error(`Error fetching post with id ${id}:`, error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      if (
        error.message ===
        'input must be a 24 character hex string, 12 byte Uint8Array, or an integer'
      ) {
        throw new NotFoundException('Invalid post id format');
      }
      console.log(error);
      throw new InternalServerErrorException('Failed to fetch post');
    }
  }

  async getUserPosts(
    searchedUserId: string,
    userId: string,
  ): Promise<GetPostDto[]> {
    try {
      //console.log(searchedUserId);
      const posts = await this.postModel
        .find({ author_id: searchedUserId })
        .exec();
      if (!posts || posts.length == 0) {
        throw new NotFoundException('No posts found');
      }
      //console.log(posts);
      return Promise.all(
        posts.map((post) => this.mapToGetPostDto(post, userId)),
      );
    } catch (error) {
      throw error;
    }
  }

  private async mapToGetPostDto(
    post: PostDocument,
    userId: string,
  ): Promise<GetPostDto> {
    let authorProfile;
    let authorProfilePicture;
    if (post.author_type === 'User') {
      authorProfile = await this.profileModel
        .findById(new Types.ObjectId(post.author_id))
        .exec();
      if (!authorProfile) {
        console.error(`User profile with id ${post.author_id} not found`);
        throw new NotFoundException('Author profile not found');
      }
      authorProfilePicture = authorProfile.profile_picture;
    } else if (post.author_type === 'Company') {
      authorProfile = await this.companyModel
        .findById(new Types.ObjectId(post.author_id))
        .exec();
      if (!authorProfile) {
        console.error(`Company profile with id ${post.author_id} not found`);
        throw new NotFoundException('Author profile not found');
      }
      authorProfilePicture = authorProfile.logo;
    } else {
      throw new Error('Invalid author type');
    }

    let userReactionType:
      | 'Like'
      | 'Love'
      | 'Funny'
      | 'Celebrate'
      | 'Insightful'
      | 'Support'
      | null = null;
    if (userId) {
      const userReaction = await this.reactModel
        .findOne({
          post_id: post._id, // Ensure the correct field is used
          user_id: new Types.ObjectId(userId), // Ensure userId is converted to ObjectId
        })
        .exec();
      userReactionType = userReaction
        ? (userReaction.react_type as
            | 'Like'
            | 'Love'
            | 'Funny'
            | 'Celebrate'
            | 'Insightful'
            | 'Support')
        : null;
    }

    const isSaved = await this.saveModel.exists({
      post_id: post._id,
      user_id: new Types.ObjectId(userId),
    });

    return {
      id: post.id.toString(),
      authorId: post.author_id.toString(),
      authorName: authorProfile.name, // Fetch authorName from profile
      authorPicture: authorProfilePicture, // Fetch authorPicture from profile
      authorBio: authorProfile.bio, // Fetch authorBio from profile
      content: post.text,
      media: post.media,
      reactCounts: post.react_count, // Use the new reactCounts structure
      comments: post.comment_count,
      shares: post.share_count,
      taggedUsers: post.tags.map((tag) => tag.toString()),
      visibility: post.visibility as 'Public' | 'Connections' | 'Private',
      authorType: post.author_type as 'User' | 'Company',
      reactType: userReactionType, // Add logic to determine if the post is liked
      timestamp: post.posted_at,
      isSaved: !!isSaved || false, // Add isSaved property, return false if not saved
    };
  }

  async deletePost(id: string, userId: string): Promise<void> {
    try {
      const post = await this.findPostById(id);
      if (post.author_id.toString() !== userId) {
        throw new UnauthorizedException(
          'User not authorized to delete this post',
        );
      }
      const result = await this.postModel.deleteOne({ _id: id }).exec();
      if (result.deletedCount === 0) {
        throw new NotFoundException('Post not found');
      }

      // Delete related data
      await this.reactModel.deleteMany({ post_id: id }).exec();
      await this.commentModel.deleteMany({ post_id: id }).exec();
      await this.saveModel.deleteMany({ post_id: id }).exec();
      // await this.shareModel.deleteMany({ post_id: id }).exec();
    } catch (error) {
      // console.error(`Error deleting post with id ${id}:`, error);
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

  async updateReactions(
    postId: string,
    userId: string,
    updateReactionsDto: UpdateReactionsDto,
  ): Promise<Post | Comment> {
    let count = 0;

    for (const reaction in updateReactionsDto.reactions) {
      if (updateReactionsDto.reactions[reaction] === true) {
        count++;
      }
    }

    if (count > 1) {
      throw new BadRequestException('Only one reaction is allowed');
    }
    let post;
    let comment;
    const objectIdPostId = new Types.ObjectId(postId); // Convert postId to ObjectId
    //console.log(`Converted postId to ObjectId: ${objectIdPostId}`);
    if (updateReactionsDto.postType === 'Post') {
      post = await this.postModel
        .findById(objectIdPostId) // Use converted ObjectId
        .exec();

      if (!post) {
        console.error(`Post with id ${postId} not found`);
        //console.log(`Checking if post exists in the database...`);
        const postExists = await this.postModel.exists({ _id: objectIdPostId });
        //console.log(`Post exists: ${postExists}`);
        throw new NotFoundException(`Post with id ${postId} not found`);
      }
    } else {
      comment = await this.commentModel.findById(objectIdPostId).exec();
      if (!comment) {
        console.error(`Comment with id ${postId} not found`);
        //console.log(`Checking if comment exists in the database...`);
        const commentExists = await this.commentModel.exists({
          _id: objectIdPostId,
        });
        //console.log(`Comment exists: ${commentExists}`);
        throw new NotFoundException(`Comment with id ${postId} not found`);
      }
    }

    const reactions = updateReactionsDto.reactions;
    for (const [reactionType, value] of Object.entries(reactions)) {
      let reactorType: 'User' | 'Company';
      const reactorProfile = await this.profileModel
        .findById(new Types.ObjectId(userId))
        .exec();
      if (reactorProfile) {
        reactorType = 'User';
      } else {
        const reactorCompany = await this.companyModel
          .findById(new Types.ObjectId(userId))
          .exec();
        if (reactorCompany) {
          reactorType = 'Company';
        } else {
          throw new NotFoundException('Reactor not found');
        }
      }
      if (value === true) {
        const existingReaction = await this.reactModel
          .findOne({
            post_id: objectIdPostId, // Use converted ObjectId
            user_id: new Types.ObjectId(userId), // Ensure userId is converted to ObjectId
            user_type: reactorType,
          })
          .exec();
        if (!existingReaction) {
          const newReaction = new this.reactModel({
            _id: new Types.ObjectId(),
            post_id: objectIdPostId, // Use converted ObjectId
            user_id: new Types.ObjectId(userId), // Ensure userId is converted to ObjectId
            user_type: reactorType,
            react_type: reactionType,
            post_type: updateReactionsDto.postType,
          });
          //console.log(`Added ${reactionType} reaction`);
          if (post) {
            post.react_count[reactionType] =
              (post.react_count[reactionType] || 0) + 1;
            await post.save();
            newReaction.post_type = 'Post';
            await newReaction.save();
          }
          if (comment) {
            comment.react_count++;
            await comment.save();
            newReaction.post_type = 'Comment';
            await newReaction.save();
          }
        } else {
          // Update the existing reaction
          if (existingReaction.react_type !== reactionType) {
            if (post) {
              post.react_count[existingReaction.react_type]--;
              post.react_count[reactionType] =
                (post.react_count[reactionType] || 0) + 1;
              await post.save();
            }
            existingReaction.react_type = reactionType;
            await existingReaction.save();
            //console.log(`Updated reaction to ${reactionType} for post`);
          }
        }
      } else {
        const existingReaction = await this.reactModel
          .findOne({
            post_id: objectIdPostId, // Use converted ObjectId
            user_id: new Types.ObjectId(userId), // Ensure userId is converted to ObjectId
            user_type: reactorType,
            react_type: reactionType,
          })
          .exec();
        //console.log(`Existing reaction: ${existingReaction}`);
        if (existingReaction) {
          await this.reactModel.deleteOne({ _id: existingReaction._id }).exec();
          if (post) {
            post.react_count[reactionType]--;
            await post.save();
          }
          if (comment) {
            comment.react_count--;
            await comment.save();
          }
          //console.log(`Removed ${reactionType} reaction from post`);
        }
      }
    }
    let returned;
    if (post) {
      returned = post;
    }
    if (comment) {
      returned = comment;
    }
    return returned;
  }

  async getReactions(
    postId: string,
    page: number,
    limit: number,
    userId: string,
  ): Promise<ReactionDto[]> {
    try {
      const skip = (page - 1) * limit;
      const objectIdPostId = new Types.ObjectId(postId); // Convert postId to ObjectId
      const reactions = await this.reactModel
        .find({ post_id: objectIdPostId })
        .skip(skip)
        .limit(limit)
        .exec();
      if (!reactions || reactions.length === 0) {
        throw new NotFoundException('Reactions not found');
      }
      //console.log(reactions);
      return Promise.all(
        reactions.map((reaction) => this.mapToReactionDto(reaction)),
      );
    } catch (err) {
      console.error(
        `Error fetching reactions for post with id ${postId}:`,
        err,
      );
      if (err instanceof NotFoundException) {
        throw err;
      }
      if (
        err.message ===
        'input must be a 24 character hex string, 12 byte Uint8Array, or an integer'
      ) {
        throw new NotFoundException('Invalid post id format');
      }
      throw new InternalServerErrorException('Failed to fetch reactions');
    }
  }

  async mapToReactionDto(reaction: ReactDocument): Promise<ReactionDto> {
    let authorProfile;
    let authorProfilePicture;
    if (reaction.user_type === 'User') {
      authorProfile = await this.profileModel.findById(reaction.user_id).exec();
      if (!authorProfile) {
        console.error(`User profile with id ${reaction.user_id} not found`);
        throw new NotFoundException('Author profile not found');
      }
      authorProfilePicture = authorProfile.profile_picture;
    } else if (reaction.user_type === 'Company') {
      authorProfile = await this.companyModel.findById(reaction.user_id).exec();
      if (!authorProfile) {
        console.error(`Company profile with id ${reaction.user_id} not found`);
        throw new NotFoundException('Author profile not found');
      }
      authorProfilePicture = authorProfile.logo;
    }
    //console.log(authorProfile);
    return {
      likeId: reaction._id.toString(),
      postId: reaction.post_id.toString(),
      authorId: reaction.user_id.toString(),
      authorType: reaction.user_type as 'User' | 'Company',
      type: reaction.react_type as
        | 'Like'
        | 'Love'
        | 'Funny'
        | 'Celebrate'
        | 'Insightful'
        | 'Support',
      authorName: authorProfile.name,
      authorPicture: authorProfilePicture,
      authorBio: authorProfile.bio,
    };
  }

  async savePost(postId: string, userId: string): Promise<{ message: string }> {
    const post = await this.postModel
      .findById(new Types.ObjectId(postId))
      .exec();
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (
      await this.saveModel.exists({
        post_id: new Types.ObjectId(post._id),
        user_id: new Types.ObjectId(userId),
      })
    ) {
      throw new BadRequestException('Post already saved');
    }

    const save = new this.saveModel({
      _id: new Types.ObjectId(),
      user_id: new Types.ObjectId(userId),
      post_id: new Types.ObjectId(postId),
    });

    await save.save();
    return { message: 'Post saved successfully' };
  }

  async unsavePost(
    postId: string,
    userId: string,
  ): Promise<{ message: string }> {
    const post = await this.postModel
      .findById(new Types.ObjectId(postId))
      .exec();
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const save = await this.saveModel.findOneAndDelete({
      post_id: new Types.ObjectId(postId),
      user_id: new Types.ObjectId(userId),
    });

    if (!save) {
      throw new NotFoundException('Saved post not found');
    }

    return { message: 'Post unsaved successfully' };
  }

  async getSavedPosts(userId: string): Promise<GetPostDto[]> {
    try {
      const savedPosts = await this.saveModel
        .find({ user_id: new Types.ObjectId(userId) })
        .exec();
      //console.log(savedPosts);
      if (!savedPosts || savedPosts.length === 0) {
        throw new NotFoundException('No saved posts found');
      }

      return Promise.all(
        savedPosts.map(async (save) => {
          const post = await this.postModel
            .findById(new Types.ObjectId(save.post_id))
            .exec();
          if (!post) {
            throw new NotFoundException('Post not found');
          }
          return this.mapToGetPostDto(post, userId);
        }),
      );
    } catch (error) {
      console.error(
        `Error fetching saved posts for user with id ${userId}:`,
        error,
      );
      throw new InternalServerErrorException('Failed to fetch saved posts');
    }
  }

  async addComment(
    postId: string,
    createCommentDto: CreateCommentDto,
    userId: string,
  ): Promise<Comment> {
    const post = await this.postModel
      .findById(new Types.ObjectId(postId))
      .exec();
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    let authorType: 'User' | 'Company';
    const authorProfile = await this.profileModel
      .findById(new Types.ObjectId(userId))
      .exec();
    if (authorProfile) {
      authorType = 'User';
    } else {
      const authorCompany = await this.companyModel
        .findById(new Types.ObjectId(userId))
        .exec();
      if (authorCompany) {
        authorType = 'Company';
      } else {
        throw new NotFoundException('Author not found');
      }
    }

    const newComment = new this.commentModel({
      _id: new Types.ObjectId(),
      post_id: new Types.ObjectId(postId),
      author_type: authorType,
      author_id: new Types.ObjectId(userId),
      content: createCommentDto.content,
      tags:
        createCommentDto.tagged?.map((tag) => new Types.ObjectId(tag)) || [],
      react_count: 0,
      replies: [],
    });

    // console.log(newComment);

    await newComment.save();
    post.comment_count++;
    await post.save();

    return newComment;
  }

  async getComments(
    postId: string,
    page: number,
    limit: number,
    userId: string, // Add userId parameter
  ): Promise<GetCommentDto[]> {
    const skip = (page - 1) * limit;
    const comments = await this.commentModel
      .find({ post_id: new Types.ObjectId(postId) })
      .skip(skip)
      .limit(limit)
      .exec();
    if (!comments || comments.length === 0) {
      throw new NotFoundException('No comments found for the requested page');
    }

    return Promise.all(
      comments.map((comment) => this.mapToGetCommentDto(comment, userId)), // Pass userId to mapToGetCommentDto
    );
  }

  private async mapToGetCommentDto(
    comment: CommentDocument,
    userId: string, // Add userId parameter
  ): Promise<GetCommentDto> {
    let authorProfile;
    let authorProfilePicture;
    let authorName = 'Unknown';
    let authorBio = '';

    if (comment.author_type === 'User') {
      authorProfile = await this.profileModel
        .findById(comment.author_id)
        .exec();
      if (authorProfile) {
        authorProfilePicture = authorProfile.profile_picture;
        authorName = authorProfile.name;
        authorBio = authorProfile.bio;
      } else {
        console.log(`User profile with id ${comment.author_id} not found`);
      }
    } else if (comment.author_type === 'Company') {
      authorProfile = await this.companyModel
        .findById(comment.author_id)
        .exec();
      if (authorProfile) {
        authorProfilePicture = authorProfile.logo;
        authorName = authorProfile.name;
        authorBio = authorProfile.bio;
      } else {
        console.log(`Company profile with id ${comment.author_id} not found`);
      }
    }

    let userReactionType:
      | 'Like'
      | 'Love'
      | 'Funny'
      | 'Celebrate'
      | 'Insightful'
      | 'Support'
      | null = null;
    if (userId) {
      const userReaction = await this.reactModel
        .findOne({
          post_id: comment._id, // Ensure the correct field is used
          user_id: new Types.ObjectId(userId), // Ensure userId is converted to ObjectId
        })
        .exec();
      userReactionType = userReaction
        ? (userReaction.react_type as
            | 'Like'
            | 'Love'
            | 'Funny'
            | 'Celebrate'
            | 'Insightful'
            | 'Support')
        : null;
    }

    // const replies = await Promise.all(
    //   comment.replies.map(async (reply) => {
    //     let replyAuthorProfile;
    //     let replyAuthorProfilePicture;
    //     let replyAuthorName = 'Unknown';
    //     let replyAuthorBio = '';

    //     if (reply.author_type === 'User') {
    //       replyAuthorProfile = await this.profileModel
    //         .findById(reply.author_id)
    //         .exec();
    //       if (replyAuthorProfile) {
    //         replyAuthorProfilePicture = replyAuthorProfile.profile_picture;
    //         replyAuthorName = replyAuthorProfile.name;
    //         replyAuthorBio = replyAuthorProfile.bio;
    //       } else {
    //         console.log(
    //           `Reply user profile with id ${reply.author_id} not found`,
    //         );
    //       }
    //     } else if (reply.author_type === 'Company') {
    //       replyAuthorProfile = await this.companyModel
    //         .findById(reply.author_id)
    //         .exec();
    //       if (replyAuthorProfile) {
    //         replyAuthorProfilePicture = replyAuthorProfile.logo;
    //         replyAuthorName = replyAuthorProfile.name;
    //         replyAuthorBio = replyAuthorProfile.bio;
    //       } else {
    //         console.log(
    //           `Reply company profile with id ${reply.author_id} not found`,
    //         );
    //       }
    //     }

    //     return {
    //       authorId: reply.author_id.toString(),
    //       authorName: replyAuthorName,
    //       authorPicture: replyAuthorProfilePicture,
    //       authorBio: replyAuthorBio,
    //       text: reply.content,
    //       reactCount: reply.reacts.length,
    //       taggedUsers: reply.tags.map((tag) => tag.toString()),
    //     };
    //   }),
    // );

    return {
      id: comment._id.toString(),
      postId: comment.post_id.toString(),
      authorId: comment.author_id.toString(),
      authorName: authorName,
      authorPicture: authorProfilePicture,
      authorBio: authorBio,
      authorType: comment.author_type as 'User' | 'Company',
      content: comment.content,
      replies: [], // add replies
      reactCount: comment.react_count,
      timestamp: comment.commented_at.toISOString(),
      taggedUsers: comment.tags.map((tag) => tag.toString()),
      reactType: userReactionType, // Add reaction type to DTO
    };
  }

  private async findPostById(id: string): Promise<PostDocument> {
    try {
      const post = await this.postModel.findById(new Types.ObjectId(id)).exec();
      if (!post) {
        console.error(`Error finding post with id ${id}`);
        throw new NotFoundException('Post not found with ');
      }
      return post;
    } catch (error) {
      // console.error(`Error finding post with id ${id}:`, error);
      if (error.name === 'CastError') {
        throw new NotFoundException('Invalid post id format');
      }
      throw new InternalServerErrorException('Failed to find post');
    }
  }

  async editComment(
    commentId: string,
    editCommentDto: EditCommentDto,
    userId: string,
  ): Promise<Comment> {
    const comment = await this.commentModel
      .findById(new Types.ObjectId(commentId))
      .exec();
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }
    console.log(comment);
    const authorId = comment.author_id.toString();
    if (authorId !== userId) {
      throw new UnauthorizedException(
        'User not authorized to edit this comment',
      );
    }
    Object.assign(comment, editCommentDto);
    return await comment.save();
  }

  async deleteComment(commentId: string, userId: string): Promise<void> {
    const comment = await this.commentModel.findById(commentId);
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }
    const authorId = comment.author_id.toString();
    if (authorId !== userId) {
      throw new UnauthorizedException(
        'User not authorized to edit this comment',
      );
    }

    await this.reactModel.deleteMany({ post_id: commentId }).exec();
    const result = await this.commentModel.deleteOne({ _id: commentId }).exec();
  }
}
