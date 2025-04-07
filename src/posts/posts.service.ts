import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
  HttpException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Connection, Model, Types, isValidObjectId } from 'mongoose';
import {
  Post,
  PostDocument,
} from './infrastructure/database/schemas/post.schema';
import { CreatePostDto } from './dto/create-post.dto';
import { GetPostDto } from './dto/get-post.dto';
import {
  Profile,
  ProfileDocument,
} from '../profiles/infrastructure/database/schemas/profile.schema';
import {
  Company,
  CompanyDocument,
} from '../companies/infrastructure/database/schemas/company.schema';
import {
  React,
  ReactDocument,
} from './infrastructure/database/schemas/react.schema';
import { UpdateReactionsDto } from './dto/update-reactions.dto';
import { ReactionDto } from './dto/get-reactions.dto';
import {
  Save,
  SaveDocument,
} from './infrastructure/database/schemas/save.schema';
import { EditPostDto } from './dto/edit-post.dto';
import {
  Comment,
  CommentDocument,
} from './infrastructure/database/schemas/comment.schema';
import { CreateCommentDto } from './dto/create-comment.dto';
import { GetCommentDto } from './dto/get-comment.dto';
import { EditCommentDto } from './dto/edit-comment.dto';
import { mapPostToDto } from './mappers/post.map';
import {
  findPostById,
  getCommentInfo,
  getPostInfo,
  getReactionInfo,
} from './helpers/posts.helpers';
import {
  UserConnection,
  UserConnectionDocument,
} from '../connections/infrastructure/database/schemas/user-connection.schema';
import { ConnectionStatus } from '../connections/enums/connection-status.enum';

