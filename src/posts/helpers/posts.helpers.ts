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

export async function getCommentInfo(
  comment: CommentDocument,
  userId: string,
  profileModel,
  companyModel,
  reactModel,
): Promise<GetCommentDto> {
  let authorProfile: ProfileDocument | CompanyDocument | null = null;
  let authorProfilePicture: string | undefined;
  let authorName = 'Unknown';
  let authorBio = '';

  if (comment.author_type === 'User') {
    authorProfile = await profileModel.findById(comment.author_id).exec();
    if (authorProfile) {
      authorProfilePicture =
        'profile_picture' in authorProfile
          ? authorProfile.profile_picture
          : undefined;
      authorName = authorProfile.name;
      authorBio = 'bio' in authorProfile ? authorProfile.bio : '';
    }
  } else if (comment.author_type === 'Company') {
    authorProfile = await companyModel.findById(comment.author_id).exec();
    if (authorProfile) {
      if ('logo' in authorProfile) {
        authorProfilePicture =
          'logo' in authorProfile ? authorProfile.logo : undefined;
      }
      authorName = authorProfile.name;
      authorBio = 'bio' in authorProfile ? authorProfile.bio : '';
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

  return mapCommentToDto(
    comment,
    authorName,
    authorProfilePicture ?? '',
    authorBio,
    userReactionType,
    comment.replies.map((reply) => reply.toString()),
  );
}

export async function getPostInfo(
  post: PostDocument,
  userId: string,
  profileModel,
  companyModel,
  reactModel,
  saveModel,
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

  return mapPostToDto(post, authorProfile, userReactionType, !!isSaved);
}

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
