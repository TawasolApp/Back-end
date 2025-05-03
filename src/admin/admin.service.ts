import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  User,
  UserDocument,
} from '../users/infrastructure/database/schemas/user.schema';
import {
  Post,
  PostDocument,
} from '../posts/infrastructure/database/schemas/post.schema';
import {
  Job,
  JobDocument,
} from '../jobs/infrastructure/database/schemas/job.schema';
import {
  Report,
  ReportDocument,
} from './infrastructure/database/schemas/report.schema';
import { ReportedPostsDto } from './dtos/reported-posts.dto';
import { ReportedUsersDto } from './dtos/reported-users.dto';
import {
  Share,
  ShareDocument,
} from '../posts/infrastructure/database/schemas/share.schema';
import {
  Comment,
  CommentDocument,
} from '../posts/infrastructure/database/schemas/comment.schema';
import {
  React,
  ReactDocument,
} from '../posts/infrastructure/database/schemas/react.schema';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Post.name) private readonly postModel: Model<PostDocument>,
    @InjectModel(Job.name) private readonly jobModel: Model<JobDocument>,
    @InjectModel(Report.name)
    private readonly reportModel: Model<ReportDocument>,
    @InjectModel(Share.name) private readonly shareModel: Model<ShareDocument>,
    @InjectModel(Comment.name)
    private readonly commentModel: Model<CommentDocument>,
    @InjectModel(React.name) private readonly reactModel: Model<ReactDocument>,
  ) {}

  /**
   * Retrieves user analytics, including total users, most active users, and reported user statistics.
   * @returns An object containing user analytics data.
   */
  async getUserAnalytics() {
    const thirtyDaysAgo = new Date(
      new Date().setDate(new Date().getDate() - 30),
    );

    const totalUsers = await this.userModel.countDocuments();

    const mostActiveUsers = await this.userModel.aggregate([
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
    ]);

    const userReportedCount = await this.reportModel.countDocuments({
      reported_type: 'Profile',
      reported_at: { $gte: thirtyDaysAgo },
    });

    const mostReportedUser = await this.reportModel.aggregate([
      { $match: { reported_type: 'Profile' } },
      {
        $group: {
          _id: '$reported_id',
          reportCount: { $sum: '$report_count' },
        },
      },
      { $sort: { reportCount: -1 } },
      { $limit: 1 },
    ]);

    return {
      totalUsers,
      mostActiveUsers,
      userReportedCount,
      mostReportedUser: mostReportedUser[0]?._id || null,
    };
  }

  /**
   * Retrieves post analytics, including total posts, interactions, and reported post statistics.
   * @returns An object containing post analytics data.
   */
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

    const postWithMostInteractions = await this.postModel.aggregate([
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
    ]);

    const postReportedCount = await this.reportModel.countDocuments({
      reported_type: 'Post',
      reported_at: { $gte: thirtyDaysAgo },
    });

    const mostReportedPost = await this.reportModel.aggregate([
      { $match: { reported_type: 'Post' } },
      {
        $group: {
          _id: '$reported_id',
          reportCount: { $sum: '$report_count' },
        },
      },
      { $sort: { reportCount: -1 } },
      { $limit: 1 },
    ]);

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

  /**
   * Retrieves job analytics, including total jobs, most applied jobs, and flagged job statistics.
   * @returns An object containing job analytics data.
   */
  async getJobAnalytics() {
    const totalJobs = await this.jobModel.countDocuments();
    const mostAppliedCompany = await this.jobModel.aggregate([
      {
        $group: {
          _id: '$company_id',
          applicationCount: { $sum: '$applicants' },
        },
      },
      { $sort: { applicationCount: -1 } },
      { $limit: 1 },
    ]);
    const mostAppliedJob = await this.jobModel
      .findOne()
      .sort({ applicants: -1 })
      .lean();
    const jobReportedCount = await this.jobModel.countDocuments({
      is_flagged: true,
    });

    return {
      totalJobs,
      mostAppliedCompany: mostAppliedCompany[0] || null,
      mostAppliedJob,
      jobReportedCount,
    };
  }

  /**
   * Marks a flagged job as ignored.
   * @param jobId - The ID of the job to ignore.
   * @throws BadRequestException if the job ID is invalid.
   * @throws NotFoundException if the job is not found.
   */
  async ignoreJob(jobId: string): Promise<void> {
    if (!Types.ObjectId.isValid(jobId)) {
      throw new BadRequestException('Invalid job ID format.');
    }

    const result = await this.jobModel.updateOne(
      { _id: new Types.ObjectId(jobId) },
      { $set: { is_flagged: false } },
    );

    if (result.matchedCount === 0) {
      throw new NotFoundException('Job not found.');
    }
  }

  /**
   * Retrieves reported posts with optional status filtering.
   * @param status - The status to filter reported posts by.
   * @returns A list of reported posts.
   */
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
      {
        $lookup: {
          from: 'Users',
          localField: 'authorProfile._id',
          foreignField: '_id',
          as: 'authorUser',
        },
      },
      {
        $lookup: {
          from: 'Companies',
          localField: 'post.author_id',
          foreignField: '_id',
          as: 'authorCompany',
        },
      },
      {
        $addFields: {
          authorDetails: {
            $cond: {
              if: { $eq: ['$post.author_type', 'User'] },
              then: {
                profile: { $arrayElemAt: ['$authorProfile', 0] },
                user: { $arrayElemAt: ['$authorUser', 0] },
              },
              else: { company: { $arrayElemAt: ['$authorCompany', 0] } },
            },
          },
        },
      },
      {
        $lookup: {
          from: 'Users',
          localField: 'user_id',
          foreignField: '_id',
          as: 'reporterUser',
        },
      },
      { $unwind: '$reporterUser' },
      {
        $project: {
          id: '$_id',
          postId: '$post._id',
          status: 1,
          postContent: '$post.text',
          postMedia: { $arrayElemAt: ['$post.media', 0] },
          postAuthor: {
            $cond: {
              if: { $eq: ['$post.author_type', 'User'] },
              then: {
                $concat: [
                  '$authorDetails.profile.first_name',
                  ' ',
                  '$authorDetails.profile.last_name',
                ],
              },
              else: '$authorDetails.company.name',
            },
          },
          postAuthorRole: {
            $cond: {
              if: { $eq: ['$post.author_type', 'User'] },
              then: '$authorDetails.user.role',
              else: 'Company',
            },
          },
          postAuthorAvatar: {
            $cond: {
              if: { $eq: ['$post.author_type', 'User'] },
              then: '$authorDetails.profile.profile_picture',
              else: '$authorDetails.company.logo',
            },
          },
          postAuthorType: '$post.author_type',
          reportedBy: {
            $concat: [
              '$reporterUser.first_name',
              ' ',
              '$reporterUser.last_name',
            ],
          },
          reporterAvatar: '$reporterUser.profile_picture',
          reason: 1,
          reportedAt: '$reported_at',
        },
      },
    ]);

    return reportedPosts.map((report) => ({
      id: report.id,
      postId: report.postId,
      status: report.status,
      postContent: report.postContent,
      postMedia: report.postMedia,
      postAuthor: report.postAuthor,
      postAuthorRole: report.postAuthorRole,
      postAuthorAvatar: report.postAuthorAvatar,
      postAuthorType: report.postAuthorType,
      reportedBy: report.reportedBy,
      reporterAvatar: report.reporterAvatar,
      reason: report.reason,
      reportedAt: report.reportedAt,
    }));
  }

  /**
   * Retrieves reported users with optional status filtering.
   * @param status - The status to filter reported users by.
   * @returns A list of reported users.
   */
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

  /**
   * Suspends a user based on a report.
   * @param reportId - The ID of the report.
   * @throws NotFoundException if the report, post, or user is not found.
   * @throws BadRequestException if the report type is invalid.
   */
  async suspendUser(reportId: string): Promise<void> {
    const report = await this.reportModel
      .findOne({ _id: new Types.ObjectId(reportId) })
      .lean();

    if (!report) {
      throw new NotFoundException('Report not found.');
    }

    let userId: Types.ObjectId;

    if (report.reported_type === 'Profile') {
      userId = new Types.ObjectId(report.reported_id);
    } else if (report.reported_type === 'Post') {
      const post = await this.postModel.findById(report.reported_id).lean();

      if (!post) {
        throw new NotFoundException('Post not found.');
      }

      userId = new Types.ObjectId(post.author_id);
    } else {
      throw new BadRequestException(
        'Invalid report type. Only profiles or posts can be used to suspend users.',
      );
    }

    const user = await this.userModel.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    user.is_suspended = true;
    user.suspension_end_date = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    await user.save();

    await this.reportModel.updateOne(
      { _id: new Types.ObjectId(reportId) },
      { $set: { status: 'Actioned' } },
    );
  }

  /**
   * Ignores a report by marking it as dismissed.
   * @param reportId - The ID of the report.
   * @throws BadRequestException if the report ID is invalid.
   * @throws NotFoundException if the report is not found.
   */
  async ignoreReport(reportId: string): Promise<void> {
    if (!Types.ObjectId.isValid(reportId)) {
      throw new BadRequestException('Invalid report ID format.');
    }

    const report = await this.reportModel
      .findOne({ _id: new Types.ObjectId(reportId) })
      .lean();

    if (!report) {
      throw new NotFoundException('Report not found.');
    }

    await this.reportModel.updateOne(
      { _id: new Types.ObjectId(reportId) },
      { $set: { status: 'Dismissed' } },
    );
  }

  /**
   * Resolves a report by performing the specified action.
   * @param reportId - The ID of the report.
   * @param action - The action to perform (delete_post, suspend_user, ignore).
   * @throws BadRequestException if the report ID or action is invalid.
   * @throws NotFoundException if the report or related entities are not found.
   */
  async resolveReport(reportId: string, action: string): Promise<void> {
    if (!Types.ObjectId.isValid(reportId)) {
      throw new BadRequestException('Invalid report ID format.');
    }

    const report = await this.reportModel
      .findById(new Types.ObjectId(reportId))
      .lean();

    if (!report) {
      throw new NotFoundException('Report not found.');
    }

    if (action === 'delete_post') {
      const post = await this.postModel.findById(report.reported_id).lean();
      if (!post) {
        throw new NotFoundException('Post not found.');
      }

      await this.postModel.deleteOne({ _id: post._id });

      await this.reportModel.updateOne(
        { _id: new Types.ObjectId(reportId) },
        { $set: { status: 'Actioned' } },
      );
    } else if (action === 'suspend_user') {
      await this.suspendUser(reportId);
    } else if (action === 'ignore') {
      await this.ignoreReport(reportId);
    } else {
      throw new BadRequestException('Invalid action.');
    }
  }
}
