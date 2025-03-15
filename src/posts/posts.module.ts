import { Module } from '@nestjs/common';
import { APP_PIPE, APP_FILTER } from '@nestjs/core';
import { MongooseModule } from '@nestjs/mongoose';
import { Post, PostSchema } from './infrastructure/database/post.schema';
import { PostSeeder } from './infrastructure/database/post.seeder';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { ValidationPipe } from '@nestjs/common';


@Module({
  imports: [MongooseModule.forFeature([{ name: Post.name, schema: PostSchema }])],
  providers: [
    PostSeeder,
    PostsService,
    {
      provide: APP_PIPE,
      useClass: ValidationPipe,
    }
  ],
  exports: [PostSeeder],
  controllers: [PostsController],
})
export class PostsModule {}
