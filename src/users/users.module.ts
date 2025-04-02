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
    ]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'default_secret',
      signOptions: { expiresIn: '1h' },
    }),
    MailerModule,
  ],
  providers: [UsersService, UserSeeder],
  controllers: [UsersController],
  exports: [UsersService, MongooseModule],
})
export class UsersModule {}
