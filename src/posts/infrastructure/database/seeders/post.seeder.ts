import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Post, PostDocument } from '../schemas/post.schema';
import {
  Profile,
  ProfileDocument,
} from '../../../../profiles/infrastructure/database/schemas/profile.schema';
import {
  Company,
  CompanyDocument,
} from '../../../../companies/infrastructure/database/schemas/company.schema';
import { faker } from '@faker-js/faker';
import { React, ReactDocument } from '../schemas/react.schema';
import { Comment, CommentDocument } from '../schemas/comment.schema';

@Injectable()
export class PostSeeder {
  constructor(
    @InjectModel(Post.name) private postModel: Model<PostDocument>,
    @InjectModel(Profile.name) private profileModel: Model<ProfileDocument>,
    @InjectModel(Company.name) private companyModel: Model<CompanyDocument>,
    @InjectModel(React.name) private reactModel: Model<ReactDocument>,
    @InjectModel(Comment.name) private commentModel: Model<CommentDocument>,
  ) {}

  async seedPosts(count: number): Promise<void> {
    const users = await this.profileModel.find().select('_id').lean();
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
        react_count: {
          Like: 0,
          Love: 0,
          Funny: 0,
          Celebrate: 0,
          Insightful: 0,
          Support: 0,
        },
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

  // Seed reposts by referencing ONLY public posts as parent_post_id
  async seedReposts(count: number): Promise<void> {
    const publicPosts = await this.postModel
      .find({ visibility: 'Public' })
      .select('_id')
      .lean();

    const users = await this.profileModel.find().select('_id').lean();
    const companies = await this.companyModel.find().select('_id').lean();

    if (
      publicPosts.length === 0 ||
      (users.length === 0 && companies.length === 0)
    ) {
      console.log('Not enough public posts or creators to seed reposts.');
      return;
    }

    const reposts: Partial<PostDocument>[] = [];

    for (let i = 0; i < count; i++) {
      const isUser = faker.datatype.boolean();
      const author = isUser
        ? faker.helpers.arrayElement(users)
        : faker.helpers.arrayElement(companies);

      const parentPost = faker.helpers.arrayElement(publicPosts);
      parentPost.share_count++;
      parentPost.save();

      const tags =
        faker.datatype.boolean() && users.length > 0
          ? faker.helpers
              .arrayElements(users, faker.number.int({ min: 0, max: 3 }))
              .map((user) => user._id)
          : [];

      reposts.push({
        author_type: isUser ? 'User' : 'Company',
        author_id: author._id,
        parent_post_id: parentPost._id,
        text: faker.lorem.sentence(), // Optional commentary
        media: faker.datatype.boolean() ? [faker.image.url()] : [],
        react_count: {
          Like: 0,
          Love: 0,
          Funny: 0,
          Celebrate: 0,
          Insightful: 0,
          Support: 0,
        },
        comment_count: 0,
        share_count: 0,
        tags,
        visibility: faker.helpers.arrayElement([
          'Public',
          'Connections',
          'Private',
        ]),
        is_silent_repost: faker.datatype.boolean(), // Randomly decide if it's a silent repost
      });
    }

    await this.postModel.insertMany(reposts);
    console.log(
      `${count} reposts (for public posts only) seeded successfully!`,
    );
  }

  async clearPosts(): Promise<void> {
    await this.postModel.deleteMany({});
    console.log('Posts collection cleared.');
  }

  async updatePostCounts() {
    const posts = await this.postModel.find().exec();
    for (const post of posts) {
      const reacts = await this.reactModel.find({ post_id: post._id }).exec();

      // Reset react counts
      post.react_count = {
        Like: 0,
        Love: 0,
        Funny: 0,
        Celebrate: 0,
        Insightful: 0,
        Support: 0,
      };

      // Update react counts
      for (const react of reacts) {
        post.react_count[react.react_type]++;
      }
      console.log(post);
      console.log(post.react_count);

      // Mark react_count as modified and save the post
      post.markModified('react_count');
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
