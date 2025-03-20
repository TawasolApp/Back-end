import { Profile } from "src/profiles/infrastructure/database/profile.schema";
import { GetFollowerDto } from "./get-follower.dto";

export function toFollowerDto(follower: Partial<Profile>): GetFollowerDto {
  const dto: Partial<GetFollowerDto> = {};

  if (follower._id) dto.userId = follower._id.toString();
  if (follower.name) dto.username = follower.name;
  if (follower.profile_picture) dto.profilePicture = follower.profile_picture;
  if (follower.headline) dto.headline = follower.headline;

  return dto as GetFollowerDto;
}