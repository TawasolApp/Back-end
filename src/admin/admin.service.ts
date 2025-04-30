import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User } from '../users/infrastructure/database/schemas/user.schema';
import { Post } from '../posts/infrastructure/database/schemas/post.schema';
import {
  Job,
  JobDocument,
} from '../jobs/infrastructure/database/schemas/job.schema';
import { Report } from './infrastructure/database/schemas/report.schema';
import { ReportedPostsDto } from './dtos/reported-posts.dto';
import { ReportedUsersDto } from './dtos/reported-users.dto';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(Post.name) private readonly postModel: Model<Post>,
    @InjectModel(Job.name) private readonly jobModel: Model<JobDocument>,
    @InjectModel('Share') private readonly shareModel: Model<any>,
    @InjectModel('Comment') private readonly commentModel: Model<any>,
    @InjectModel('React') private readonly reactModel: Model<any>,
    @InjectModel(Report.name) private readonly reportModel: Model<Report>,
  ) {}

  async getUserAnalytics() {
    const thirtyDaysAgo = new Date(
      new Date().setDate(new Date().getDate() - 30),
    );

    const totalUsers = await this.userModel.countDocuments();

    const mostActiveUsers = await this.userModel
      .aggregate([
        {
          $lookup: {
            from: 'Posts',
            localField: '_id',
            foreignField: 'author_id',
            as: 'posts',
          },
        },
        {
          $lookup: {
            from: 'Reacts',
            localField: '_id',
            foreignField: 'user_id',
            as: 'reactions',
          },
        },
        {
          $lookup: {
            from: 'UserConnections',
            localField: '_id',
            foreignField: 'sending_party',
            as: 'connections',
          },
        },
        {
          $project: {
            userId: '$_id',
            activityScore: {
              $add: [
                { $size: '$posts' },
                { $size: '$reactions' },
                { $size: '$connections' },
              ],
            },
          },
        },
        { $sort: { activityScore: -1 } },
        { $limit: 5 },
      ])
      .exec();

    const userReportedCount = await this.reportModel.countDocuments({
      reported_type: 'Profile',
      reported_at: { $gte: thirtyDaysAgo },
    });

    const mostReportedUser = await this.reportModel
      .aggregate([
        { $match: { reported_type: 'Profile' } },
        {
          $group: {
            _id: '$reported_id',
            reportCount: { $sum: '$report_count' },
          },
        },
        { $sort: { reportCount: -1 } },
        { $limit: 1 },
      ])
      .exec();

    return {
      totalUsers,
      mostActiveUsers,
      userReportedCount,
      mostReportedUser: mostReportedUser[0]?._id || null,
    };
  }

  async getPostAnalytics() {
    const thirtyDaysAgo = new Date(
      new Date().setDate(new Date().getDate() - 30),
    );

    const totalPosts = await this.postModel.countDocuments({
      posted_at: { $gte: thirtyDaysAgo },
    });

    const totalShares = await this.shareModel.countDocuments({
      shared_at: { $gte: thirtyDaysAgo },
    });

    const totalComments = await this.commentModel.countDocuments({
      commented_at: { $gte: thirtyDaysAgo },
    });

    const totalReacts = await this.reactModel.countDocuments({
      reacted_at: { $gte: thirtyDaysAgo },
    });

    const postWithMostInteractions = await this.postModel
      .aggregate([
        {
          $project: {
            _id: 1,
            interactionCount: {
              $add: [
                '$comment_count',
                '$share_count',
                '$react_count.Like',
                '$react_count.Love',
                '$react_count.Funny',
                '$react_count.Celebrate',
                '$react_count.Insightful',
                '$react_count.Support',
              ],
            },
          },
        },
        { $sort: { interactionCount: -1 } },
        { $limit: 1 },
      ])
      .exec();

    const postReportedCount = await this.reportModel.countDocuments({
      reported_type: 'Post',
      reported_at: { $gte: thirtyDaysAgo },
    });

    const mostReportedPost = await this.reportModel
      .aggregate([
        { $match: { reported_type: 'Post' } },
        {
          $group: {
            _id: '$reported_id',
            reportCount: { $sum: '$report_count' },
          },
        },
        { $sort: { reportCount: -1 } },
        { $limit: 1 },
      ])
      .exec();

    return {
      totalPosts,
      totalShares,
      totalComments,
      totalReacts,
      postWithMostInteractions: postWithMostInteractions[0]?._id || null,
      postReportedCount,
      mostReportedPost: mostReportedPost[0]?._id || null,
    };
  }

  async getJobAnalytics() {
    const totalJobs = await this.jobModel.countDocuments();
    const mostAppliedCompany = await this.jobModel
      .aggregate([
        {
          $group: {
            _id: '$company_id',
            applicationCount: { $sum: '$applicants' },
          },
        },
        { $sort: { applicationCount: -1 } },
        { $limit: 1 },
      ])
      .exec();
    const mostAppliedJob = await this.jobModel
      .findOne()
      .sort({ applicants: -1 })
      .lean();
    const jobReportedCount = await this.jobModel.countDocuments({
      is_flagged: true,
    });

    return {
      totalJobs,
      mostAppliedCompany: mostAppliedCompany[0],
      mostAppliedJob,
      jobReportedCount,
    };
  }

  async ignoreJob(jobId: string): Promise<void> {
    const result = await this.jobModel.updateOne(
      { _id: new Types.ObjectId(jobId) },
      { $set: { is_flagged: false } },
    );

    if (result.matchedCount === 0) {
      throw new NotFoundException('Job not found.');
    }
  }

  async getReportedPosts(status?: string): Promise<ReportedPostsDto[]> {
    const matchStage: any = { reported_type: 'Post' };
    if (status) {
      matchStage.status = status;
    }

    const reportedPosts = await this.reportModel.aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: 'Posts',
          localField: 'reported_id',
          foreignField: '_id',
          as: 'post',
        },
      },
      { $unwind: '$post' },
      {
        $lookup: {
          from: 'Profiles',
          localField: 'post.author_id',
          foreignField: '_id',
          as: 'authorProfile',
        },
      },
      { $unwind: '$authorProfile' },
      {
        $lookup: {
          from: 'Users',
          localField: 'authorProfile._id',
          foreignField: '_id',
          as: 'authorUser',
        },
      },
      { $unwind: '$authorUser' },
      {
        $lookup: {
          from: 'Profiles',
          localField: 'user_id',
          foreignField: '_id',
          as: 'reporterProfile',
        },
      },
      { $unwind: '$reporterProfile' },
      {
        $lookup: {
          from: 'Users',
          localField: 'reporterProfile._id',
          foreignField: '_id',
          as: 'reporterUser',
        },
      },
      { $unwind: '$reporterUser' },
      {
        $project: {
          id: '$_id',
          status: 1,
          postContent: '$post.text',
          postMedia: { $arrayElemAt: ['$post.media', 0] },
          postAuthor: {
            $concat: [
              '$authorProfile.first_name',
              ' ',
              '$authorProfile.last_name',
            ],
          },
          postAuthorRole: '$authorUser.role',
          postAuthorAvatar: '$authorProfile.profile_picture',
          reportedBy: {
            $concat: [
              '$reporterProfile.first_name',
              ' ',
              '$reporterProfile.last_name',
            ],
          },
          reporterAvatar: '$reporterProfile.profile_picture',
          reason: 1,
          reportedAt: '$reported_at',
        },
      },
    ]);

    return reportedPosts.map((report) => ({
      id: report.id,
      status: report.status,
      postContent: report.postContent,
      postMedia: report.postMedia,
      postAuthor: report.postAuthor,
      postAuthorRole: report.postAuthorRole,
      postAuthorAvatar: report.postAuthorAvatar,
      reportedBy: report.reportedBy,
      reporterAvatar: report.reporterAvatar,
      reason: report.reason,
      reportedAt: report.reportedAt,
    }));
  }

  async getReportedUsers(status?: string): Promise<ReportedUsersDto[]> {
    const matchStage: any = { reported_type: 'Profile' };
    if (status) {
      matchStage.status = status;
    }

    const reportedUsers = await this.reportModel.aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: 'Profiles',
          localField: 'reported_id',
          foreignField: '_id',
          as: 'reportedUserProfile',
        },
      },
      { $unwind: '$reportedUserProfile' },
      {
        $lookup: {
          from: 'Users',
          localField: 'reportedUserProfile._id',
          foreignField: '_id',
          as: 'reportedUser',
        },
      },
      { $unwind: '$reportedUser' },
      {
        $lookup: {
          from: 'Profiles',
          localField: 'user_id',
          foreignField: '_id',
          as: 'reporterProfile',
        },
      },
      { $unwind: '$reporterProfile' },
      {
        $lookup: {
          from: 'Users',
          localField: 'reporterProfile._id',
          foreignField: '_id',
          as: 'reporterUser',
        },
      },
      { $unwind: '$reporterUser' },
      {
        $project: {
          id: '$_id',
          status: 1,
          reportedUser: {
            $concat: [
              '$reportedUserProfile.first_name',
              ' ',
              '$reportedUserProfile.last_name',
            ],
          },
          reportedUserRole: '$reportedUser.role',
          reportedUserAvatar: '$reportedUserProfile.profile_picture',
          reportedBy: {
            $concat: [
              '$reporterProfile.first_name',
              ' ',
              '$reporterProfile.last_name',
            ],
          },
          reporterAvatar: '$reporterProfile.profile_picture',
          reason: 1,
          reportedAt: '$reported_at',
        },
      },
    ]);

    return reportedUsers.map((report) => ({
      id: report.id,
      status: report.status,
      reportedUser: report.reportedUser,
      reportedUserRole: report.reportedUserRole,
      reportedUserAvatar: report.reportedUserAvatar,
      reportedBy: report.reportedBy,
      reporterAvatar: report.reporterAvatar,
      reason: report.reason,
      reportedAt: report.reportedAt,
    }));
  }
}
