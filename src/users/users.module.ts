import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { JwtModule } from '@nestjs/jwt';
import { MailerModule } from '../common/services/mailer.module';
import {
  User,
  UserSchema,
} from './infrastructure/database/schemas/user.schema';
import { UserSeeder } from './infrastructure/database/seeders/user.seeder';
import {
  Profile,
  ProfileSchema,
} from '../profiles/infrastructure/database/schemas/profile.schema';
import {
  Post,
  PostSchema,
} from '../posts/infrastructure/database/schemas/post.schema';
import {
  Save,
  SaveSchema,
} from '../posts/infrastructure/database/schemas/save.schema';
import {
  React,
  ReactSchema,
} from '../posts/infrastructure/database/schemas/react.schema';
import {
  Comment,
  CommentSchema,
} from '../posts/infrastructure/database/schemas/comment.schema';
import {
  Share,
  ShareSchema,
} from '../posts/infrastructure/database/schemas/share.schema';
import {
  UserConnection,
  UserConnectionSchema,
} from '../connections/infrastructure/database/schemas/user-connection.schema';
import {
  CompanyConnection,
  CompanyConnectionSchema,
} from '../companies/infrastructure/database/schemas/company-connection.schema';
import {
  CompanyEmployer,
  CompanyEmployerSchema,
} from '../jobs/infrastructure/database/schemas/company-employer.schema';
import {
  CompanyManager,
  CompanyManagerSchema,
} from '../companies/infrastructure/database/schemas/company-manager.schema';
import {
  Application,
  ApplicationSchema,
} from '../jobs/infrastructure/database/schemas/application.schema';
import {
  Job,
  JobSchema,
} from '../jobs/infrastructure/database/schemas/job.schema';
import {
  Report,
  ReportSchema,
} from '../admin/infrastructure/database/schemas/report.schema';
import {
  Message,
  MessageSchema,
} from '../messages/infrastructure/database/schemas/message.schema';
import {
  Conversation,
  ConversationSchema,
} from '../messages/infrastructure/database/schemas/conversation.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Profile.name, schema: ProfileSchema },
      { name: Post.name, schema: PostSchema },
      { name: Save.name, schema: SaveSchema },
      { name: React.name, schema: ReactSchema },
      { name: Comment.name, schema: CommentSchema },
      { name: Share.name, schema: ShareSchema },
      { name: UserConnection.name, schema: UserConnectionSchema },
      { name: CompanyConnection.name, schema: CompanyConnectionSchema },
      { name: CompanyEmployer.name, schema: CompanyEmployerSchema },
      { name: CompanyManager.name, schema: CompanyManagerSchema },
      { name: Application.name, schema: ApplicationSchema },
      { name: Job.name, schema: JobSchema },
      { name: Report.name, schema: ReportSchema },
      { name: Message.name, schema: MessageSchema },
      { name: Conversation.name, schema: ConversationSchema },
    ]),
    JwtModule.register({
      secret:
        process.env.JWT_SECRET ||
        '4a52519e47d98ddd4b515a71ca31443d530b16bd48218cacd2805ea7d0cdc5d4',
      signOptions: { expiresIn: '1h' },
    }),
    MailerModule,
  ],
  providers: [UsersService, UserSeeder],
  controllers: [UsersController],
  exports: [UsersService, MongooseModule, JwtModule],
})
export class UsersModule {}
