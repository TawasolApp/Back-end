import { Profile } from '../../profiles/infrastructure/database/schemas/profile.schema';
import { GetUserDto } from '../dtos/get-user.dto';

export function toGetUserDto(
  follower: Partial<Profile>,
): GetUserDto {
  const dto: Partial<GetUserDto> = {};

  if (follower._id) dto.userId = follower._id.toString();
  if (follower.first_name) dto.firstName = follower.first_name;
  if (follower.last_name) dto.lastName = follower.last_name;
  if (follower.profile_picture) dto.profilePicture = follower.profile_picture;
  if (follower.headline) dto.headline = follower.headline;

  return dto as GetUserDto;
}
