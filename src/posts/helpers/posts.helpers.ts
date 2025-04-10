import {
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { PostDocument } from '../infrastructure/database/schemas/post.schema';
import { CommentDocument } from '../infrastructure/database/schemas/comment.schema';
import { ProfileDocument } from '../../profiles/infrastructure/database/schemas/profile.schema';
import { CompanyDocument } from '../../companies/infrastructure/database/schemas/company.schema';
import { GetCommentDto } from '../dto/get-comment.dto';
import { mapCommentToDto } from '../mappers/post.map';
import { ReactDocument } from '../infrastructure/database/schemas/react.schema';
import { GetPostDto } from '../dto/get-post.dto';
import { ReactionDto } from '../dto/get-reactions.dto';
import { mapPostToDto, mapReactionToDto } from '../mappers/post.map';

/**
 * Find a post by its ID with proper error handling
 *
 * Process:
 * 1. Query the database for a post with the given ID
 * 2. If the post doesn't exist, throw a NotFoundException
 * 3. Handle invalid ID format with appropriate error message
 * 4. Return the found post document
 */
export async function findPostById(
  postModel,
  id: string,
): Promise<PostDocument> {
  try {
    const post = await postModel.findById(new Types.ObjectId(id)).exec();
    if (!post) {
      throw new NotFoundException('Post not found');
    }
    return post;
  } catch (error) {
    if (error.name === 'BSONError') {
      throw new NotFoundException('Invalid post id format');
    }
    throw new InternalServerErrorException('Failed to find post');
  }
}

/**
 * Enrich a comment with author information, reaction data, and connection status
 *
 * Process:
 * 1. Determine if the author is a User or Company and fetch profile data
 * 2. Extract author details (name, picture, bio) based on profile type
 * 3. Check if the viewing user has reacted to this comment
 * 4. Determine connection status between viewer and comment author:
 *    - Are they the same person?
 *    - Is the viewer following the author?
 *    - Are they connected?
 * 5. Map all collected data to a standardized comment DTO
 */
export async function getCommentInfo(
  comment: CommentDocument,
  userId: string,
  profileModel,
  companyModel,
  reactModel,
  userConnectionModel,
): Promise<GetCommentDto> {
  let authorProfile: ProfileDocument | CompanyDocument | null = null;
  let authorProfilePicture: string | undefined;
  let authorName = 'Unknown';
  let authorBio = '';

  if (comment.author_type === 'User') {
    authorProfile = await profileModel.findById(comment.author_id).exec();

    console.log('authorProfile', authorProfile);
    if (authorProfile) {
      authorProfilePicture =
        'profile_picture' in authorProfile
          ? authorProfile.profile_picture
          : undefined;
      authorName =
        'first_name' in authorProfile && 'last_name' in authorProfile
          ? `${authorProfile.first_name} ${authorProfile.last_name}`
          : 'Unknown';
      authorBio = 'bio' in authorProfile ? authorProfile.bio : '';
    }
  } else if (comment.author_type === 'Company') {
    authorProfile = await companyModel.findById(comment.author_id).exec();
    console.log('authorProfile', authorProfile);
    if (authorProfile) {
      if ('logo' in authorProfile) {
        authorProfilePicture =
          'logo' in authorProfile ? authorProfile.logo : undefined;
      }
      authorName = 'name' in authorProfile ? authorProfile.name : 'Unknown';
      authorBio =
        'description' in authorProfile ? authorProfile.description : '';
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
    const userReaction = await reactModel
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

  const isFollowed = userId
    ? comment.author_id.toString() === userId ||
      (await userConnectionModel.exists({
        sending_party: new Types.ObjectId(userId),
        receiving_party: comment.author_id,
        status: 'Following',
      }))
    : false;

  const isConnected = userId
    ? comment.author_id.toString() === userId ||
      (await userConnectionModel.exists({
        $or: [
          {
            sending_party: new Types.ObjectId(userId),
            receiving_party: comment.author_id,
          },
          {
            sending_party: comment.author_id,
            receiving_party: new Types.ObjectId(userId),
          },
        ],
        status: 'Connected',
      }))
    : false;

  return mapCommentToDto(
    comment,
    authorName,
    authorProfilePicture ?? '',
    authorBio,
    userReactionType,
    comment.replies.map((reply) => reply.toString()),
    isFollowed,
    isConnected,
  );
}

/**
 * Enrich a post with complete metadata, author info, and user-specific context
 *
 * Process:
 * 1. Fetch author profile data (User or Company)
 * 2. If this is a repost, recursively fetch and enrich the parent post
 * 3. Check if the viewing user has reacted to this post and get reaction type
 * 4. Determine if the viewer has saved this post
 * 5. Check connection status between viewer and post author:
 *    - Following status
 *    - Connection status
 * 6. Map all collected data to a standardized post DTO
 * 7. Attach parent post information for reposts
 */
export async function getPostInfo(
  post: PostDocument,
  userId: string,
  postModel,
  profileModel,
  companyModel,
  reactModel,
  saveModel,
  userConnectionModel,
): Promise<GetPostDto> {
  let authorProfile: ProfileDocument | CompanyDocument | null = null;
  let authorProfilePicture: string | undefined;
  let authorBio: string | undefined;

  //   console.log(post);
  if (post.author_type === 'User') {
    authorProfile = await profileModel
      .findById(new Types.ObjectId(post.author_id))
      .exec();
    if (!authorProfile) {
      throw new NotFoundException('Author profile not found');
    }
    if ('profile_picture' in authorProfile) {
      authorProfilePicture = authorProfile.profile_picture;
    }
    authorBio = 'bio' in authorProfile ? authorProfile.bio : undefined;
  } else if (post.author_type === 'Company') {
    authorProfile = await companyModel
      .findById(new Types.ObjectId(post.author_id))
      .exec();
    if (!authorProfile) {
      throw new NotFoundException('Author profile not found');
    }
    authorProfilePicture =
      'logo' in authorProfile ? authorProfile.logo : undefined;
    authorBio =
      'description' in authorProfile ? authorProfile.description : undefined;
  } else {
    throw new Error('Invalid author type');
  }
  let parentPost: PostDocument | null = null;
  let parentPostDto: GetPostDto | undefined = undefined;
  if (post.parent_post_id) {
    parentPost = await postModel.findOne({ _id: post.parent_post_id }).exec();

    if (!parentPost) {
      console.log('Parent post not found');
    } else {
      parentPostDto = await getPostInfo(
        parentPost,
        userId,
        postModel,
        profileModel,
        companyModel,
        reactModel,
        saveModel,
        userConnectionModel,
      );
    }
  }

  const userReaction = userId
    ? await reactModel
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

  const isSaved = await saveModel.exists({
    post_id: post._id,
    user_id: new Types.ObjectId(userId),
  });

  const isFollowed = userId
    ? post.author_id.toString() === userId ||
      (await userConnectionModel.exists({
        sending_party: new Types.ObjectId(userId),
        receiving_party: post.author_id,
        status: 'Following',
      }))
    : false;

  const isConnected = userId
    ? post.author_id.toString() === userId ||
      (await userConnectionModel.exists({
        $or: [
          {
            sending_party: new Types.ObjectId(userId),
            receiving_party: post.author_id,
          },
          {
            sending_party: post.author_id,
            receiving_party: new Types.ObjectId(userId),
          },
        ],
        status: 'Connected',
      }))
    : false;

  const returnedDTo = mapPostToDto(
    post,
    authorProfile,
    userReactionType,
    !!isSaved,
    isFollowed,
    isConnected,
  );

  return { ...returnedDTo, parentPost: parentPostDto };
}

/**
 * Retrieve detailed information about a reaction and its author
 *
 * Process:
 * 1. Determine if the reactor is a User or Company
 * 2. Fetch the reactor's profile data
 * 3. Extract the appropriate profile picture (user photo or company logo)
 * 4. Map reaction data and author information to a standardized DTO
 */
export async function getReactionInfo(
  reaction: ReactDocument,
  profileModel,
  companyModel,
): Promise<ReactionDto> {
  let authorProfile;
  let authorProfilePicture;

  if (reaction.user_type === 'User') {
    authorProfile = await profileModel.findById(reaction.user_id).exec();
    if (!authorProfile) {
      throw new NotFoundException('Author profile not found');
    }
    authorProfilePicture = authorProfile.profile_picture;
  } else if (reaction.user_type === 'Company') {
    authorProfile = await companyModel.findById(reaction.user_id).exec();
    if (!authorProfile) {
      throw new NotFoundException('Author profile not found');
    }
    authorProfilePicture = authorProfile.logo;
  }

  return mapReactionToDto(reaction, authorProfile, authorProfilePicture);
}
