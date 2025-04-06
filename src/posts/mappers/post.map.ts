import { ProfileDocument } from 'src/profiles/infrastructure/database/schemas/profile.schema';
import { GetCommentDto } from '../dto/get-comment.dto';
import { GetPostDto } from '../dto/get-post.dto';
import { ReactionDto } from '../dto/get-reactions.dto';
import { CompanyDocument } from '../../companies/infrastructure/database/schemas/company.schema';
export function mapPostToDto(
  post: any,
  authorProfile: ProfileDocument | CompanyDocument,
  userReactionType: string | null,
  isSaved: boolean,
): GetPostDto {
  return {
    id: post.id.toString(),
    authorId: post.author_id.toString(),
    authorName: authorProfile.name,
    authorPicture:
      'profile_picture' in authorProfile
        ? authorProfile.profile_picture
        : authorProfile.logo,
    authorBio:
      'description' in authorProfile
        ? authorProfile.description
        : authorProfile.bio,
    content: post.text,
    media: post.media,
    reactCounts: post.react_count,
    comments: post.comment_count,
    shares: post.share_count,
    taggedUsers: [], // Assuming this is handled elsewhere
    visibility: post.visibility as 'Public' | 'Connections' | 'Private',
    authorType: post.author_type,
    reactType: userReactionType as
      | 'Like'
      | 'Love'
      | 'Funny'
      | 'Celebrate'
      | 'Insightful'
      | 'Support'
      | null,
    timestamp: post.posted_at,
    isSaved: !!isSaved,
    isSilentRepost: post.is_silent_repost,
  };
}

export function mapReactionToDto(
  reaction: any,
  authorProfile: any,
  authorProfilePicture: string,
): ReactionDto {
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
    authorBio:
      'bio' in authorProfile ? authorProfile.bio : authorProfile.description,
  };
}

export function mapCommentToDto(
  comment: any,
  authorName: string,
  authorProfilePicture: string,
  authorBio: string,
  userReactionType:
    | 'Like'
    | 'Love'
    | 'Funny'
    | 'Celebrate'
    | 'Insightful'
    | 'Support'
    | null,
  replies: string[],
): GetCommentDto {
  return {
    id: comment._id.toString(),
    postId: comment.post_id.toString(),
    authorId: comment.author_id.toString(),
    authorName: authorName,
    authorPicture: authorProfilePicture,
    authorBio: authorBio,
    authorType: comment.author_type as 'User' | 'Company',
    content: comment.content,
    replies: replies, // Assuming replies are handled elsewhere
    reactCount: comment.react_count,
    timestamp: comment.commented_at.toISOString(),
    taggedUsers: [], // Assuming tagged users are handled elsewhere
    reactType: userReactionType,
  };
}
