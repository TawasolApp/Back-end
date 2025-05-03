import { ProfileDocument } from 'src/profiles/infrastructure/database/schemas/profile.schema';
import { GetCommentDto } from '../dto/get-comment.dto';
import { GetPostDto } from '../dto/get-post.dto';
import { ReactionDto } from '../dto/get-reactions.dto';
import { CompanyDocument } from '../../companies/infrastructure/database/schemas/company.schema';

/**
 * Transform a post document into a standardized DTO with author context
 *
 * Process:
 * 1. Extract core post data (ID, content, media, visibility)
 * 2. Format author information based on profile type (User vs Company):
 *    - Handle different field names between profile types
 *    - Extract appropriate name format
 *    - Get correct profile picture or logo
 *    - Include bio or description
 * 3. Add metadata (reaction counts, comments, shares)
 * 4. Include viewer-specific context:
 *    - Current user's reaction type if any
 *    - Whether the post is saved by the viewer
 *    - Connection status with author
 *    - Following status with author
 * 4. Return a consistent DTO regardless of author type
 */
export function mapPostToDto(
  post: any,
  authorProfile: ProfileDocument | CompanyDocument,
  userReactionType: string | null,
  isSaved: boolean,
  isConnected: boolean,
  isFollowing: boolean,
): GetPostDto {
  return {
    id: post.id.toString(),
    authorId: post.author_id.toString(),
    authorName:
      'first_name' in authorProfile && 'last_name' in authorProfile
        ? `${authorProfile.first_name} ${authorProfile.last_name}`
        : 'name' in authorProfile
          ? authorProfile.name
          : 'Unknown',
    authorPicture:
      'profile_picture' in authorProfile
        ? authorProfile.profile_picture
        : authorProfile.logo,
    authorBio:
      'headline' in authorProfile
        ? authorProfile.headline
        : 'followers' in authorProfile
          ? `${authorProfile.followers.toLocaleString()} followers`
          : '',
    content: post.text,
    media: post.media,
    reactCounts: post.react_count,
    comments: post.comment_count,
    shares: post.share_count,
    taggedUsers: post.tags,
    visibility: post.visibility as 'Public' | 'Connections' | 'Private',
    authorType: post.author_type,
    reactType: userReactionType as
      | 'Like'
      | 'Love'
      | 'Funny'
      | 'Celebrate'
      | 'Insightful'
      | 'Support',
    timestamp: post.posted_at,
    isSaved: !!isSaved,
    isSilentRepost: post.is_silent_repost,
    isConnected: !!isConnected,
    isFollowing: !!isFollowing,
    isEdited: post.is_edited,
  };
}

/**
 * Transform a reaction document into a standardized DTO with reactor details
 *
 * Process:
 * 1. Extract core reaction data (ID, type, post reference)
 * 2. Format reactor information based on profile type:
 *    - Handle different field names between User and Company profiles
 *    - Extract appropriate name format
 *    - Include correct profile picture or logo
 *    - Add bio or description
 * 3. Return a consistent DTO regardless of reactor type
 */
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
    authorName:
      'first_name' in authorProfile && 'last_name' in authorProfile
        ? `${authorProfile.first_name} ${authorProfile.last_name}`
        : 'name' in authorProfile
          ? authorProfile.name
          : 'Unknown',
    authorPicture: authorProfilePicture,
    authorBio:
      'bio' in authorProfile ? authorProfile.bio : authorProfile.description,
  };
}

/**
 * Transform a comment document into a standardized DTO with author context
 *
 * Process:
 * 1. Extract core comment data (ID, content, timestamp)
 * 2. Include pre-formatted author information:
 *    - Author name, picture, and bio
 *    - Author type (User or Company)
 * 3. Add metadata:
 *    - Reaction counts by type
 *    - Reply count
 *    - Tagged users
 * 4. Include viewer-specific context:
 *    - Current user's reaction type if any
 *    - Connection status with author
 *    - Following status with author
 * 5. Return a consistent DTO with edit status
 */
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
  isConnected: boolean,
  isFollowing: boolean,
): GetCommentDto {
  console.log('Comment:', comment);
  return {
    id: comment._id.toString(),
    postId: comment.post_id.toString(),
    authorId: comment.author_id.toString(),
    authorName: authorName,
    authorPicture: authorProfilePicture,
    authorBio: authorBio,
    authorType: comment.author_type as 'User' | 'Company',
    content: comment.content,
    repliesCount: replies.length,
    reactCounts: comment.react_count,
    timestamp: comment.commented_at.toISOString(),
    taggedUsers: comment.tags,
    reactType: userReactionType,
    isConnected: !!isConnected,
    isFollowing: !!isFollowing,
    isEdited: comment.is_edited,
  };
}
