import { GetFollowerDto } from "./get-follower.dto";

export function toGetFollowerDto(connection: any): GetFollowerDto {
  return {
    userId: connection.userId?.toString(),
    username: connection.username,
    profilePicture: connection.profilePicture,
    headline: connection.headline,
  };
}