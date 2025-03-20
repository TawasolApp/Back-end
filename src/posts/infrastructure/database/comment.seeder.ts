import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Comment, CommentDocument } from './comment.schema';
import {
  User,
  UserDocument,
} from '../../../users/infrastructure/database/user.schema';
import {
  Company,
  CompanyDocument,
} from '../../../companies/infrastructure/database/company.schema';
import {
  Post,
  PostDocument,
} from '../../../posts/infrastructure/database/post.schema';
import { faker } from '@faker-js/faker';
import { React, ReactDocument } from './react.schema'; // Import React schema

@Injectable()
export class CommentSeeder {
  constructor(
    @InjectModel(Comment.name) private commentModel: Model<CommentDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Company.name) private companyModel: Model<CompanyDocument>,
    @InjectModel(Post.name) private postModel: Model<PostDocument>,
    @InjectModel(React.name) private reactModel: Model<ReactDocument>, // Inject React model
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
            author_id: replyAuthor._id,
            content: faker.lorem.sentence(),
            reacts: [],
            tags: replyTags,
          };
        },
      );

      comments.push({
        author_type: authorType,
        author_id: author._id,
        post_id: post._id,
        replies,
        tags,
        react_count: 0,
        content: faker.lorem.sentence(),
        commented_at: faker.date.recent(),
      });
    }

    await this.commentModel.insertMany(comments);
    console.log(`${count} comments seeded successfully!`);
  }

  async updateCommentReactCounts(): Promise<void> {
    const comments = await this.commentModel.find().exec();
    for (const comment of comments) {
      const reactCount = await this.reactModel
        .countDocuments({ post_id: new Types.ObjectId(comment._id) })
        .exec();
      comment.react_count = reactCount;
      await comment.save();
    }
    console.log('Comment react counts updated.');
  }

  async clearComments(): Promise<void> {
    await this.commentModel.deleteMany({});
    console.log('Comments collection cleared.');
  }
}
