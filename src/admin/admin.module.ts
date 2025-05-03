import { Module } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import {
  Report,
  ReportSchema,
} from './infrastructure/database/schemas/report.schema';
import {
  Company,
  CompanySchema,
} from '../companies/infrastructure/database/schemas/company.schema';
import {
  Job,
  JobSchema,
} from '../jobs/infrastructure/database/schemas/job.schema';
import {
  Comment,
  CommentSchema,
} from '../posts/infrastructure/database/schemas/comment.schema';
import {
  Post,
  PostSchema,
} from '../posts/infrastructure/database/schemas/post.schema';
import {
  Profile,
  ProfileSchema,
} from '../profiles/infrastructure/database/schemas/profile.schema';
import {
  User,
  UserSchema,
} from '../users/infrastructure/database/schemas/user.schema';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';
import { ReportSeeder } from './infrastructure/database/seeders/report.seeder';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Report.name, schema: ReportSchema },
      { name: User.name, schema: UserSchema },
      { name: Profile.name, schema: ProfileSchema },
      { name: Company.name, schema: CompanySchema },
      { name: Post.name, schema: PostSchema },
      { name: Comment.name, schema: CommentSchema },
      { name: Job.name, schema: JobSchema },
    ]),
    AuthModule,
    UsersModule,
    JwtModule.register({
      secret:
        process.env.JWT_SECRET ||
        '4a52519e47d98ddd4b515a71ca31443d530b16bd48218cacd2805ea7d0cdc5d4',
      signOptions: { expiresIn: '1h' },
    }),
  ],
  controllers: [AdminController],
  providers: [ReportSeeder, AdminService],
  exports: [ReportSeeder, AdminService],
})
export class AdminModule {}
