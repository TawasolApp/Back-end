import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Save, SaveDocument } from '../schemas/save.schema';
import {
  Profile,
  ProfileDocument,
} from '../../../../profiles/infrastructure/database/schemas/profile.schema';
import {
  Post,
  PostDocument,
} from '../schemas/post.schema';
import { faker } from '@faker-js/faker';

@Injectable()
export class SaveSeeder {
  constructor(
    @InjectModel(Save.name) private saveModel: Model<SaveDocument>,
    @InjectModel(Profile.name) private profileModel: Model<ProfileDocument>,
    @InjectModel(Post.name) private postModel: Model<PostDocument>,
  ) {}

  async seedSaves(count: number): Promise<void> {
    const users = await this.profileModel
      .find()
      .select('_id')
      .lean();
    const posts = await this.postModel.find().select('_id').lean();

    if (users.length === 0 || posts.length === 0) {
      console.log('Not enough users or posts to seed saves. Seeding aborted.');
      return;
    }

    const saves: Partial<SaveDocument>[] = [];

    for (let i = 0; i < count; i++) {
      const user = faker.helpers.arrayElement(users);
      const post = faker.helpers.arrayElement(posts);

      const existingSave = await this.saveModel
        .findOne({
          user_id: user._id,
          post_id: post._id,
        })
        .lean();

      if (!existingSave) {
        saves.push({
          user_id: user._id,
          post_id: post._id,
        });
      }
    }

    await this.saveModel.insertMany(saves);
    console.log(`${saves.length} saves seeded successfully!`);
  }

  async clearSaves(): Promise<void> {
    await this.saveModel.deleteMany({});
    console.log('Saves collection cleared.');
  }
}
