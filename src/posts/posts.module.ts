import { forwardRef, Module } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Post,
  PostSchema,
} from './infrastructure/database/schemas/post.schema';
import {
  Comment,
  CommentSchema,
} from './infrastructure/database/schemas/comment.schema';
import {
  React,
  ReactSchema,
} from './infrastructure/database/schemas/react.schema';
import {
  Save,
  SaveSchema,
} from './infrastructure/database/schemas/save.schema';
import {
  Share,
  ShareSchema,
} from './infrastructure/database/schemas/share.schema';
import { PostSeeder } from './infrastructure/database/seeders/post.seeder';
import { CommentSeeder } from './infrastructure/database/seeders/comment.seeder';
import { ReactSeeder } from './infrastructure/database/seeders/react.seeder';
import { SaveSeeder } from './infrastructure/database/seeders/save.seeder';
import { ShareSeeder } from './infrastructure/database/seeders/share.seeder';
import { PostsController } from './posts.controller';
import { ValidationPipe } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CompaniesModule } from '../companies/companies.module';
import {
  Company,
  CompanySchema,
} from '../companies/infrastructure/database/schemas/company.schema';
import {
  Profile,
  ProfileSchema,
} from '../profiles/infrastructure/database/schemas/profile.schema';
import { ProfilesModule } from '../profiles/profiles.module';
import { UsersModule } from '../users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { PostsService } from './posts.service';
import {
  UserConnection,
  UserConnectionSchema,
} from '../connections/infrastructure/database/schemas/user-connection.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Post.name, schema: PostSchema },
      { name: Comment.name, schema: CommentSchema },
      { name: React.name, schema: ReactSchema },
      { name: Save.name, schema: SaveSchema },
      { name: Share.name, schema: ShareSchema },
      { name: Company.name, schema: CompanySchema },
      { name: Profile.name, schema: ProfileSchema },
      { name: UserConnection.name, schema: UserConnectionSchema },
    ]),
    AuthModule,
    CompaniesModule,
    forwardRef(() => ProfilesModule),
    UsersModule,

    JwtModule.register({
      secret:
        process.env.JWT_SECRET ||
        '4a52519e47d98ddd4b515a71ca31443d530b16bd48218cacd2805ea7d0cdc5d4',
      signOptions: { expiresIn: '1h' },
    }),
  ],
  providers: [
    PostSeeder,
    CommentSeeder,
    ReactSeeder,
    SaveSeeder,
    ShareSeeder,
    PostsService,
    {
      provide: APP_PIPE,
      useClass: ValidationPipe,
    },
  ],
  exports: [
    PostSeeder,
    CommentSeeder,
    ReactSeeder,
    SaveSeeder,
    ShareSeeder,
    PostsService,
  ],
  controllers: [PostsController],
})
export class PostsModule {}
