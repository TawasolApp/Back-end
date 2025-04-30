export class ReportedPostsDto {
  id: string;
  status: string;
  postContent: string;
  postMedia?: string;
  postAuthor: string;
  postAuthorRole: string;
  postAuthorAvatar?: string;
  reportedBy: string;
  reporterAvatar?: string;
  reason: string;
  reportedAt: string;
}
