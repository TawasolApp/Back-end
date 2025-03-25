import { Profile, ProfileDocument } from "src/profiles/infrastructure/database/profile.schema";
import { GetUserDto } from "./get-user.dto";

export function toGetUserDto(profile: any): GetUserDto {
    const dto: Partial<GetUserDto> = {};
  
    if (profile._id) dto.userId = profile._id.toString();
    if (profile.name) dto.username = profile.name;
    if (profile.profile_picture) dto.profilePicture = profile.profile_picture;
    if (profile.headline) dto.headline = profile.headline;
  
    return dto as GetUserDto;
  }