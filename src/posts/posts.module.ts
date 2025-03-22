import { Module } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';
import { MongooseModule } from '@nestjs/mongoose';
import { Post, PostSchema } from './infrastructure/database/post.schema';
import {
  Comment,
  CommentSchema,
} from './infrastructure/database/comment.schema';
import { React, ReactSchema } from './infrastructure/database/react.schema';
import { Save, SaveSchema } from './infrastructure/database/save.schema';
import { Share, ShareSchema } from './infrastructure/database/share.schema';
import { PostSeeder } from './infrastructure/database/post.seeder';
import { CommentSeeder } from './infrastructure/database/comment.seeder';
import { ReactSeeder } from './infrastructure/database/react.seeder';
import { SaveSeeder } from './infrastructure/database/save.seeder';
import { ShareSeeder } from './infrastructure/database/share.seeder';
import { PostsController } from './posts.controller';
import { ValidationPipe } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CompaniesModule } from '../companies/companies.module';
import {
  Company,
  CompanySchema,
} from '../companies/infrastructure/database/company.schema'; // Correct import path
import {
  Profile,
  ProfileSchema,
} from '../profiles/infrastructure/database/profile.schema';
import { ProfilesModule } from '../profiles/profiles.module'; // Import ProfilesModule
import { UsersModule } from '../users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { PostsService } from './posts.service';

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
    ]),
    AuthModule,
    CompaniesModule,
    ProfilesModule, // Add ProfilesModule to imports
    UsersModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'default_secret',
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
  exports: [PostSeeder, CommentSeeder, ReactSeeder, SaveSeeder, ShareSeeder],
  controllers: [PostsController],
})
export class PostsModule {}
