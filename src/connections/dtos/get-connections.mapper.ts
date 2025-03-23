import { GetConnectionDto } from './get-connection.dto';

export function toGetConnectionDto(connection: any): GetConnectionDto {
  return {
    userId: connection.userId?.toString(),
    username: connection.username,
    profilePicture: connection.profilePicture,
    headline: connection.headline,
    createdAt: connection.created_at
      ? new Date(connection.created_at).toISOString()
      : new Date(0).toISOString(),
      //TODO: date is always read wrong, fix it
  };
}
