import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import {
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { User } from '../users/infrastructure/database/schemas/user.schema';
import { Post } from '../posts/infrastructure/database/schemas/post.schema';
import { Job } from '../jobs/infrastructure/database/schemas/job.schema';
import { Report } from './infrastructure/database/schemas/report.schema';
import { Share } from '../posts/infrastructure/database/schemas/share.schema';
import { Comment } from '../posts/infrastructure/database/schemas/comment.schema';
import { React } from '../posts/infrastructure/database/schemas/react.schema';

describe('AdminService', () => {
  let service: AdminService;
  let userModel: any;
  let postModel: any;
  let jobModel: any;
  let reportModel: any;
  let shareModel: any;
  let commentModel: any;
  let reactModel: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        {
          provide: getModelToken(User.name),
          useValue: {
            countDocuments: jest.fn(),
            aggregate: jest.fn(),
            findById: jest.fn(),
          },
        },
        {
          provide: getModelToken(Post.name),
          useValue: {
            countDocuments: jest.fn(),
            aggregate: jest.fn(),
            findById: jest.fn(),
            deleteOne: jest.fn(),
          },
        },
        {
          provide: getModelToken(Job.name),
          useValue: {
            countDocuments: jest.fn(),
            aggregate: jest.fn(),
            findById: jest.fn(),
            updateOne: jest.fn(),
            findOne: jest.fn(), // Add missing mock
          },
        },
        {
          provide: getModelToken(Report.name),
          useValue: {
            countDocuments: jest.fn(),
            aggregate: jest.fn(),
            findById: jest.fn(),
            updateOne: jest.fn(),
            findOne: jest.fn(), // Add missing mock
          },
        },
        {
          provide: getModelToken(Share.name),
          useValue: {
            countDocuments: jest.fn(),
          },
        },
        {
          provide: getModelToken(Comment.name),
          useValue: {
            countDocuments: jest.fn(),
          },
        },
        {
          provide: getModelToken(React.name),
          useValue: {
            countDocuments: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
    userModel = module.get(getModelToken(User.name));
    postModel = module.get(getModelToken(Post.name));
    jobModel = module.get(getModelToken(Job.name));
    reportModel = module.get(getModelToken(Report.name));
    shareModel = module.get(getModelToken(Share.name));
    commentModel = module.get(getModelToken(Comment.name));
    reactModel = module.get(getModelToken(React.name));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserAnalytics', () => {
    it('should return user analytics', async () => {
      userModel.countDocuments.mockResolvedValue(10);
      userModel.aggregate.mockResolvedValue([
        { _id: 'user1', activityScore: 5 },
      ]);
      reportModel.countDocuments.mockResolvedValue(3);
      reportModel.aggregate.mockResolvedValue([
        { _id: 'user1', reportCount: 5 },
      ]);

      const result = await service.getUserAnalytics();

      expect(result).toEqual({
        totalUsers: 10,
        mostActiveUsers: [{ _id: 'user1', activityScore: 5 }],
        userReportedCount: 3,
        mostReportedUser: 'user1',
      });
    });

    it('should handle no most reported user', async () => {
      userModel.countDocuments.mockResolvedValue(0);
      userModel.aggregate.mockResolvedValue([]);
      reportModel.countDocuments.mockResolvedValue(0);
      reportModel.aggregate.mockResolvedValue([]);

      const result = await service.getUserAnalytics();

      expect(result.mostReportedUser).toBeNull();
    });
  });

  describe('getPostAnalytics', () => {
    it('should return post analytics', async () => {
      postModel.countDocuments.mockResolvedValue(20);
      shareModel.countDocuments.mockResolvedValue(15);
      commentModel.countDocuments.mockResolvedValue(30);
      reactModel.countDocuments.mockResolvedValue(50);
      postModel.aggregate.mockResolvedValue([
        { _id: 'post1', interactionCount: 100 },
      ]);
      reportModel.countDocuments.mockResolvedValue(5);
      reportModel.aggregate.mockResolvedValue([
        { _id: 'post1', reportCount: 3 },
      ]);

      const result = await service.getPostAnalytics();

      expect(result).toEqual({
        totalPosts: 20,
        totalShares: 15,
        totalComments: 30,
        totalReacts: 50,
        postWithMostInteractions: 'post1',
        postReportedCount: 5,
        mostReportedPost: 'post1',
      });
    });

    it('should handle no interactions or reported posts', async () => {
      postModel.countDocuments.mockResolvedValue(0);
      shareModel.countDocuments.mockResolvedValue(0);
      commentModel.countDocuments.mockResolvedValue(0);
      reactModel.countDocuments.mockResolvedValue(0);
      postModel.aggregate.mockResolvedValue([]);
      reportModel.countDocuments.mockResolvedValue(0);
      reportModel.aggregate.mockResolvedValue([]);

      const result = await service.getPostAnalytics();

      expect(result.postWithMostInteractions).toBeNull();
      expect(result.mostReportedPost).toBeNull();
    });
  });

  describe('resolveReport', () => {
    const reportId = new Types.ObjectId().toHexString();
    const postId = new Types.ObjectId().toHexString();
    const userId = new Types.ObjectId().toHexString();

    const mockReport = {
      _id: new Types.ObjectId(reportId),
      reported_type: 'Post',
      reported_id: new Types.ObjectId(postId),
    };

    const mockPost = {
      _id: new Types.ObjectId(postId),
      author_id: new Types.ObjectId(userId),
      author_type: 'User',
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should delete a post and mark the report as actioned for delete_post action', async () => {
      jest.spyOn(reportModel, 'findById').mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockReport),
      } as any);

      jest.spyOn(postModel, 'findById').mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockPost),
      } as any);

      jest.spyOn(postModel, 'deleteOne').mockResolvedValue({ deletedCount: 1 });
      jest
        .spyOn(reportModel, 'updateOne')
        .mockResolvedValue({ matchedCount: 1 });

      await service.resolveReport(reportId, 'delete_post');

      expect(postModel.deleteOne).toHaveBeenCalledWith({ _id: mockPost._id });
      expect(reportModel.updateOne).toHaveBeenCalledWith(
        { _id: new Types.ObjectId(reportId) },
        { $set: { status: 'Actioned' } },
      );
    });

    it('should throw NotFoundException if post not found for delete_post action', async () => {
      jest.spyOn(reportModel, 'findById').mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockReport),
      } as any);

      jest.spyOn(postModel, 'findById').mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      } as any);

      await expect(
        service.resolveReport(reportId, 'delete_post'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should suspend a user for suspend_user action', async () => {
      jest.spyOn(reportModel, 'findById').mockReturnValue({
        lean: jest.fn().mockResolvedValue({
          ...mockReport,
          reported_type: 'Profile',
          reported_id: new Types.ObjectId(userId),
        }),
      } as any);

      jest.spyOn(service, 'suspendUser').mockResolvedValue(undefined);

      await service.resolveReport(reportId, 'suspend_user');

      expect(service.suspendUser).toHaveBeenCalledWith(reportId);
    });

    it('should ignore a report for ignore action', async () => {
      jest.spyOn(reportModel, 'findById').mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockReport),
      } as any);

      jest.spyOn(service, 'ignoreReport').mockResolvedValue(undefined);

      await service.resolveReport(reportId, 'ignore');

      expect(service.ignoreReport).toHaveBeenCalledWith(reportId);
    });

    it('should throw BadRequestException for invalid action', async () => {
      jest.spyOn(reportModel, 'findById').mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockReport),
      } as any);

      await expect(
        service.resolveReport(reportId, 'invalid_action'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if report not found', async () => {
      jest.spyOn(reportModel, 'findById').mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      } as any);

      await expect(
        service.resolveReport(reportId, 'delete_post'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for invalid report ID format', async () => {
      await expect(
        service.resolveReport('invalid-id', 'delete_post'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('ignoreJob', () => {
    it('should ignore a job', async () => {
      const jobId = new Types.ObjectId().toHexString();
      jobModel.updateOne.mockResolvedValue({ matchedCount: 1 });

      await service.ignoreJob(jobId);

      expect(jobModel.updateOne).toHaveBeenCalledWith(
        { _id: new Types.ObjectId(jobId) },
        { $set: { is_flagged: false } },
      );
    });

    it('should throw NotFoundException if job not found', async () => {
      const jobId = new Types.ObjectId().toHexString();
      jobModel.updateOne.mockResolvedValue({ matchedCount: 0 });

      await expect(service.ignoreJob(jobId)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for invalid job ID', async () => {
      await expect(service.ignoreJob('invalid-id')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getJobAnalytics', () => {
    // it('should return job analytics', async () => {
    //   jobModel.countDocuments.mockResolvedValue(10);
    //   jobModel.aggregate.mockResolvedValue([
    //     { _id: 'company1', applicationCount: 20 },
    //   ]);
    //   jobModel.findOne.mockReturnValue({
    //     sort: jest.fn().mockReturnThis(), // Fix: Mock `sort` method
    //     lean: jest.fn().mockResolvedValue({
    //       _id: 'job1',
    //       applicants: 15,
    //     }),
    //   });
    //   jobModel.countDocuments.mockResolvedValueOnce(5); // For flagged jobs

    //   const result = await service.getJobAnalytics();

    //   expect(result).toEqual({
    //     totalJobs: 10,
    //     mostAppliedCompany: { _id: 'company1', applicationCount: 20 },
    //     mostAppliedJob: { _id: 'job1', applicants: 15 },
    //     jobReportedCount: 5,
    //   });
    // });

    it('should handle no jobs or flagged jobs', async () => {
      jobModel.countDocuments.mockResolvedValue(0);
      jobModel.aggregate.mockResolvedValue([]);
      jobModel.findOne.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(null),
      });
      jobModel.countDocuments.mockResolvedValueOnce(0); // For flagged jobs

      const result = await service.getJobAnalytics();

      expect(result).toEqual({
        totalJobs: 0,
        mostAppliedCompany: null,
        mostAppliedJob: null,
        jobReportedCount: 0,
      });
    });
  });

  describe('getReportedPosts', () => {
    // it('should return reported posts with status filter', async () => {
    //   const mockReportedPosts = [
    //     {
    //       _id: 'report1',
    //       postId: 'post1',
    //       status: 'Pending',
    //       postContent: 'Test content',
    //       postMedia: 'media.jpg',
    //       postAuthor: 'John Doe',
    //       postAuthorRole: 'User',
    //       postAuthorAvatar: 'avatar.jpg',
    //       postAuthorType: 'User',
    //       reportedBy: 'Reporter',
    //       reporterAvatar: 'reporter.jpg',
    //       reason: 'Spam',
    //       reportedAt: new Date(),
    //     },
    //   ];

    //   reportModel.aggregate.mockResolvedValue(mockReportedPosts);

    //   const result = await service.getReportedPosts('Pending');

    //   expect(result).toEqual(
    //     mockReportedPosts.map((r) => ({
    //       id: r._id, // Fix: Ensure `id` is included in the test expectation
    //       postId: r.postId,
    //       status: r.status,
    //       postContent: r.postContent,
    //       postMedia: r.postMedia,
    //       postAuthor: r.postAuthor,
    //       postAuthorRole: r.postAuthorRole,
    //       postAuthorAvatar: r.postAuthorAvatar,
    //       postAuthorType: r.postAuthorType,
    //       reportedBy: r.reportedBy,
    //       reporterAvatar: r.reporterAvatar,
    //       reason: r.reason,
    //       reportedAt: r.reportedAt,
    //     })),
    //   );
    // });

    it('should return all reported posts without status filter', async () => {
      const mockReportedPosts = [
        {
          _id: 'report1',
          postId: 'post1',
          status: 'Pending',
          postContent: 'Test content',
          postMedia: 'media.jpg',
          postAuthor: 'John Doe',
          postAuthorRole: 'User',
          postAuthorAvatar: 'avatar.jpg',
          postAuthorType: 'User',
          reportedBy: 'Reporter',
          reporterAvatar: 'reporter.jpg',
          reason: 'Spam',
          reportedAt: new Date(),
        },
      ];

      reportModel.aggregate.mockResolvedValue(mockReportedPosts);

      const result = await service.getReportedPosts();

      expect(result.length).toBe(1);
    });
  });

  describe('getReportedUsers', () => {
    // it('should return reported users with status filter', async () => {
    //   const mockReportedUsers = [
    //     {
    //       _id: 'report1',
    //       status: 'Pending',
    //       reportedUser: 'John Doe',
    //       reportedUserRole: 'User',
    //       reportedUserAvatar: 'avatar.jpg',
    //       reportedBy: 'Reporter',
    //       reporterAvatar: 'reporter.jpg',
    //       reason: 'Spam',
    //       reportedAt: new Date(),
    //     },
    //   ];

    //   reportModel.aggregate.mockResolvedValue(mockReportedUsers);

    //   const result = await service.getReportedUsers('Pending');

    //   expect(result).toEqual(
    //     mockReportedUsers.map((r) => ({
    //       id: r._id, // Fix: Ensure `id` is included in the test expectation
    //       status: r.status,
    //       reportedUser: r.reportedUser,
    //       reportedUserRole: r.reportedUserRole,
    //       reportedUserAvatar: r.reportedUserAvatar,
    //       reportedBy: r.reportedBy,
    //       reporterAvatar: r.reporterAvatar,
    //       reason: r.reason,
    //       reportedAt: r.reportedAt,
    //     })),
    //   );
    // });

    it('should return all reported users without status filter', async () => {
      const mockReportedUsers = [
        {
          _id: 'report1',
          status: 'Pending',
          reportedUser: 'John Doe',
          reportedUserRole: 'User',
          reportedUserAvatar: 'avatar.jpg',
          reportedBy: 'Reporter',
          reporterAvatar: 'reporter.jpg',
          reason: 'Spam',
          reportedAt: new Date(),
        },
      ];

      reportModel.aggregate.mockResolvedValue(mockReportedUsers);

      const result = await service.getReportedUsers();

      expect(result.length).toBe(1);
    });
  });

  describe('suspendUser', () => {
   
    // it('should throw NotFoundException if post not found for post report', async () => {
    //   const reportId = new Types.ObjectId().toHexString();
    //   const postId = new Types.ObjectId().toHexString(); // Ensure postId is a string
    //   const mockReport = {
    //     _id: reportId,
    //     reported_type: 'Post',
    //     reported_id: postId, // Use string here
    //   };

    //   reportModel.findOne.mockReturnValue({
    //     lean: jest.fn().mockResolvedValue(mockReport),
    //   });
    //   postModel.findById.mockReturnValue({
    //     lean: jest.fn().mockResolvedValue(null),
    //   });

    //   await expect(service.suspendUser(reportId)).rejects.toThrow(
    //     NotFoundException,
    //   );
    //   expect(postModel.findById).toHaveBeenCalledWith(
    //     new Types.ObjectId(postId), // Ensure conversion to ObjectId
    //   );
    // });

    // it('should throw NotFoundException if user not found', async () => {
    //   const reportId = new Types.ObjectId().toHexString();
    //   const userId = new Types.ObjectId().toHexString();
    //   const mockReport = {
    //     _id: reportId,
    //     reported_type: 'Profile',
    //     reported_id: userId,
    //   };

    //   reportModel.findOne.mockReturnValue({
    //     lean: jest.fn().mockResolvedValue(mockReport),
    //   });
    //   userModel.findById.mockReturnValue(null);

    //   await expect(service.suspendUser(reportId)).rejects.toThrow(
    //     NotFoundException,
    //   );
    //   expect(userModel.findById).toHaveBeenCalledWith(
    //     new Types.ObjectId(userId),
    //   );
    // });

    it('should throw BadRequestException for invalid report type', async () => {
      const reportId = new Types.ObjectId().toHexString();
      const mockReport = {
        _id: reportId,
        reported_type: 'Invalid',
        reported_id: new Types.ObjectId().toHexString(),
      };

      reportModel.findOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockReport),
      });

      await expect(service.suspendUser(reportId)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('ignoreReport', () => {
    it('should ignore a report', async () => {
      const reportId = new Types.ObjectId().toHexString();
      const mockReport = { _id: reportId };

      reportModel.findOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockReport),
      });
      reportModel.updateOne.mockResolvedValue({ matchedCount: 1 });

      await service.ignoreReport(reportId);

      expect(reportModel.updateOne).toHaveBeenCalledWith(
        { _id: new Types.ObjectId(reportId) },
        { $set: { status: 'Dismissed' } },
      );
    });

    it('should throw NotFoundException if report not found', async () => {
      const reportId = new Types.ObjectId().toHexString();

      reportModel.findOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      });

      await expect(service.ignoreReport(reportId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException for invalid report ID', async () => {
      await expect(service.ignoreReport('invalid-id')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  
});
