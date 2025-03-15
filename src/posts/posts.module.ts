import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Post, PostSchema } from './infrastructure/database/post.schema';
import { PostSeeder } from './infrastructure/database/post.seeder';

@Module({
  imports: [MongooseModule.forFeature([{ name: Post.name, schema: PostSchema }])],
  providers: [PostSeeder],
  exports: [PostSeeder],
})
export class PostsModule {}
