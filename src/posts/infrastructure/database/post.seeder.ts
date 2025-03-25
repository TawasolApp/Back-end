import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Post, PostDocument } from './post.schema';
import {
  User,
  UserDocument,
} from '../../../users/infrastructure/database/user.schema';
import {
  Company,
  CompanyDocument,
} from '../../../companies/infrastructure/database/company.schema';
import { faker } from '@faker-js/faker';
import { React, ReactDocument } from './react.schema';
import { Comment, CommentDocument } from './comment.schema';

@Injectable()
export class PostSeeder {
  constructor(
    @InjectModel(Post.name) private postModel: Model<PostDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Company.name) private companyModel: Model<CompanyDocument>,
    @InjectModel(React.name) private reactModel: Model<ReactDocument>,
    @InjectModel(Comment.name) private commentModel: Model<CommentDocument>,
  ) {}

  async seedPosts(count: number): Promise<void> {
    const users = await this.userModel.find().select('_id').lean();
    const companies = await this.companyModel.find().select('_id').lean();

    if (users.length === 0 || companies.length === 0) {
      console.log(
        'Not enough users or companies to seed posts. Seeding aborted.',
      );
      return;
    }

    const posts: Partial<PostDocument>[] = [];

    for (let i = 0; i < count; i++) {
      const isUser = faker.datatype.boolean();
      const creator = isUser
        ? faker.helpers.arrayElement(users)
        : faker.helpers.arrayElement(companies);

      const tags =
        faker.datatype.boolean() && users.length > 0
          ? faker.helpers
              .arrayElements(users, faker.number.int({ min: 0, max: 3 }))
              .map((user) => user._id)
          : [];

      posts.push({
        author_type: isUser ? 'User' : 'Company',
        author_id: creator._id,
        text: faker.lorem.paragraph(),
        media: [faker.image.url()],
        react_count: 0,
        comment_count: 0,
        share_count: 0,
        tags,
        visibility: faker.helpers.arrayElement([
          'Public',
          'Connections',
          'Private',
        ]),
      });
    }

    await this.postModel.insertMany(posts);
    console.log(`${count} posts seeded successfully!`);
  }

  async clearPosts(): Promise<void> {
    await this.postModel.deleteMany({});
    console.log('Posts collection cleared.');
  }

  async updatePostCounts() {
    const posts = await this.postModel.find().exec();
    for (const post of posts) {
      const reactCount = await this.reactModel
        .countDocuments({ post_id: post._id })
        .exec();
      post.react_count = reactCount;
      await post.save();
    }
  }

  async updateCommentCounts(): Promise<void> {
    const posts = await this.postModel.find().exec();
    for (const post of posts) {
      const commentCount = await this.commentModel
        .countDocuments({ post_id: post._id })
        .exec();
      post.comment_count = commentCount;
      await post.save();
    }
    console.log('Post comment counts updated.');
  }
}
