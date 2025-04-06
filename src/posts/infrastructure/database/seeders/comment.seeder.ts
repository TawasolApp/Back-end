import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Comment, CommentDocument } from '../schemas/comment.schema';
import {
  Profile,
  ProfileDocument,
} from '../../../../profiles/infrastructure/database/schemas/profile.schema';
import {
  Company,
  CompanyDocument,
} from '../../../../companies/infrastructure/database/schemas/company.schema';
import { Post, PostDocument } from '../schemas/post.schema';
import { faker } from '@faker-js/faker';
import { React, ReactDocument } from '../schemas/react.schema';

@Injectable()
export class CommentSeeder {
  constructor(
    @InjectModel(Comment.name) private commentModel: Model<CommentDocument>,
    @InjectModel(Profile.name) private profileModel: Model<ProfileDocument>,
    @InjectModel(Company.name) private companyModel: Model<CompanyDocument>,
    @InjectModel(Post.name) private postModel: Model<PostDocument>,
    @InjectModel(React.name) private reactModel: Model<ReactDocument>,
  ) {}

  async seedComments(count: number): Promise<void> {
    const users = await this.profileModel.find().select('_id').lean();
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

      const replies = []; //TODO

      comments.push({
        author_type: authorType,
        author_id: author._id,
        post_id: post._id,
        replies,
        tags,
        react_count: {
          Like: 0,
          Love: 0,
          Funny: 0,
          Celebrate: 0,
          Insightful: 0,
          Support: 0,
        },
        content: faker.lorem.sentence(),
        commented_at: faker.date.recent(),
      });
    }

    await this.commentModel.insertMany(comments);
    console.log(`${count} comments seeded successfully!`);
  }

  async seedReplies(count: number): Promise<void> {
    const users = await this.profileModel.find().select('_id').lean();
    const companies = await this.companyModel.find().select('_id').lean();
    const comments = await this.commentModel.find().select('_id').lean();

    if (users.length === 0 || companies.length === 0 || comments.length === 0) {
      console.log(
        'Not enough users, companies, or comments to seed replies. Seeding aborted.',
      );
      return;
    }

    const replies: Partial<CommentDocument>[] = [];

    for (let i = 0; i < count; i++) {
      const isUser = faker.datatype.boolean();
      const author = isUser
        ? faker.helpers.arrayElement(users)
        : faker.helpers.arrayElement(companies);
      const authorType = isUser ? 'User' : 'Company';
      const parentComment = faker.helpers.arrayElement(comments);

      const tags =
        faker.datatype.boolean() && users.length > 0
          ? faker.helpers
              .arrayElements(users, faker.number.int({ min: 0, max: 3 }))
              .map((user) => user._id)
          : [];

      replies.push({
        author_type: authorType,
        author_id: author._id,
        post_id: parentComment._id, // Linking to a parent comment instead of a post
        replies: [],
        tags,
        react_count: {
          Like: 0,
          Love: 0,
          Funny: 0,
          Celebrate: 0,
          Insightful: 0,
          Support: 0,
        },
        content: faker.lorem.sentence(),
        commented_at: faker.date.recent(),
      });
    }

    await this.commentModel.insertMany(replies);
    console.log(`${count} replies seeded successfully!`);
  }
  
  async updateCommentReactCounts(): Promise<void> {
    const comments = await this.commentModel.find().exec();
    for (const comment of comments) {
      const reacts = await this.reactModel
        .find({ post_id: comment._id })
        .exec();

      // Reset react counts
      comment.react_count = {
        Like: 0,
        Love: 0,
        Funny: 0,
        Celebrate: 0,
        Insightful: 0,
        Support: 0,
      };

      // Update react counts
      for (const react of reacts) {
        comment.react_count[react.react_type]++;
      }
      console.log(comment);
      console.log(comment.react_count);

      // Mark react_count as modified and save the post
      comment.markModified('react_count');
      await comment.save();
    }
  }

  async updateCommentReplies(): Promise<void> {
    const comments = await this.commentModel.find().select('_id').lean();
    if (comments.length === 0) {
      console.log('No comments found to update replies.');
      return;
    }

    for (const comment of comments) {
      const replies = await this.commentModel
        .find({ post_id: comment._id }) // Find comments where post_id matches the current comment's ID
        .select('_id')
        .lean();

      if (replies.length > 0) {
        await this.commentModel.updateOne(
          { _id: comment._id },
          { $set: { replies: replies.map((reply) => reply._id) } },
        );
      }
    }

    console.log('Replies array of comments updated successfully!');
  }

  async clearComments(): Promise<void> {
    await this.commentModel.deleteMany({});
    console.log('Comments collection cleared.');
  }
}
