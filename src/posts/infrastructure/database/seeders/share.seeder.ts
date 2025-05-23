import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Share, ShareDocument } from '../schemas/share.schema';
import {
  Profile,
  ProfileDocument,
} from '../../../../profiles/infrastructure/database/schemas/profile.schema';
import { Post, PostDocument } from '../schemas/post.schema';
import { faker } from '@faker-js/faker';

@Injectable()
export class ShareSeeder {
  constructor(
    @InjectModel(Share.name) private shareModel: Model<ShareDocument>,
    @InjectModel(Profile.name) private profileModel: Model<ProfileDocument>,
    @InjectModel(Post.name) private postModel: Model<PostDocument>,
  ) {}

  async seedShares(count: number): Promise<void> {
    const users = await this.profileModel.find().select('_id').lean();
    const posts = await this.postModel.find().select('_id').lean();

    if (users.length === 0 || posts.length === 0) {
      console.log('Not enough users or posts to seed shares. Seeding aborted.');
      return;
    }

    const shares: Partial<ShareDocument>[] = [];

    for (let i = 0; i < count; i++) {
      const user = faker.helpers.arrayElement(users);
      const post = faker.helpers.arrayElement(posts);

      shares.push({
        user: user._id,
        post: post._id,
        shared_at: faker.date.recent({
          days: 5,
          refDate: new Date('2025-04-10'),
        }),
      });
    }

    await this.shareModel.insertMany(shares);
    console.log(`${count} shares seeded successfully!`);
  }

  async clearShares(): Promise<void> {
    await this.shareModel.deleteMany({});
    console.log('Shares collection cleared.');
  }
}
