import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Post, PostDocument } from './post.schema';
import { faker } from '@faker-js/faker';

@Injectable()
export class PostSeeder {
  constructor(@InjectModel(Post.name) private postModel: Model<PostDocument>) {}

  async seedPosts(count: number): Promise<void> {
    const posts: Partial<PostDocument>[] = [];

    for (let i = 0; i < count; i++) {
      posts.push({
        creator: new Types.ObjectId(),
        text: faker.lorem.paragraph(),
        media: [faker.image.url()],
        react_count: faker.number.int({ min: 0, max: 100 }),
        comment_count: faker.number.int({ min: 0, max: 50 }),
        share_count: faker.number.int({ min: 0, max: 20 }),
        tags: [new Types.ObjectId(), new Types.ObjectId()],
      });
    }

    await this.postModel.insertMany(posts);
    console.log(`${count} posts seeded successfully!`);
  }

  async clearPosts(): Promise<void> {
    await this.postModel.deleteMany({});
    console.log('Posts collection cleared.');
  }
}
