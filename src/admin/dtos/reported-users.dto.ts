export class ReportedUsersDto {
  id: string;
  status: string;
  reportedUser: string;
  reportedUserRole: string;
  reportedUserAvatar?: string;
  reportedBy: string;
  reporterAvatar?: string;
  reason: string;
  reportedAt: string;
}
