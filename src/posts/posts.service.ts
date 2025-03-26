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
import { Model, Types, isValidObjectId } from 'mongoose';
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
import { UpdateReactionsDto } from './dto/update-reactions.dto';
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

  // Edit an existing post by checking the author's validity and updating the fields.
  // Description:
  // 1. Validate post and user ID formats.
  // 2. Find the post by ID.
  // 3. Check if the user is authorized to edit the post.
  // 4. Determine the author's type (User or Company).
  // 5. Update post fields and save.
  // 6. Return the updated post.

  async editPost(
    id: string,
    editPostDto: EditPostDto,
    userId: string,
  ): Promise<Post> {
    try {
      if (!isValidObjectId(id)) {
        throw new BadRequestException('Invalid post ID format');
      }
      if (!isValidObjectId(userId)) {
        throw new BadRequestException('Invalid user ID format');
      }

      const post = await this.findPostById(id);
      if (!post) {
        throw new NotFoundException('Post not found');
      }

      if (post.author_id.toString() !== userId) {
        throw new UnauthorizedException(
          'User not authorized to edit this post',
        );
      }

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
          .findById({ _id: new Types.ObjectId(userId) })
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
      throw new InternalServerErrorException('Failed to edit post');
    }
  }

  // Create and save a new post with content, media, and visibility.
  // Description:
  // 1. Validate the author ID format.
  // 2. Check if the author is a User or Company.
  // 3. Create a new post instance with author and content details.
  // 4. Save the post to the database.
  // 5. Return the formatted post DTO.

  async addPost(
    createPostDto: CreatePostDto,
    author_id: string,
  ): Promise<GetPostDto> {
    try {
      if (!Types.ObjectId.isValid(author_id)) {
        throw new BadRequestException('Invalid author ID format');
      }

      let authorType: 'User' | 'Company';
      const authorProfile = await this.profileModel
        .findById(new Types.ObjectId(author_id))
        .exec();
      if (authorProfile) {
        authorType = 'User';
      } else {
        const authorCompany = await this.companyModel
          .findById(new Types.ObjectId(author_id))
          .exec();
        if (authorCompany) {
          authorType = 'Company';
        } else {
          throw new NotFoundException('Author not found');
        }
      }

      const createdPost = new this.postModel({
        _id: new Types.ObjectId(),
        text: createPostDto.content,
        media: createPostDto.media,
        tags: [],
        visibility: createPostDto.visibility,
        author_id: new Types.ObjectId(author_id),
        author_type: authorType,
      });

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
      throw new InternalServerErrorException('Failed to add post');
    }
  }

  // Retrieve a paginated list of all posts for the user.
  // Description:
  // 1. Calculate the skip value for pagination.
  // 2. Retrieve a paginated list of posts.
  // 3. If no posts found, throw an error.
  // 4. Map each post to GetPostDto and return.

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
      if (error instanceof NotFoundException) {
        throw error;
      }
      if (error instanceof Error && error.name === 'NetworkError') {
        throw new InternalServerErrorException(
          'Network error occurred while fetching posts',
        );
      }
      throw new InternalServerErrorException('Failed to fetch posts');
    }
  }

  // Retrieve a specific post by its ID.
  // Steps:
  // 1. Find the post by ID.
  // 2. If not found, throw an error.
  // 3. Map the post to GetPostDto and return.
  async getPost(id: string, userId: string): Promise<GetPostDto> {
    try {
      const post = await this.postModel.findById(new Types.ObjectId(id)).exec();
      if (!post) {
        throw new NotFoundException('Post not found');
      }
      return this.mapToGetPostDto(post, userId); // Use mapToGetPostDto method
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      if (
        error.message ===
        'input must be a 24 character hex string, 12 byte Uint8Array, or an integer'
      ) {
        throw new NotFoundException('Invalid post id format');
      }
      throw new InternalServerErrorException('Failed to fetch post');
    }
  }

  // Retrieve all posts created by a specific user.
  // Description:
  // 1. Find posts authored by the specific user.
  // 2. If none found, throw an error.
  // 3. Map each post to GetPostDto and return.

  async getUserPosts(
    searchedUserId: string,
    userId: string,
  ): Promise<GetPostDto[]> {
    try {
      const posts = await this.postModel
        .find({ author_id: new Types.ObjectId(searchedUserId) })
        .exec();
      if (!posts || posts.length === 0) {
        throw new NotFoundException('No posts found');
      }
      return Promise.all(
        posts.map((post) => this.mapToGetPostDto(post, userId)),
      );
    } catch (error) {
      throw error;
    }
  }

  // Convert a post document to a formatted DTO object for client use.
  // Description:
  // 1. Find the author's profile or company info.
  // 2. Find user reaction if exists.
  // 3. Check if the post is saved.
  // 4. Return all post details as GetPostDto.

  async mapToGetPostDto(
    post: PostDocument,
    userId: string,
  ): Promise<GetPostDto> {
    let authorProfile: ProfileDocument | CompanyDocument | null = null;
    let authorProfilePicture: string | undefined;
    let authorBio: string | undefined;

    if (post.author_type === 'User') {
      authorProfile = await this.profileModel
        .findById(new Types.ObjectId(post.author_id))
        .exec();
      if (!authorProfile) {
        throw new NotFoundException('Author profile not found');
      }
      authorProfilePicture = authorProfile.profile_picture;
      authorBio = authorProfile.bio;
    } else if (post.author_type === 'Company') {
      authorProfile = await this.companyModel
        .findById(new Types.ObjectId(post.author_id))
        .exec();
      if (!authorProfile) {
        throw new NotFoundException('Author profile not found');
      }
      authorProfilePicture = authorProfile.logo;
      authorBio = authorProfile.description;
    } else {
      throw new Error('Invalid author type');
    }

    const userReaction = userId
      ? await this.reactModel
          .findOne({
            post_id: post._id,
            user_id: new Types.ObjectId(userId),
          })
          .exec()
      : null;

    const userReactionType = userReaction
      ? (userReaction.react_type as
          | 'Like'
          | 'Love'
          | 'Funny'
          | 'Celebrate'
          | 'Insightful'
          | 'Support')
      : null;

    const isSaved = await this.saveModel.exists({
      post_id: post._id,
      user_id: new Types.ObjectId(userId),
    });

    return {
      id: post.id.toString(),
      authorId: post.author_id.toString(),
      authorName: authorProfile.name,
      authorPicture: authorProfilePicture,
      authorBio: authorBio,
      content: post.text,
      media: post.media,
      reactCounts: post.react_count,
      comments: post.comment_count,
      shares: post.share_count,
      taggedUsers: [],
      visibility: post.visibility as 'Public' | 'Connections' | 'Private',
      authorType: post.author_type,
      reactType: userReactionType,
      timestamp: post.posted_at,
      isSaved: !!isSaved,
    };
  }

  // Delete a post and all associated reactions, comments, and saves.
  // Steps:
  // 1. Find the post by ID.
  // 2. Verify that the requesting user is the author.
  // 3. Delete the post, related reactions, comments, and saves.
  async deletePost(postId: string, userId: string): Promise<void> {
    const post = await this.postModel.findById(postId).exec();
    if (!post) {
      throw new NotFoundException('Post not found');
    }
    if (post.author_id.toString() !== userId) {
      throw new ForbiddenException('User not authorized to delete this post');
    }
    const result = await this.postModel.deleteOne({ _id: postId }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException('Post not found');
    }

    await this.reactModel.deleteMany({ post_id: postId }).exec();
    await this.commentModel.deleteMany({ post_id: postId }).exec();
    await this.saveModel.deleteMany({ post_id: postId }).exec();
  }

  // Add, update, or remove a user reaction on a post or comment.
  // Description:
  // 1. Validate user ID format.
  // 2. Ensure only one reaction is set to true.
  // 3. Depending on postType, find the post or comment.
  // 4. Update or create/delete the reaction.
  // 5. Update reaction counts accordingly.
  // 6. Return the updated post or comment.

  async updateReactions(
    postId: string,
    userId: string,
    updateReactionsDto: UpdateReactionsDto,
  ): Promise<Post | Comment> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID format');
    }

    const objectIdUserId = new Types.ObjectId(userId);

    let count = 0;

    for (const reaction in updateReactionsDto.reactions) {
      if (updateReactionsDto.reactions[reaction] === true) {
        count++;
      }
    }

    if (count > 1) {
      throw new BadRequestException('Only one reaction is allowed');
    }
    let post: PostDocument | null = null;
    let comment: CommentDocument | null = null;
    const objectIdPostId = new Types.ObjectId(postId);
    if (updateReactionsDto.postType === 'Post') {
      post = await this.postModel.findById(objectIdPostId).exec();

      if (!post) {
        const postExists = await this.postModel.exists({ _id: objectIdPostId });
        throw new NotFoundException(`Post with id ${postId} not found`);
      }
    } else {
      comment = await this.commentModel.findById(objectIdPostId).exec();
      if (!comment) {
        const commentExists = await this.commentModel.exists({
          _id: objectIdPostId,
        });
        throw new NotFoundException(`Comment with id ${postId} not found`);
      }
    }

    const reactions = updateReactionsDto.reactions;
    for (const [reactionType, value] of Object.entries(reactions)) {
      const reactorProfile = await this.profileModel
        .findById(objectIdUserId)
        .exec();
      const reactorType = reactorProfile ? 'User' : 'Company';

      if (value) {
        const existingReaction = await this.reactModel
          .findOne({
            post_id: objectIdPostId,
            user_id: objectIdUserId,
            user_type: reactorType,
          })
          .exec();
        if (!existingReaction) {
          const newReaction = new this.reactModel({
            _id: new Types.ObjectId(),
            post_id: objectIdPostId,
            user_id: objectIdUserId,
            user_type: reactorType,
            react_type: reactionType,
            post_type: updateReactionsDto.postType,
          });
          if (post) {
            post.react_count[reactionType] =
              (post.react_count[reactionType] || 0) + 1;
            await post.save();
          }
          if (comment) {
            comment.react_count++;
            await comment.save();
          }
          await newReaction.save();
        } else {
          if (existingReaction.react_type !== reactionType) {
            if (post) {
              post.react_count[existingReaction.react_type]--;
              post.react_count[reactionType] =
                (post.react_count[reactionType] || 0) + 1;
              await post.save();
            }
            existingReaction.react_type = reactionType;
            await existingReaction.save();
          }
        }
      } else {
        const existingReaction = await this.reactModel
          .findOne({
            post_id: objectIdPostId,
            user_id: objectIdUserId,
            user_type: reactorType,
            react_type: reactionType,
          })
          .exec();
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

  // Retrieve paginated list of all reactions for a specific post.
  // Description:
  // 1. Validate post ID and pagination.
  // 2. Find all reactions for the post.
  // 3. Map each reaction to ReactionDto and return.

  async getReactions(
    postId: string,
    page: number,
    limit: number,
    userId: string,
  ): Promise<ReactionDto[]> {
    try {
      const skip = (page - 1) * limit;
      const objectIdPostId = new Types.ObjectId(postId);
      const reactions = await this.reactModel
        .find({ post_id: objectIdPostId })
        .skip(skip)
        .limit(limit)
        .exec();
      if (!reactions || reactions.length === 0) {
        throw new NotFoundException('Reactions not found');
      }

      return Promise.all(
        reactions.map((reaction) => this.mapToReactionDto(reaction)),
      );
    } catch (err) {
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

  // Convert a reaction document to a formatted DTO object.
  // Steps:
  // 1. Find the author's profile or company info.
  // 2. Return all reaction details as ReactionDto.
  async mapToReactionDto(reaction: ReactDocument): Promise<ReactionDto> {
    let authorProfile;
    let authorProfilePicture;
    if (reaction.user_type === 'User') {
      authorProfile = await this.profileModel.findById(reaction.user_id).exec();
      if (!authorProfile) {
        throw new NotFoundException('Author profile not found');
      }
      authorProfilePicture = authorProfile.profile_picture;
    } else if (reaction.user_type === 'Company') {
      authorProfile = await this.companyModel.findById(reaction.user_id).exec();
      if (!authorProfile) {
        throw new NotFoundException('Author profile not found');
      }
      authorProfilePicture = authorProfile.logo;
    }
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

  // Save a post for later reference by a specific user.
  // Steps:
  // 1. Validate the post existence.
  // 2. Check if already saved by user.
  // 3. Create a new Save document.
  // 4. Save and return success message.
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

  // Remove a saved post from the user's saved list.
  // Description:
  // 1. Find and delete the saved post document.
  // 2. If not found, throw error.
  // 3. Return success message.

  async unsavePost(
    postId: string,
    userId: string,
  ): Promise<{ message: string }> {
    const savedPost = await this.saveModel
      .findOneAndDelete({
        post_id: postId,
        user_id: userId,
      })
      .exec();
    if (!savedPost) {
      throw new NotFoundException('Saved post not found');
    }

    return { message: 'Post unsaved successfully' };
  }

  // Retrieve all posts saved by a specific user.
  // Steps:
  // 1. Find all saved posts by user.
  // 2. If none found, throw error.
  // 3. Map and return each post using GetPostDto.
  async getSavedPosts(userId: string): Promise<GetPostDto[]> {
    try {
      const savedPosts = await this.saveModel
        .find({ user_id: new Types.ObjectId(userId) })
        .exec();
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
      throw error;
    }
  }

  // Add a comment to a specific post by a user.
  // Description:
  // 1. Validate the post existence.
  // 2. Check if the author is User or Company.
  // 3. Create and save a new comment.
  // 4. Increment the post's comment count.

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
      tags: [],
      react_count: 0,
      replies: [],
    });

    await newComment.save();
    post.comment_count++;
    await post.save();

    return newComment;
  }

  // Retrieve paginated comments for a given post.
  // Description:
  // 1. Paginate and fetch comments for the post.
  // 2. If none found, throw error.
  // 3. Map each comment to GetCommentDto and return.

  async getComments(
    postId: string,
    page: number,
    limit: number,
    userId: string,
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
      comments.map((comment) => this.mapToGetCommentDto(comment, userId)),
    );
  }

  // Convert a comment document to a formatted DTO object.
  // Description:
  // 1. Fetch comment's author details.
  // 2. Find user's reaction to comment if exists.
  // 3. Return all comment details as GetCommentDto.

  async mapToGetCommentDto(
    comment: CommentDocument,
    userId: string,
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
          post_id: comment._id,
          user_id: new Types.ObjectId(userId),
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

    return {
      id: comment._id.toString(),
      postId: comment.post_id.toString(),
      authorId: comment.author_id.toString(),
      authorName: authorName,
      authorPicture: authorProfilePicture,
      authorBio: authorBio,
      authorType: comment.author_type as 'User' | 'Company',
      content: comment.content,
      replies: [],
      reactCount: comment.react_count,
      timestamp: comment.commented_at.toISOString(),
      taggedUsers: [],
      reactType: userReactionType,
    };
  }

  // Helper function to find a post by ID and handle errors.
  // Steps:
  // 1. Find the post by its ID.
  // 2. Throw appropriate error if not found.
  // 3. Return the post document.
  async findPostById(id: string): Promise<PostDocument> {
    try {
      const post = await this.postModel.findById(new Types.ObjectId(id)).exec();
      if (!post) {
        throw new NotFoundException('Post not found with ');
      }
      return post;
    } catch (error) {
      if (error.name === 'BSONError') {
        throw new NotFoundException('Invalid post id format');
      }
      throw new InternalServerErrorException('Failed to find post');
    }
  }

  // Edit a specific comment if the requesting user is the author.
  // Description:
  // 1. Find the comment by ID.
  // 2. Verify that the user is the author.
  // 3. Update the comment and save.

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
    const authorId = comment.author_id.toString();
    if (authorId !== userId) {
      throw new UnauthorizedException(
        'User not authorized to edit this comment',
      );
    }
    Object.assign(comment, editCommentDto);
    return await comment.save();
  }

  // Delete a comment if the requesting user is the author.
  // Steps:
  // 1. Find the comment by ID.
  // 2. Verify user authorization.
  // 3. Delete the comment and related reactions.
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
