import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Comment, CommentDocument } from './comment.schema';
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
export class CommentSeeder {
  constructor(
    @InjectModel(Comment.name) private commentModel: Model<CommentDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Company.name) private companyModel: Model<CompanyDocument>,
    @InjectModel(Post.name) private postModel: Model<PostDocument>,
  ) {}

  async seedComments(count: number): Promise<void> {
    const users = await this.userModel.find().select('_id').lean();
    const companies = await this.companyModel.find().select('_id').lean();
    const posts = await this.postModel.find().select('_id').lean();

    if (users.length === 0 || companies.length === 0 || posts.length === 0) {
      console.log(
        'Not enough users, companies, or posts to seed comments. Seeding aborted.',
      );
      return;
    }

    const comments: Partial<CommentDocument>[] = [];

    for (let i = 0; i < count; i++) {
      const isUser = faker.datatype.boolean();
      const author = isUser
        ? faker.helpers.arrayElement(users)
        : faker.helpers.arrayElement(companies);
      const authorType = isUser ? 'User' : 'Company';
      const post = faker.helpers.arrayElement(posts);

      const tags =
        faker.datatype.boolean() && users.length > 0
          ? faker.helpers
              .arrayElements(users, faker.number.int({ min: 0, max: 3 }))
              .map((user) => user._id)
          : [];

      const replies = Array.from(
        { length: faker.number.int({ min: 0, max: 3 }) },
        () => {
          const isReplyUser = faker.datatype.boolean();
          const replyAuthor = isReplyUser
            ? faker.helpers.arrayElement(users)
            : faker.helpers.arrayElement(companies);
          const replyTags =
            faker.datatype.boolean() && users.length > 0
              ? faker.helpers
                  .arrayElements(users, faker.number.int({ min: 0, max: 2 }))
                  .map((user) => user._id)
              : [];

          return {
            author_type: isReplyUser ? 'User' : 'Company',
            author: replyAuthor._id,
            content: faker.lorem.sentence(),
            reacts: [],
            tags: replyTags,
          };
        },
      );

      const reacts = Array.from(
        { length: faker.number.int({ min: 0, max: 5 }) },
        () => {
          const isReactUser = faker.datatype.boolean();
          const reactingUser = isReactUser
            ? faker.helpers.arrayElement(users)
            : faker.helpers.arrayElement(companies);

          return {
            user_type: isReactUser ? 'User' : 'Company',
            user: reactingUser._id,
            type: faker.helpers.arrayElement(['like', 'love', 'laugh', 'clap']),
          };
        },
      );

      comments.push({
        author_type: authorType,
        author: author._id,
        post: post._id,
        replies,
        reacts,
        tags,
      });
    }

    await this.commentModel.insertMany(comments);
    console.log(`${count} comments seeded successfully!`);
  }

  async clearComments(): Promise<void> {
    await this.commentModel.deleteMany({});
    console.log('Comments collection cleared.');
  }
}