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
  getUserAccessed,
} from './helpers/posts.helpers';
import {
  UserConnection,
  UserConnectionDocument,
} from '../connections/infrastructure/database/schemas/user-connection.schema';
import { ConnectionStatus } from '../connections/enums/connection-status.enum';
import { P } from '@faker-js/faker/dist/airline-CBNP41sR';
import {
  addNotification,
  deleteNotification,
} from '../notifications/helpers/notification.helper';
import {
  Notification,
  NotificationDocument,
} from '../notifications/infrastructure/database/schemas/notification.schema';
import { NotificationGateway } from '../gateway/notification.gateway';
import { CompanyManager } from '../companies/infrastructure/database/schemas/company-manager.schema';
import {
  UserDocument,
  User,
} from '../users/infrastructure/database/schemas/user.schema';
import { timeStamp } from 'console';

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
    @InjectModel(Notification.name)
    private notificationModel: Model<NotificationDocument>,
    private readonly notificationGateway: NotificationGateway, // Inject NotificationGateway
    @InjectModel(CompanyManager.name)
    private companyManagerModel: Model<CompanyManager>,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>, // Inject User model
  ) {}

  /**
   * Edit an existing post by validating permissions and updating content
   *
   * Process:
   * 1. Validate both post and user ID formats using MongoDB ObjectId
   * 2. Retrieve the post by ID and verify it exists
   * 3. Ensure the requesting user is the original author of the post
   * 4. Determine if the author is a User or Company profile
   * 5. Update post fields with the provided data
   * 6. Mark the post as edited and save changes
   * 7. Return the updated post or handle any errors
   */
  async editPost(
    id: string,
    editPostDto: EditPostDto,
    userId: string,
    companyId: string,
  ): Promise<GetPostDto> {
    try {
      if (!isValidObjectId(id)) {
        throw new BadRequestException('Invalid post ID format');
      }
      if (!isValidObjectId(userId)) {
        throw new BadRequestException('Invalid user ID format');
      }

      if (!isValidObjectId(companyId)) {
        throw new BadRequestException('Invalid company ID format');
      }
      const authorId = await getUserAccessed(
        userId,
        companyId,
        this.companyManagerModel,
      );

      console.log('authorId:', authorId);

      const post = await this.postModel.findById(new Types.ObjectId(id)).exec();
      if (!post) {
        throw new NotFoundException('Post not found');
      }

      if (post.author_id.toString() !== authorId) {
        throw new UnauthorizedException(
          'User not authorized to edit this post',
        );
      }

      let authorType: 'User' | 'Company';
      const authorProfile = await this.profileModel
        .findById(new Types.ObjectId(authorId))
        .exec();
      if (authorProfile) {
        authorType = 'User';
      } else {
        const authorCompany = await this.companyModel
          .findById(new Types.ObjectId(authorId))
          .exec();
        console.log(authorCompany);
        if (authorCompany) {
          authorType = 'Company';
        } else {
          throw new NotFoundException('Author not found');
        }
      }
      post.author_id = new Types.ObjectId(authorId);
      post.author_type = authorType;

      Object.assign(post, editPostDto);
      post.is_edited = true; // Mark as edited
      await post.save();
      return getPostInfo(
        post,
        authorId,
        this.postModel,
        this.profileModel,
        this.companyModel,
        this.reactModel,
        this.saveModel,
        this.userConnectionModel,
      );
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException('Failed to edit post');
    }
  }

  /**
   * Create and save a new post with content, media, and visibility settings
   *
   * Process:
   * 1. Validate the author ID format using MongoDB ObjectId
   * 2. Determine if the author is a User or Company by checking profile databases
   * 3. If this is a repost, validate and update the parent post's share count
   * 4. Create a new post document with author info, content, and metadata
   * 5. Save the post to the database
   * 6. Return the fully formatted post DTO with enriched information
   */
  async addPost(
    createPostDto: CreatePostDto,
    userId: string,
    companyId: string,
  ): Promise<GetPostDto> {
    try {
      if (!Types.ObjectId.isValid(userId)) {
        throw new BadRequestException('Invalid author ID format');
      }
      if (!Types.ObjectId.isValid(companyId)) {
        throw new BadRequestException('Invalid company ID format');
      }

      const authorId = await getUserAccessed(
        userId,
        companyId,
        this.companyManagerModel,
      );

      let authorType: 'User' | 'Company';
      let authorCompany;

      console.log('authorId:', authorId);
      const authorProfile = await this.profileModel
        .findById(new Types.ObjectId(authorId))
        .exec();
      console.log(authorProfile);
      if (authorProfile) {
        authorType = 'User';
      } else {
        authorCompany = await this.companyModel
          .findById(new Types.ObjectId(authorId))
          .exec();
        console.log(authorCompany);
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
          // console.log();
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
        author_id: new Types.ObjectId(authorId),
        author_type: authorType,
        parent_post_id: createPostDto.parentPostId
          ? new Types.ObjectId(createPostDto.parentPostId)
          : null,
        is_silent_repost: createPostDto.isSilentRepost,
      });

      console.log('createdPost:', createdPost);

      await createdPost.save();
      return getPostInfo(
        createdPost,
        authorId,
        this.postModel,
        this.profileModel,
        this.companyModel,
        this.reactModel,
        this.saveModel,
        this.userConnectionModel,
      );
    } catch (err) {
      if (err instanceof HttpException) throw err;
      // console.log(error);
      throw new InternalServerErrorException('Failed to add post');
    }
  }

  /**
   * Retrieve a personalized, paginated feed of posts for the user
   *
   * Process:
   * 1. Calculate pagination parameters for efficient data retrieval
   * 2. Identify the user's connections network (connected and following users)
   * 3. Fetch candidate posts, filtering by visibility
   * 4. Apply smart filtering rules:
   *    - Always show user's own posts
   *    - Show all posts from connected users
   *    - Show public posts from followed users
   *    - Show a random selection of public posts from the wider network
   * 5. Apply pagination to the filtered results
   * 6. Enrich posts with author, reaction, and connection data
   * 7. Return the personalized feed as DTO objects
   */
  async getAllPosts(
    page: number,
    limit: number,
    userId: string,
    companyId: string,
  ): Promise<GetPostDto[]> {
    const skip = (page - 1) * limit;

    try {
      if (!Types.ObjectId.isValid(userId)) {
        throw new BadRequestException('Invalid user ID format.');
      }
      if (!Types.ObjectId.isValid(companyId)) {
        throw new BadRequestException('Invalid company ID format.');
      }
      const authorId = await getUserAccessed(
        userId,
        companyId,
        this.companyManagerModel,
      );

      const objectId = new Types.ObjectId(authorId);

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

      // Step 2: Get followed users (you are the sender)
      const following = await this.userConnectionModel
        .find({
          sending_party: objectId,
          status: ConnectionStatus.Following,
        })
        .select('receiving_party')
        .lean();

      const followingUserIds = following.map((conn) => conn.receiving_party);

      // Step 3: Fetch all candidate posts
      const candidatePosts = await this.postModel
        .find({
          visibility: { $ne: 'Private' },
        })
        .sort({ posted_at: -1 })
        .exec();

      // Step 4: Filter posts based on the new logic
      const filteredPosts = candidatePosts.filter((post) => {
        const authorIdStr = post.author_id.toString();

        if (authorIdStr === authorId) return true; // Always include own posts

        if (connectedUserIds.some((id) => id.toString() === authorIdStr)) {
          return true; // All posts of connected users
        }

        if (
          post.visibility === 'Public' &&
          followingUserIds.some((id) => id.toString() === authorIdStr)
        ) {
          return true; // Public posts of followed users
        }

        if (
          post.visibility === 'Public' &&
          !isIdInArray(followingUserIds, authorIdStr) &&
          !isIdInArray(connectedUserIds, authorIdStr)
        ) {
          // 50% chance to show public post of unrelated user
          return Math.random() < 0.5;
        }

        function isIdInArray(array: Types.ObjectId[], id: string): boolean {
          for (const item of array) {
            if (item.toString() === id) {
              return true;
            }
          }
          return false;
        }

        return false;
      });

      // Step 5: Paginate after filtering
      const paginatedPosts = filteredPosts.slice(skip, skip + limit);

      // Step 6: Enrich post data
      return Promise.all(
        paginatedPosts.map((post) =>
          getPostInfo(
            post,
            authorId,
            this.postModel,
            this.profileModel,
            this.companyModel,
            this.reactModel,
            this.saveModel,
            this.userConnectionModel,
          ),
        ),
      );
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Failed to fetch posts.');
    }
  }

  /**
   * Retrieve details for a specific post by its identifier
   *
   * Process:
   * 1. Validate the post ID format
   * 2. Find the post in the database by its MongoDB ObjectId
   * 3. If post doesn't exist, throw a NotFoundException
   * 4. Enrich the post with author info, reaction data, and connection status
   * 5. Return the fully formatted post DTO with all metadata
   */
  async getPost(
    id: string,
    userId: string,
    companyId: string,
  ): Promise<GetPostDto> {
    try {
      if (!isValidObjectId(id)) {
        throw new BadRequestException('Invalid post ID format');
      }
      if (!isValidObjectId(userId)) {
        throw new BadRequestException('Invalid user ID format');
      }
      if (!isValidObjectId(companyId)) {
        throw new BadRequestException('Invalid company ID format');
      }
      const authorId = await getUserAccessed(
        userId,
        companyId,
        this.companyManagerModel,
      );
      const post = await this.postModel.findById(new Types.ObjectId(id)).exec();
      if (!post) {
        throw new NotFoundException('Post not found');
      }
      return getPostInfo(
        post,
        authorId,
        this.postModel,
        this.profileModel,
        this.companyModel,
        this.reactModel,
        this.saveModel,
        this.userConnectionModel,
      ); // Use mapToGetPostDto method
    } catch (err) {
      if (err instanceof HttpException) throw err;
    }
    throw new InternalServerErrorException('Failed to fetch post');
  }

  /**
   * Retrieve all posts created by a specific user profile
   *
   * Process:
   * 1. Query posts with matching author_id
   * 2. If no posts found, return an empty array
   * 3. For each post, enrich with complete information including:
   *    - Author profile details
   *    - Reaction counts and user's reactions
   *    - Save status
   *    - Parent post info for reposts
   * 4. Return array of fully formatted post DTOs
   */
  async getUserPosts(
    searchedUserId: string,
    userId: string,
    page: number,
    limit: number,
    companyId: string,
  ): Promise<GetPostDto[]> {
    try {
      const skip = (page - 1) * limit;
      const posts = await this.postModel
        .find({ author_id: new Types.ObjectId(searchedUserId) })
        .sort({ timeStamp: -1 })
        .skip(skip)
        .limit(limit)
        .exec();

      const authorId = await getUserAccessed(
        userId,
        companyId,
        this.companyManagerModel,
      );

      if (!posts || posts.length === 0) {
        return [];
      }

      return Promise.all(
        posts.map((post) =>
          getPostInfo(
            post,
            authorId,
            this.postModel,
            this.profileModel,
            this.companyModel,
            this.reactModel,
            this.saveModel,
            this.userConnectionModel,
          ),
        ),
      );
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch user posts');
    }
  }

  /**
   * Delete a post and all associated data (reactions, comments, saves)
   *
   * Process:
   * 1. Find the post by its ID
   * 2. Verify the requesting user is the original author
   * 3. If this is a repost, update the parent post's share count
   * 4. Delete the post document from the database
   * 5. Perform cascade deletion of all associated data:
   *    - Reactions on the post
   *    - Comments on the post
   *    - Saved references to the post
   * 6. Handle potential errors during deletion process
   */
  async deletePost(
    postId: string,
    userId: string,
    companyId: string,
  ): Promise<void> {
    try {
      const post = await this.postModel.findById(postId).exec();
      if (!post) {
        throw new NotFoundException('Post not found');
      }
      const authorId = await getUserAccessed(
        userId,
        companyId,
        this.companyManagerModel,
      );
      console.log('authorId:', authorId);
      console.log('post.author_id:', post.author_id.toString());
      if (post.author_id.toString() !== authorId) {
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

      // Get IDs of reactions, comments, and saves
      const reactions = await this.reactModel
        .find({ post_id: new Types.ObjectId(postId) })
        .select('_id')
        .exec();
      const comments = await this.commentModel
        .find({ post_id: new Types.ObjectId(postId) })
        .select('_id')
        .exec();
      const saves = await this.saveModel
        .find({ post_id: new Types.ObjectId(postId) })
        .select('_id')
        .exec();

      // Delete notifications for reactions, comments, saves, and the post itself
      for (const reaction of reactions) {
        await deleteNotification(this.notificationModel, reaction._id);
      }
      for (const comment of comments) {
        await deleteNotification(this.notificationModel, comment._id);
        await this.commentModel
          .deleteMany({ post_id: new Types.ObjectId(comment._id) })
          .exec();
      }

      // Perform cascade deletion
      await this.reactModel
        .deleteMany({ post_id: new Types.ObjectId(postId) })
        .exec();
      await this.commentModel
        .deleteMany({ post_id: new Types.ObjectId(postId) })
        .exec();
      await this.saveModel
        .deleteMany({ post_id: new Types.ObjectId(postId) })
        .exec();

      const result = await this.postModel
        .deleteOne({ _id: new Types.ObjectId(postId) })
        .exec();
      if (result.deletedCount === 0) {
        throw new NotFoundException('Post not found');
      }
    } catch (err) {
      console.log(err);
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException('Failed to delete post');
    }
  }

  /**
   * Add, update, or remove a user's reaction to a post or comment
   *
   * Process:
   * 1. Validate user and post/comment ID formats
   * 2. Ensure only one reaction type is set to true (like, love, etc.)
   * 3. Determine if the target is a post or comment
   * 4. Check if the user already has a reaction, then:
   *    - If no reaction exists and adding new one: Create new reaction
   *    - If changing reaction type: Update existing reaction type
   *    - If removing reaction: Delete the reaction document
   * 5. Update reaction counts on the target post or comment
   * 6. Return the updated post or comment with new reaction counts
   */

  //TODO : Make the existingReaction call only once.
  async updateReactions(
    postId: string,
    userId: string,
    updateReactionsDto: UpdateReactionsDto,
    companyId: string,
  ): Promise<Post | Comment> {
    try {
      //console.log('updateReactionsDto:', updateReactionsDto);
      if (!Types.ObjectId.isValid(userId)) {
        throw new BadRequestException('Invalid user ID format');
      }
      if (!Types.ObjectId.isValid(postId)) {
        throw new BadRequestException('Invalid post ID format');
      }
      const authorId = await getUserAccessed(
        userId,
        companyId,
        this.companyManagerModel,
      );

      console.log('authorId:', authorId);

      const objectIdUserId = new Types.ObjectId(authorId);
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

      //console.log(updateReactionsDto);
      for (const [reactionType, value] of Object.entries(reactions)) {
        //console.log("'reactionType':", reactionType);
        //console.log("'value':", value);
        if (value) {
          const existingReaction = await this.reactModel
            .findOne({
              post_id: objectIdPostId,
              user_id: objectIdUserId,
              user_type: reactorType,
            })
            .exec();

          // console.log('existingReaction:', existingReaction);
          // console.log('existing reaction type:', existingReaction?.react_type);
          // console.log('reactionType:', reactionType);
          // console.log('post:', post);
          // console.log('comment:', comment);

          if (!existingReaction) {
            // console.log('Creating new reaction');
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
              post.markModified('react_count');
              addNotification(
                this.notificationModel, // Pass the notification model
                new Types.ObjectId(authorId),
                new Types.ObjectId(post.author_id),
                new Types.ObjectId(newReaction._id),
                new Types.ObjectId(post._id),
                'React',
                `reacted to your post`,
                new Date(),
                this.notificationGateway, // Pass NotificationGateway
                this.profileModel, // Pass Profile model
                this.companyModel, // Pass Company model
                this.userModel, // Pass User model
                this.companyManagerModel, // Pass CompanyManager model
              );
              await post.save();
            }

            if (comment) {
              //console.log('Comment react count:', comment.react_count);
              comment.react_count[reactionType] =
                (comment.react_count[reactionType] || 0) + 1;
              comment.markModified('react_count');
              addNotification(
                this.notificationModel, // Pass the notification model
                new Types.ObjectId(authorId),
                new Types.ObjectId(comment.author_id),
                new Types.ObjectId(newReaction._id),
                new Types.ObjectId(comment.post_id),
                'React',
                `reacted to your comment`,
                new Date(),
                this.notificationGateway, // Pass NotificationGateway
                this.profileModel, // Pass Profile model
                this.companyModel, // Pass Company model
                this.userModel, // Pass User model
                this.companyManagerModel, // Pass CompanyManager model
              );
              await comment.save();
            }

            await newReaction.save();
          } else if (existingReaction.react_type !== reactionType) {
            //console.log('got here');
            if (post) {
              post.react_count[existingReaction.react_type] =
                (post.react_count[existingReaction.react_type] || 1) - 1;
              post.react_count[reactionType] =
                (post.react_count[reactionType] || 0) + 1;
              post.markModified('react_count');
              await post.save();
              existingReaction.react_type = reactionType;
              deleteNotification(
                this.notificationModel,
                new Types.ObjectId(existingReaction._id), // Pass the item
              );

              addNotification(
                this.notificationModel, // Pass the notification model
                new Types.ObjectId(authorId), // Pass the sender
                new Types.ObjectId(post.author_id), // Pass the receiver
                new Types.ObjectId(existingReaction._id), // Pass the item
                new Types.ObjectId(post._id),
                'React',
                `reacted to your post`,
                new Date(),
                this.notificationGateway, // Pass NotificationGateway
                this.profileModel, // Pass Profile model
                this.companyModel, // Pass Company model
                this.userModel, // Pass User model
                this.companyManagerModel, // Pass CompanyManager model
              );
            }

            if (comment) {
              //console.log('Comment react count:', comment.react_count);
              comment.react_count[existingReaction.react_type] =
                (comment.react_count[existingReaction.react_type] || 1) - 1;
              comment.react_count[reactionType] =
                (comment.react_count[reactionType] || 0) + 1;
              comment.markModified('react_count');
              //console.log('Comment react count after :', comment.react_count);
              await comment.save();
              existingReaction.react_type = reactionType;
              deleteNotification(
                this.notificationModel,
                new Types.ObjectId(existingReaction._id),
              );

              addNotification(
                this.notificationModel, // Pass the notification model
                new Types.ObjectId(authorId),
                new Types.ObjectId(comment.author_id),
                new Types.ObjectId(existingReaction._id),
                new Types.ObjectId(comment.post_id),
                'React',
                `reacted to your comment`,
                new Date(),
                this.notificationGateway, // Pass NotificationGateway
                this.profileModel, // Pass Profile model
                this.companyModel, // Pass Company model
                this.userModel, // Pass User model
                this.companyManagerModel, // Pass CompanyManager model
              );
            }

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
              post.markModified('react_count');
              await post.save();
              deleteNotification(
                this.notificationModel,
                new Types.ObjectId(existingReaction._id),
              );
            }

            if (comment) {
              comment.react_count[reactionType] =
                (comment.react_count[reactionType] || 1) - 1;
              comment.markModified('react_count');
              await comment.save();
              deleteNotification(
                this.notificationModel,
                new Types.ObjectId(existingReaction._id),
              );
            }
          }
        }
      }

      if (post) {
        return post;
      }
      if (comment) {
        return comment;
      }

      throw new InternalServerErrorException('Failed to update reaction');
    } catch (error) {
      console.log(error);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Failed to update reaction');
    }
  }

  /**
   * Retrieve a paginated list of reactions for a specific post
   *
   * Process:
   * 1. Calculate pagination parameters (skip, limit)
   * 2. Validate the post ID format
   * 3. Build a query to filter reactions by post and optionally by reaction type
   * 4. Execute the query with pagination applied
   * 5. For each reaction, enrich with reactor information (profile/company details)
   * 6. Return the array of reaction DTOs with complete user information
   */
  async getReactions(
    postId: string,
    page: number,
    limit: number,
    reactionType: string,
    userId: string,
    companyId: string,
  ): Promise<ReactionDto[]> {
    try {
      const skip = (page - 1) * limit;

      if (!isValidObjectId(postId)) {
        throw new BadRequestException('Invalid post ID format');
      }

      const objectIdPostId = new Types.ObjectId(postId);

      // Build the query object
      const query: any = { post_id: objectIdPostId };
      if (reactionType !== 'All') {
        query.react_type = reactionType;
      }

      // Fetch reactions with pagination
      const reactions = await this.reactModel
        .find(query)
        .skip(skip)
        .limit(limit)
        .exec();

      if (!reactions || reactions.length === 0) {
        return [];
      }

      // Map reactions to ReactionDto
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

  /**
   * Save a post to the user's personal collection for later reference
   *
   * Process:
   * 1. Verify the post exists in the database
   * 2. Check if the user has already saved this post
   * 3. Create a new Save document linking the user to the post
   * 4. Return a success message upon completion
   */
  async savePost(
    postId: string,
    userId: string,
    companyId: string,
  ): Promise<{ message: string }> {
    try {
      const post = await this.postModel
        .findById(new Types.ObjectId(postId))
        .exec();
      if (!post) {
        throw new NotFoundException('Post not found');
      }

      const authorId = await getUserAccessed(
        userId,
        companyId,
        this.companyManagerModel,
      );
      const existing = await this.saveModel.exists({
        post_id: new Types.ObjectId(post._id),
        user_id: new Types.ObjectId(authorId),
      });

      if (existing) {
        throw new BadRequestException('Post already saved');
      }

      const save = new this.saveModel({
        _id: new Types.ObjectId(),
        user_id: new Types.ObjectId(authorId),
        post_id: new Types.ObjectId(postId),
      });

      await save.save();
      return { message: 'Post saved successfully' };
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException('Failed to save post');
    }
  }

  /**
   * Remove a previously saved post from the user's collection
   *
   * Process:
   * 1. Find and delete the saved post record matching both post and user IDs
   * 2. Verify the save record existed before attempting deletion
   * 3. Return a success message upon completion
   */
  async unsavePost(
    postId: string,
    userId: string,
    companyId: string,
  ): Promise<{ message: string }> {
    try {
      // console.log('Unsave post:', postId, userId);
      const authorId = await getUserAccessed(
        userId,
        companyId,
        this.companyManagerModel,
      );
      const savedPost = await this.saveModel
        .findOneAndDelete({
          post_id: new Types.ObjectId(postId),
          user_id: new Types.ObjectId(authorId),
        })
        .exec();

      // console.log('savedPost:', savedPost);

      if (!savedPost) {
        throw new NotFoundException('Saved post not found');
      }

      return { message: 'Post unsaved successfully' };
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException('Failed to unsave post');
    }
  }

  /**
   * Retrieve all posts saved by a specific user with pagination
   *
   * Process:
   * 1. Calculate the offset based on page number and limit
   * 2. Find all save records for the specified user ID
   * 3. Apply pagination and sort by most recently saved
   * 4. For each saved post reference, retrieve the full post data
   * 5. Enrich each post with author, reaction, and metadata information
   * 6. Return array of fully formatted post DTOs
   */
  async getSavedPosts(
    userId: string,
    page: number,
    limit: number,
    companyId: string,
  ): Promise<GetPostDto[]> {
    const offset = (page - 1) * limit;
    try {
      const authorId = await getUserAccessed(
        userId,
        companyId,
        this.companyManagerModel,
      );
      const savedPosts = await this.saveModel
        .find({ user_id: new Types.ObjectId(authorId) })
        .skip(offset)
        .sort({ saved_at: -1 })
        .limit(limit)
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
            authorId,
            this.postModel,
            this.profileModel,
            this.companyModel,
            this.reactModel,
            this.saveModel,
            this.userConnectionModel,
          );
        }),
      );
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Failed to fetch saved posts');
    }
  }

  /**
   * Add a comment to a post or reply to another comment
   *
   * Process:
   * 1. Determine if this is a post comment or a reply to another comment
   * 2. Verify the parent post/comment exists
   * 3. Determine if the author is a User or Company profile
   * 4. Create a new comment document with author info and content
   * 5. Update reference counts:
   *    - Increment comment count if commenting on a post
   *    - Add to replies array if replying to another comment
   * 6. Return the newly created comment with author information
   */
  async addComment(
    postId: string,
    createCommentDto: CreateCommentDto,
    userId: string,
    companyId: string,
  ): Promise<GetCommentDto> {
    try {
      const authorId = await getUserAccessed(
        userId,
        companyId,
        this.companyManagerModel,
      );
      let post: PostDocument | null = null;
      let comment: CommentDocument | null = null;
      // console.log(createCommentDto);
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
        .findById(new Types.ObjectId(authorId))
        .exec();
      if (authorProfile) {
        authorType = 'User';
      } else {
        const authorCompany = await this.companyModel
          .findById(new Types.ObjectId(authorId))
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
        author_id: new Types.ObjectId(authorId),
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
        addNotification(
          this.notificationModel, // Pass the notification model
          new Types.ObjectId(authorId),
          new Types.ObjectId(post.author_id),
          new Types.ObjectId(newComment._id),
          new Types.ObjectId(post._id),
          'Comment',
          `commented on your post`,
          new Date(),
          this.notificationGateway, // Pass NotificationGateway
          this.profileModel, // Pass Profile model
          this.companyModel, // Pass Company model
          this.userModel, // Pass User model
          this.companyManagerModel, // Pass CompanyManager model
        );
        await post.save();
      } else if (comment) {
        comment?.replies.push(newComment._id);
        addNotification(
          this.notificationModel, // Pass the notification model
          new Types.ObjectId(authorId),
          new Types.ObjectId(comment.author_id),
          new Types.ObjectId(newComment._id),
          new Types.ObjectId(comment.post_id),
          'Comment',
          `replied to your comment`,
          new Date(),
          this.notificationGateway, // Pass NotificationGateway
          this.profileModel, // Pass Profile model
          this.companyModel, // Pass Company model
          this.userModel, // Pass User model
          this.companyManagerModel, // Pass CompanyManager model
        );
        await comment?.save();
      }

      return getCommentInfo(
        newComment,
        authorId,
        this.profileModel,
        this.companyModel,
        this.reactModel,
        this.userConnectionModel,
      );
    } catch (err) {
      console.error(err);
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException('Failed to add comment');
    }
  }

  /**
   * Retrieve paginated comments for a specific post
   *
   * Process:
   * 1. Calculate pagination parameters (skip, limit)
   * 2. Query the database for comments on the specified post
   * 3. Apply sorting (newest first) and pagination
   * 4. For each comment, enrich with:
   *    - Author profile details
   *    - Reaction data
   *    - User connection status
   * 5. Return array of fully formatted comment DTOs
   */
  async getComments(
    postId: string,
    page: number,
    limit: number,
    userId: string,
    companyId: string,
  ): Promise<GetCommentDto[]> {
    try {
      const authorId = await getUserAccessed(
        userId,
        companyId,
        this.companyManagerModel,
      );
      const skip = (page - 1) * limit;
      const comments = await this.commentModel
        .find({ post_id: new Types.ObjectId(postId) })
        .skip(skip)
        .sort({ commented_at: -1 })
        .limit(limit)
        .exec();

      if (!comments || comments.length === 0) {
        return [];
      }

      return Promise.all(
        comments.map((comment) =>
          getCommentInfo(
            comment,
            authorId,
            this.profileModel,
            this.companyModel,
            this.reactModel,
            this.userConnectionModel,
          ),
        ),
      );
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Failed to fetch comments');
    }
  }

  /**
   * Edit an existing comment's content and tags
   *
   * Process:
   * 1. Find the comment by its ID
   * 2. Verify the requesting user is the original author
   * 3. Update comment fields with provided data
   * 4. Mark the comment as edited
   * 5. Save and return the updated comment
   */
  async editComment(
    commentId: string,
    editCommentDto: EditCommentDto,
    userId: string,
    companyId: string,
  ): Promise<GetCommentDto> {
    try {
      const authorId = await getUserAccessed(
        userId,
        companyId,
        this.companyManagerModel,
      );
      const comment = await this.commentModel
        .findById(new Types.ObjectId(commentId))
        .exec();
      if (!comment) {
        throw new NotFoundException('Comment not found');
      }

      if (comment.author_id.toString() !== authorId) {
        throw new UnauthorizedException(
          'User not authorized to edit this comment',
        );
      }

      Object.assign(comment, editCommentDto);
      comment.is_edited = true;
      await comment.save();
      return await getCommentInfo(
        comment,
        authorId,
        this.profileModel,
        this.companyModel,
        this.reactModel,
        this.userConnectionModel,
      );
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException('Failed to edit comment');
    }
  }

  /**
   * Delete a comment and its associated data
   *
   * Process:
   * 1. Find the comment by its ID
   * 2. Verify the requesting user is the original author
   * 3. Locate the parent (post or comment) and update reference counts
   * 4. Perform cascade deletion of:
   *    - Reactions on the comment
   *    - The comment itself
   *    - Any replies to the comment
   */
  async deleteComment(
    commentId: string,
    userId: string,
    companyId: string,
  ): Promise<void> {
    try {
      const authorId = await getUserAccessed(
        userId,
        companyId,
        this.companyManagerModel,
      );
      const comment = await this.commentModel
        .findById(new Types.ObjectId(commentId))
        .exec();
      if (!comment) {
        throw new NotFoundException('Comment not found');
      }

      if (comment.author_id.toString() !== authorId) {
        throw new UnauthorizedException(
          'User not authorized to delete this comment',
        );
      }

      let post = await this.postModel.findById(comment.post_id).exec();
      let parentComment = await this.commentModel
        .findById(comment.post_id)
        .exec();
      if (!post && !parentComment) {
        throw new NotFoundException('Parent not found');
      }
      if (post) {
        post.comment_count--;
        await post.save();
      }
      if (parentComment) {
        parentComment.replies = parentComment.replies.filter(
          (reply) => reply.toString() !== commentId,
        );
        await parentComment.save();
      }

      // Get IDs of reactions and replies
      const reactions = await this.reactModel
        .find({ post_id: new Types.ObjectId(commentId) })
        .select('_id')
        .exec();
      const replies = await this.commentModel
        .find({ post_id: new Types.ObjectId(commentId) })
        .select('_id')
        .exec();

      // Delete notifications for reactions and replies and comment itself
      for (const reaction of reactions) {
        await deleteNotification(this.notificationModel, reaction._id);
      }
      for (const reply of replies) {
        await deleteNotification(this.notificationModel, reply._id);
      }
      await deleteNotification(this.notificationModel, comment._id);

      // Perform cascade deletion
      await this.reactModel
        .deleteMany({ post_id: new Types.ObjectId(commentId) })
        .exec();
      await this.commentModel
        .deleteOne({ _id: new Types.ObjectId(commentId) })
        .exec();
      await this.commentModel
        .deleteMany({ post_id: new Types.ObjectId(commentId) })
        .exec();
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException('Failed to delete comment');
    }
  }

  /**
   * Search for posts matching specific criteria with advanced filtering
   *
   * Process:
   * 1. Parse and validate search parameters
   * 2. Build search query based on keywords, splitting into individual words
   * 3. Apply time-based filtering (24h, week, all time)
   * 4. Apply network-based filtering (network-only or all users)
   * 5. If network-only, identify connected and followed users
   * 6. Execute search with pagination
   * 7. Enrich results with complete post information
   * 8. Return array of matching posts as DTOs
   */
  async searchPosts(
    userId: string,
    query: string,
    networkOnly: boolean,
    timeframe: '24h' | 'week' | 'all',
    page = 1,
    limit = 10,
    companyId: string,
  ): Promise<GetPostDto[]> {
    const skip = (page - 1) * limit;

    try {
      const authorId = await getUserAccessed(
        userId,
        companyId,
        this.companyManagerModel,
      );
      if (!Types.ObjectId.isValid(authorId)) {
        throw new BadRequestException('Invalid user ID format');
      }

      const objectId = new Types.ObjectId(authorId);

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
          authorId, // include self
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

      // console.log(posts);

      return Promise.all(
        posts.map((post) =>
          getPostInfo(
            post,
            authorId,
            this.postModel,
            this.profileModel,
            this.companyModel,
            this.reactModel,
            this.saveModel,
            this.userConnectionModel,
          ),
        ),
      );
    } catch (err) {
      //console.error(err);
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException('Failed to search posts');
    }
  }

  /**
   * Retrieve all reposts (shares) of a specific post with visibility filtering
   *
   * Process:
   * 1. Calculate pagination parameters
   * 2. Determine the user's network (connections and following)
   * 3. Build a visibility filter to show:
   *    - Public reposts
   *    - Reposts by users in the viewer's network
   *    - Reposts by the viewer themselves
   * 4. Query reposts with parent_post_id matching the specified post
   * 5. Apply sorting (newest first) and pagination
   * 6. Enrich each repost with complete information
   * 7. Return array of repost DTOs
   */
  async getRepostsOfPost(
    postId: string,
    userId: string,
    page: number,
    limit: number,
    companyId: string,
  ): Promise<GetPostDto[]> {
    const offset = (page - 1) * limit;
    try {
      const authorId = await getUserAccessed(
        userId,
        companyId,
        this.companyManagerModel,
      );
      if (!Types.ObjectId.isValid(postId)) {
        throw new BadRequestException('Invalid post ID format');
      }
      if (!Types.ObjectId.isValid(authorId)) {
        throw new BadRequestException('Invalid user ID format');
      }

      const objectId = new Types.ObjectId(authorId);

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
          authorId,
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
        .skip(offset)
        .limit(limit)
        .exec();

      if (!reposts || reposts.length === 0) {
        return [];
      }

      return Promise.all(
        reposts.map((post) =>
          getPostInfo(
            post,
            authorId,
            this.postModel,
            this.profileModel,
            this.companyModel,
            this.reactModel,
            this.saveModel,
            this.userConnectionModel,
          ),
        ),
      );
    } catch (err) {
      // console.error(err);
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException('Failed to fetch reposts');
    }
  }

  /**
   * Retrieve all reposts created by a specific user with pagination
   *
   * Process:
   * 1. Calculate pagination parameters
   * 2. Query posts where:
   *    - Author matches the specified user
   *    - Post has a parent_post_id (indicating it's a repost)
   * 3. Apply sorting (newest first) and pagination
   * 4. Enrich each repost with:
   *    - Author information
   *    - Reaction data
   *    - Parent post details
   *    - Connection status relative to viewer
   * 5. Return array of fully formatted repost DTOs
   */
  async getRepostsByUser(
    userId: string,
    page: number,
    limit: number,
    viewerId: string,
    companyId: string,
  ): Promise<GetPostDto[]> {
    const skip = (page - 1) * limit;

    try {
      const authorId = await getUserAccessed(
        userId,
        companyId,
        this.companyManagerModel,
      );
      if (!Types.ObjectId.isValid(authorId)) {
        throw new BadRequestException('Invalid user ID format');
      }

      const reposts = await this.postModel
        .find({
          author_id: new Types.ObjectId(authorId),
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
            this.userConnectionModel,
          ),
        ),
      );
    } catch (err) {
      // console.error(err);
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException('Failed to fetch user reposts');
    }
  }
}
