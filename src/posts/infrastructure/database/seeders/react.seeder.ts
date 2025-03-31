import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { React, ReactDocument } from '../schemas/react.schema';
import {
  User,
  UserDocument,
} from '../../../../users/infrastructure/database/schemas/user.schema';
import {
  Company,
  CompanyDocument,
} from '../../../../companies/infrastructure/database/schemas/company.schema';
import {
  Post,
  PostDocument,
} from '../schemas/post.schema';
import { faker } from '@faker-js/faker';
import { Comment, CommentDocument } from '../schemas/comment.schema';
import {
  Profile,
  ProfileDocument,
} from '../../../../profiles/infrastructure/database/schemas/profile.schema';

@Injectable()
export class ReactSeeder {
  constructor(
    @InjectModel(React.name) private reactModel: Model<ReactDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Company.name) private companyModel: Model<CompanyDocument>,
    @InjectModel(Post.name) private postModel: Model<PostDocument>,
    @InjectModel(Comment.name) private commentModel: Model<CommentDocument>,
    @InjectModel(Profile.name) private profileModel: Model<ProfileDocument>,
  ) {}

  async seedReacts(count: number): Promise<void> {
    const users = await this.profileModel.find().select('_id').lean();
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

      const post = faker.helpers.arrayElement(posts);

      let existingReact = await this.reactModel.find({
        post_id: post._id,
        user_id: user._id,
      });

      while (existingReact.length > 0) {
        user = isUser
          ? faker.helpers.arrayElement(users)
          : faker.helpers.arrayElement(companies);
        existingReact = await this.reactModel.find({
          post_id: post._id,
          user_id: user._id,
        });
      }

      reacts.push({
        user_type: isUser ? 'User' : 'Company',
        user_id: user._id,
        post_id: post._id,
        react_type: faker.helpers.arrayElement([
          'Like',
          'Love',
          'Funny',
          'Celebrate',
          'Insightful',
          'Support',
        ]),
        post_type: 'Post',
      });
    }

    await this.reactModel.insertMany(reacts);
    console.log(`${count} reactions seeded successfully!`);
  }

  async seedCommentReacts(count: number): Promise<void> {
    const users = await this.userModel.find().select('_id').lean();
    const companies = await this.companyModel.find().select('_id').lean();
    const comments = await this.commentModel.find().select('_id').lean();

    if (users.length === 0 || companies.length === 0 || comments.length === 0) {
      console.log(
        'Not enough users, companies, or comments to seed reactions. Seeding aborted.',
      );
      return;
    }

    const reacts: Partial<ReactDocument>[] = [];

    for (let i = 0; i < count; i++) {
      const isUser = faker.datatype.boolean();
      let user = isUser
        ? faker.helpers.arrayElement(users)
        : faker.helpers.arrayElement(companies);

      const comment = faker.helpers.arrayElement(comments);

      let existingReact = await this.reactModel.find({
        post_id: comment._id,
        user_id: user._id,
      });

      while (existingReact.length > 0) {
        user = isUser
          ? faker.helpers.arrayElement(users)
          : faker.helpers.arrayElement(companies);
        existingReact = await this.reactModel.find({
          post_id: comment._id,
          user_id: user._id,
        });
      }

      reacts.push({
        user_type: isUser ? 'User' : 'Company',
        user_id: user._id,
        post_id: comment._id,
        react_type: faker.helpers.arrayElement([
          'Like',
          'Love',
          'Funny',
          'Celebrate',
          'Insightful',
          'Support',
        ]),
        post_type: 'Comment',
      });
    }
    await this.reactModel.insertMany(reacts);
    console.log(`${count} comment reactions seeded successfully!`);
  }

  async clearReacts(): Promise<void> {
    await this.reactModel.deleteMany({});
    console.log('Reacts collection cleared.');
  }
}
