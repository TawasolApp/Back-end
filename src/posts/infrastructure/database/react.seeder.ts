import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { React, ReactDocument } from './react.schema';
import {
  User,
  UserDocument,
} from '../../../auth/infrastructure/database/user.schema';
import {
  Company,
  CompanyDocument,
} from '../../../companies/infrastructure/database/company.schema';
import {
  Post,
  PostDocument,
} from '../../../posts/infrastructure/database/post.schema';
import { faker } from '@faker-js/faker';

@Injectable()
export class ReactSeeder {
  constructor(
    @InjectModel(React.name) private reactModel: Model<ReactDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Company.name) private companyModel: Model<CompanyDocument>,
    @InjectModel(Post.name) private postModel: Model<PostDocument>,
  ) {}

  async seedReacts(count: number): Promise<void> {
    const users = await this.userModel.find().select('_id').lean();
    const companies = await this.companyModel.find().select('_id').lean();
    const posts = await this.postModel.find().select('_id').lean();

    if (users.length === 0 || companies.length === 0 || posts.length === 0) {
      console.log(
        'Not enough users, companies, or posts to seed reactions. Seeding aborted.',
      );
      return;
    }

    const reacts: Partial<ReactDocument>[] = [];

    for (let i = 0; i < count; i++) {
      const isUser = faker.datatype.boolean();
      let user = isUser
        ? faker.helpers.arrayElement(users)
        : faker.helpers.arrayElement(companies);

      let post = faker.helpers.arrayElement(posts);

      let existingReact = await this.reactModel.find({
        post_Id: post._id,
        user_Id: user._id,
      });

      while (existingReact.length > 0) {
        user = isUser
          ? faker.helpers.arrayElement(users)
          : faker.helpers.arrayElement(companies);
        existingReact = await this.reactModel.find({
          post_Id: post._id,
          user_Id: user._id,
        });
      }

      reacts.push({
        user_type: isUser ? 'User' : 'Company',
        user_Id: user._id,
        post_Id: post._id,
        type: faker.helpers.arrayElement(['Like', 'Love', 'Laugh', 'Clap']),
      });
    }

    await this.reactModel.insertMany(reacts);
    console.log(`${count} reactions seeded successfully!`);
  }

  async clearReacts(): Promise<void> {
    await this.reactModel.deleteMany({});
    console.log('Reacts collection cleared.');
  }
}
