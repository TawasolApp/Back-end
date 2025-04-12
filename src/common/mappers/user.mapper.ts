import { Profile } from '../../profiles/infrastructure/database/schemas/profile.schema';
import { GetUserDto } from '../dtos/get-user.dto';

export function toGetUserDto(
  profile: Partial<Profile>,
): GetUserDto {
  const dto: Partial<GetUserDto> = {};

  if (profile._id) dto.userId = profile._id.toString();
  if (profile.first_name) dto.firstName = profile.first_name;
  if (profile.last_name) dto.lastName = profile.last_name;
  if (profile.profile_picture) dto.profilePicture = profile.profile_picture;
  if (profile.cover_photo) dto.coverPhoto = profile.cover_photo;
  if (profile.headline) dto.headline = profile.headline;

  return dto as GetUserDto;
}
