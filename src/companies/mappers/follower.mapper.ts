import { Profile } from '../../profiles/infrastructure/database/schemas/profile.schema';
import { GetFollowerDto } from '../dtos/get-follower.dto';

export function toGetFollowerDto(
  follower: Partial<Profile>,
): GetFollowerDto {
  const dto: Partial<GetFollowerDto> = {};

  if (follower._id) dto.userId = follower._id.toString();
  if (follower.name) dto.username = follower.name;
  if (follower.profile_picture) dto.profilePicture = follower.profile_picture;
  if (follower.headline) dto.headline = follower.headline;

  return dto as GetFollowerDto;
}