@Injectable()
export class PostsService {
  constructor(
    @InjectModel(Post.name) private postModel: Model<PostDocument>,
    @InjectModel(Profile.name) private profileModel: Model<ProfileDocument>,
    @InjectModel(Company.name) private companyModel: Model<CompanyDocument>,
    @InjectModel(React.name) private reactModel: Model<ReactDocument>,
    @InjectModel(Save.name) private saveModel: Model<SaveDocument>,
    @InjectModel(Comment.name) private commentModel: Model<CommentDocument>,
    @InjectModel(UserConnection.name)
    private userConnectionModel: Model<UserConnectionDocument>,
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

      const post = await this.postModel.findById(new Types.ObjectId(id)).exec();
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
    } catch (err) {
      if (err instanceof HttpException) throw err;
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
      let authorCompany;
      const authorProfile = await this.profileModel
        .findById(new Types.ObjectId(author_id))
        .exec();
      if (authorProfile) {
        authorType = 'User';
      } else {
        authorCompany = await this.companyModel
          .findById(new Types.ObjectId(author_id))
          .exec();
        if (authorCompany) {
          authorType = 'Company';
        } else {
          throw new NotFoundException('Author not found');
        }
      }
      let parentPost: PostDocument | null = null;
      if (createPostDto.parentPostId) {
        if (!isValidObjectId(createPostDto.parentPostId)) {
          throw new BadRequestException('Invalid parent post ID format');
        }
        parentPost = await this.postModel
          .findById({ _id: createPostDto.parentPostId })
          .exec();
        if (!parentPost) {
          console.log();
        } else {
          parentPost.share_count++;
          await parentPost.save();
        }
      }

      const createdPost = new this.postModel({
        _id: new Types.ObjectId(),
        text: createPostDto.content,
        media: createPostDto.media,
        tags: createPostDto.taggedUsers,
        visibility: createPostDto.visibility,
        author_id: new Types.ObjectId(author_id),
        author_type: authorType,
        parent_post_id: createPostDto.parentPostId
          ? new Types.ObjectId(createPostDto.parentPostId)
          : null,
        is_silent_repost: createPostDto.isSilentRepost,
      });

      await createdPost.save();
      return getPostInfo(
        createdPost,
        author_id,
        this.postModel,
        this.profileModel,
        this.companyModel,
        this.reactModel,
        this.saveModel,
      );
    } catch (err) {
      if (err instanceof HttpException) throw err;
      // console.log(error);
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
      if (!Types.ObjectId.isValid(userId)) {
        throw new BadRequestException('Invalid user ID format.');
      }

      const objectId = new Types.ObjectId(userId);

      // Step 1: Get connected users (both directions)
      const connected = await this.userConnectionModel
        .find({
          $or: [{ sending_party: objectId }, { receiving_party: objectId }],
          status: ConnectionStatus.Connected,
        })
        .select('sending_party receiving_party')
        .lean();

      const connectedUserIds = connected.map((conn) =>
        conn.sending_party.equals(objectId)
          ? conn.receiving_party
          : conn.sending_party,
      );

      // Step 2: Get following users (you are the sender)
      const following = await this.userConnectionModel
        .find({
          sending_party: objectId,
          status: ConnectionStatus.Following,
        })
        .select('receiving_party')
        .lean();

      const followingUserIds = following.map((conn) => conn.receiving_party);

      // Step 3: Merge all unique author_ids: connections + following + myself
      const allAuthorIds = [
        ...new Set([
          ...connectedUserIds.map((id) => id.toString()),
          ...followingUserIds.map((id) => id.toString()),
          userId,
        ]),
      ].map((id) => new Types.ObjectId(id));

      // Step 4: Fetch posts
      const posts = await this.postModel
        .find({
          $or: [{ visibility: 'Public' }, { author_id: { $in: allAuthorIds } }],
        })
        .sort({ posted_at: -1 })
        .skip(skip)
        .limit(limit)
        .exec();

      if (!posts || posts.length === 0) {
        return [];
      }

      // Step 5: Enrich post data
      return Promise.all(
        posts.map((post) =>
          getPostInfo(
            post,
            userId,
            this.postModel,
            this.profileModel,
            this.companyModel,
            this.reactModel,
            this.saveModel,
          ),
        ),
      );
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Failed to fetch posts.');
    }
  }

  // Retrieve a specific post by its ID.
  // Steps:
  // 1. Find the post by ID.
  // 2. If not found, throw an error.
  // 3. Map the post to GetPostDto and return.
  async getPost(id: string, userId: string): Promise<GetPostDto> {
    try {
      if (!isValidObjectId(id)) {
        throw new BadRequestException('Invalid post ID format');
      }
      const post = await this.postModel.findById(new Types.ObjectId(id)).exec();
      if (!post) {
        throw new NotFoundException('Post not found');
      }
      return getPostInfo(
        post,
        userId,
        this.postModel,
        this.profileModel,
        this.companyModel,
        this.reactModel,
        this.saveModel,
      ); // Use mapToGetPostDto method
    } catch (err) {
      if (err instanceof HttpException) throw err;
    }
    throw new InternalServerErrorException('Failed to fetch post');
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
        return [];
      }

      return Promise.all(
        posts.map((post) =>
          getPostInfo(
            post,
            userId,
            this.postModel,
            this.profileModel,
            this.companyModel,
            this.reactModel,
            this.saveModel,
          ),
        ),
      );
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Failed to fetch user posts');
    }
  }

  // Delete a post and all associated reactions, comments, and saves.
  // Steps:
  // 1. Find the post by ID.
  // 2. Verify that the requesting user is the author.
  // 3. Delete the post, related reactions, comments, and saves.
  async deletePost(postId: string, userId: string): Promise<void> {
    try {
      const post = await this.postModel.findById(postId).exec();
      if (!post) {
        throw new NotFoundException('Post not found');
      }
      if (post.author_id.toString() !== userId) {
        throw new ForbiddenException('User not authorized to delete this post');
      }

      if (post.parent_post_id) {
        const parentPost = await this.postModel
          .findById(post.parent_post_id)
          .exec();
        if (parentPost) {
          parentPost.share_count--;
          await parentPost.save();
        }
      }

      const result = await this.postModel.deleteOne({ _id: postId }).exec();
      if (result.deletedCount === 0) {
        throw new NotFoundException('Post not found');
      }

      await this.reactModel.deleteMany({ post_id: postId }).exec();
      await this.commentModel.deleteMany({ post_id: postId }).exec();
      await this.saveModel.deleteMany({ post_id: postId }).exec();
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException('Failed to delete post');
    }
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
    try {
      if (!Types.ObjectId.isValid(userId)) {
        throw new BadRequestException('Invalid user ID format');
      }
      if (!Types.ObjectId.isValid(postId)) {
        throw new BadRequestException('Invalid post ID format');
      }

      const objectIdUserId = new Types.ObjectId(userId);
      const objectIdPostId = new Types.ObjectId(postId);

      const reactions = updateReactionsDto.reactions;
      const reactionTypes = Object.entries(reactions).filter(
        ([, value]) => value === true,
      );

      if (reactionTypes.length > 1) {
        throw new BadRequestException('Only one reaction is allowed');
      }

      let post: PostDocument | null = null;
      let comment: CommentDocument | null = null;

      if (updateReactionsDto.postType === 'Post') {
        post = await this.postModel.findById(objectIdPostId).exec();
        if (!post) {
          throw new NotFoundException(`Post with id ${postId} not found`);
        }
      } else {
        comment = await this.commentModel.findById(objectIdPostId).exec();
        if (!comment) {
          throw new NotFoundException(`Comment with id ${postId} not found`);
        }
      }

      const reactorProfile = await this.profileModel
        .findById(objectIdUserId)
        .exec();
      const reactorType = reactorProfile ? 'User' : 'Company';

      for (const [reactionType, value] of Object.entries(reactions)) {
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
              comment.react_count[reactionType] =
                (comment.react_count[reactionType] || 0) + 1;
              await comment.save();
            }

            await newReaction.save();
          } else if (existingReaction.react_type !== reactionType) {
            if (post) {
              post.react_count[existingReaction.react_type] =
                (post.react_count[existingReaction.react_type] || 1) - 1;
              post.react_count[reactionType] =
                (post.react_count[reactionType] || 0) + 1;
              await post.save();
            }

            if (comment) {
              comment.react_count[existingReaction.react_type] =
                (comment.react_count[existingReaction.react_type] || 1) - 1;
              comment.react_count[reactionType] =
                (comment.react_count[reactionType] || 0) + 1;
              await comment.save();
            }

            existingReaction.react_type = reactionType;
            await existingReaction.save();
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
            await this.reactModel
              .deleteOne({ _id: existingReaction._id })
              .exec();

            if (post) {
              post.react_count[reactionType] =
                (post.react_count[reactionType] || 1) - 1;
              await post.save();
            }

            if (comment) {
              comment.react_count[reactionType] =
                (comment.react_count[reactionType] || 1) - 1;
              await comment.save();
            }
          }
        }
      }

      if (post) return post;
      if (comment) return comment;

      throw new InternalServerErrorException('Failed to update reaction');
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Failed to update reaction');
    }
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
    reactionType: string,
    userId: string, // For user-specific reactions later.
  ): Promise<ReactionDto[]> {
    try {
      const skip = (page - 1) * limit;
      console.log(isValidObjectId(postId));
      if (!isValidObjectId(postId)) {
        throw new BadRequestException('Invalid post ID format');
      }
      const objectIdPostId = new Types.ObjectId(postId);
      const reactions = await this.reactModel
        .find({
          post_id: objectIdPostId,
          ...(reactionType !== 'all' && { react_type: reactionType }),
        })
        .skip(skip)
        .limit(limit)
        .exec();
      if (!reactions || reactions.length === 0) {
        return [];
      }

      return Promise.all(
        reactions.map((reaction) =>
          getReactionInfo(reaction, this.profileModel, this.companyModel),
        ),
      );
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException('Failed to fetch reactions');
    }
  }

  // Save a post for later reference by a specific user.
  // Steps:
  // 1. Validate the post existence.
  // 2. Check if already saved by user.
  // 3. Create a new Save document.
  // 4. Save and return success message.
  async savePost(postId: string, userId: string): Promise<{ message: string }> {
    try {
      const post = await this.postModel
        .findById(new Types.ObjectId(postId))
        .exec();
      if (!post) {
        throw new NotFoundException('Post not found');
      }

      const existing = await this.saveModel.exists({
        post_id: new Types.ObjectId(post._id),
        user_id: new Types.ObjectId(userId),
      });

      if (existing) {
        throw new BadRequestException('Post already saved');
      }

      const save = new this.saveModel({
        _id: new Types.ObjectId(),
        user_id: new Types.ObjectId(userId),
        post_id: new Types.ObjectId(postId),
      });

      await save.save();
      return { message: 'Post saved successfully' };
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException('Failed to save post');
    }
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
    try {
      console.log('Unsave post:', postId, userId);
      const savedPost = await this.saveModel
        .findOneAndDelete({
          post_id: new Types.ObjectId(postId),
          user_id: new Types.ObjectId(userId),
        })
        .exec();

      console.log('savedPost:', savedPost);

      if (!savedPost) {
        throw new NotFoundException('Saved post not found');
      }

      return { message: 'Post unsaved successfully' };
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException('Failed to unsave post');
    }
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
        return [];
      }

      return Promise.all(
        savedPosts.map(async (save) => {
          const post = await this.postModel
            .findById(new Types.ObjectId(save.post_id))
            .exec();
          if (!post) {
            throw new NotFoundException('Post not found');
          }
          return getPostInfo(
            post,
            userId,
            this.postModel,
            this.profileModel,
            this.companyModel,
            this.reactModel,
            this.saveModel,
          );
        }),
      );
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Failed to fetch saved posts');
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
  ): Promise<GetCommentDto> {
    try {
      let post: PostDocument | null = null;
      let comment: CommentDocument | null = null;
      console.log(createCommentDto);
      if (createCommentDto.isReply === false) {
        post = await this.postModel.findById(new Types.ObjectId(postId)).exec();
        if (!post) {
          throw new NotFoundException('Post not found');
        }
      } else {
        comment = await this.commentModel
          .findById(new Types.ObjectId(postId))
          .exec();
        if (!comment) {
          throw new NotFoundException('Comment not found');
        }
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
        tags: createCommentDto.tagged,
        react_count: {
          Like: 0,
          Love: 0,
          Funny: 0,
          Celebrate: 0,
          Insightful: 0,
          Support: 0,
        },
        replies: [],
      });

      await newComment.save();
      if (post) {
        post.comment_count++;
        await post.save();
      } else {
        comment?.replies.push(newComment._id);
        await comment?.save();
      }

      return getCommentInfo(
        newComment,
        userId,
        this.profileModel,
        this.companyModel,
        this.reactModel,
      );
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException('Failed to add comment');
    }
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
    try {
      const skip = (page - 1) * limit;
      const comments = await this.commentModel
        .find({ post_id: new Types.ObjectId(postId) })
        .skip(skip)
        .limit(limit)
        .exec();

      if (!comments || comments.length === 0) {
        return [];
      }

      return Promise.all(
        comments.map((comment) =>
          getCommentInfo(
            comment,
            userId,
            this.profileModel,
            this.companyModel,
            this.reactModel,
          ),
        ),
      );
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Failed to fetch comments');
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
    try {
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
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException('Failed to edit comment');
    }
  }

  // Delete a comment if the requesting user is the author.
  // Steps:
  // 1. Find the comment by ID.
  // 2. Verify user authorization.
  // 3. Delete the comment and related reactions.
  async deleteComment(commentId: string, userId: string): Promise<void> {
    try {
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
      await this.commentModel.deleteOne({ _id: commentId }).exec();
      await this.commentModel.deleteMany({ post_id: commentId }).exec();
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException('Failed to delete comment');
    }
  }
  async searchPosts(
    userId: string,
    query: string,
    networkOnly: boolean,
    timeframe: '24h' | 'week' | 'all',
    page = 1,
    limit = 10,
  ): Promise<GetPostDto[]> {
    const skip = (page - 1) * limit;

    console.log(
      'searchPosts',
      userId,
      query,
      networkOnly,
      timeframe,
      page,
      limit,
    );

    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID format');
    }

    const objectId = new Types.ObjectId(userId);

    const searchWords = query.trim().split(/\s+/);

    const postQuery: any = {
      $or: searchWords.map((word) => ({
        text: { $regex: new RegExp(word, 'i') }, // ✅ CORRECT regex usage
      })),
    };

    // ⏰ Time filter
    if (timeframe === '24h') {
      postQuery.posted_at = {
        $gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
      };
    } else if (timeframe === 'week') {
      postQuery.posted_at = {
        $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      };
    }

    // 👥 Network filter
    if (networkOnly) {
      const [connections, following] = await Promise.all([
        this.userConnectionModel
          .find({
            $or: [{ sending_party: objectId }, { receiving_party: objectId }],
            status: ConnectionStatus.Connected,
          })
          .lean(),

        this.userConnectionModel
          .find({
            sending_party: objectId,
            status: ConnectionStatus.Following,
          })
          .lean(),
      ]);

      const networkIds = new Set<string>([
        ...connections.map((conn) =>
          conn.sending_party.equals(objectId)
            ? conn.receiving_party.toString()
            : conn.sending_party.toString(),
        ),
        ...following.map((conn) => conn.receiving_party.toString()),
        userId, // include self
      ]);

      // 🔁 Convert all IDs to ObjectId before querying
      postQuery.author_id = {
        $in: Array.from(networkIds).map((id) => new Types.ObjectId(id)),
      };
    }

    // 🔎 Search and enrich results
    const posts = await this.postModel
      .find(postQuery)
      .sort({ posted_at: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    console.log(posts);

    return Promise.all(
      posts.map((post) =>
        getPostInfo(
          post,
          userId,
          this.postModel,
          this.profileModel,
          this.companyModel,
          this.reactModel,
          this.saveModel,
        ),
      ),
    );
  }

  // Retrieve all reposts of a given post (with visibility filtering).
  // Description:
  // 1. Validate the post ID and user ID formats.
  // 2. Get list of user’s connections and following.
  // 3. Include reposts that are:
  //    - Public
  //    - From connections/followed
  //    - Authored by the user themselves
  // 4. Return enriched repost DTOs.
  async getRepostsOfPost(
    postId: string,
    userId: string,
  ): Promise<GetPostDto[]> {
    try {
      if (!Types.ObjectId.isValid(postId)) {
        throw new BadRequestException('Invalid post ID format');
      }
      if (!Types.ObjectId.isValid(userId)) {
        throw new BadRequestException('Invalid user ID format');
      }

      const objectId = new Types.ObjectId(userId);

      // Step 1: Get connected users
      const connected = await this.userConnectionModel
        .find({
          $or: [{ sending_party: objectId }, { receiving_party: objectId }],
          status: ConnectionStatus.Connected,
        })
        .select('sending_party receiving_party')
        .lean();

      const connectedUserIds = connected.map((conn) =>
        conn.sending_party.equals(objectId)
          ? conn.receiving_party
          : conn.sending_party,
      );

      // Step 2: Get following users
      const following = await this.userConnectionModel
        .find({
          sending_party: objectId,
          status: ConnectionStatus.Following,
        })
        .select('receiving_party')
        .lean();

      const followingUserIds = following.map((conn) => conn.receiving_party);

      // Step 3: Merge author IDs (connected + following + self)
      const visibleAuthorIds = [
        ...new Set([
          ...connectedUserIds.map((id) => id.toString()),
          ...followingUserIds.map((id) => id.toString()),
          userId,
        ]),
      ].map((id) => new Types.ObjectId(id));

      // Step 4: Fetch visible reposts of this post
      const reposts = await this.postModel
        .find({
          parent_post_id: new Types.ObjectId(postId),
          $or: [
            { visibility: 'Public' },
            { author_id: { $in: visibleAuthorIds } },
          ],
        })
        .sort({ posted_at: -1 })
        .exec();

      if (!reposts || reposts.length === 0) {
        return [];
      }

      return Promise.all(
        reposts.map((post) =>
          getPostInfo(
            post,
            userId,
            this.postModel,
            this.profileModel,
            this.companyModel,
            this.reactModel,
            this.saveModel,
          ),
        ),
      );
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException('Failed to fetch reposts');
    }
  }
  // Retrieve all reposts created by a specific user (paginated).
  // Description:
  // 1. Validate the user ID format.
  // 2. Query the database for posts where the user is the author AND has a parent_post_id (indicating it's a repost).
  // 3. Apply pagination (skip + limit).
  // 4. If no reposts found, return an empty array.
  // 5. Enrich each repost with full post info (author, reactions, saves, parent post, etc.)
  // 6. Return the array of enriched GetPostDto objects.
  async getRepostsByUser(
    userId: string,
    page: number,
    limit: number,
    viewerId: string,
  ): Promise<GetPostDto[]> {
    const skip = (page - 1) * limit;

    try {
      if (!Types.ObjectId.isValid(userId)) {
        throw new BadRequestException('Invalid user ID format');
      }

      const reposts = await this.postModel
        .find({
          author_id: new Types.ObjectId(userId),
          parent_post_id: { $ne: null },
        })
        .sort({ posted_at: -1 })
        .skip(skip)
        .limit(limit)
        .exec();

      if (!reposts || reposts.length === 0) {
        return [];
      }

      return await Promise.all(
        reposts.map((post) =>
          getPostInfo(
            post,
            viewerId,
            this.postModel,
            this.profileModel,
            this.companyModel,
            this.reactModel,
            this.saveModel,
          ),
        ),
      );
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException('Failed to fetch user reposts');
    }
  }
}
