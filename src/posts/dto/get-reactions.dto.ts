import { IsOptional, IsEnum, IsObject } from 'class-validator';

export class ReactionDto {
  likeId: string;
  postId: string;
  authorId: string;
  authorType: 'User' | 'Company';
  authorName: string;
  authorPicture: string;
  authorBio: string;
  type: 'Like' | 'Love' | 'Funny' | 'Celebrate' | 'Insightful' | 'Support';
}
