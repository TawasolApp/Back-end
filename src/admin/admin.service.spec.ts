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
          },
        },
        {
          provide: getModelToken(Report.name),
          useValue: {
            countDocuments: jest.fn(),
            aggregate: jest.fn(),
            findById: jest.fn(),
            updateOne: jest.fn(),
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

//   describe('resolveReport', () => {
//     const reportId = new Types.ObjectId().toHexString();
//     const postId = new Types.ObjectId().toHexString();

//     it('should delete a post and mark the report as actioned', async () => {
//       reportModel.findById.mockResolvedValue({
//         _id: reportId,
//         reported_type: 'Post',
//         reported_id: postId,
//       });
//       postModel.findById.mockResolvedValue({ _id: postId });
//       postModel.deleteOne.mockResolvedValue({ deletedCount: 1 });
//       reportModel.updateOne.mockResolvedValue({ matchedCount: 1 });

//       await service.resolveReport(reportId, 'delete_post');

//       expect(postModel.deleteOne).toHaveBeenCalledWith({ _id: postId });
//       expect(reportModel.updateOne).toHaveBeenCalledWith(
//         { _id: new Types.ObjectId(reportId) },
//         { $set: { status: 'Actioned' } },
//       );
//     });

//     it('should throw NotFoundException if post not found', async () => {
//       reportModel.findById.mockResolvedValue({
//         _id: reportId,
//         reported_type: 'Post',
//         reported_id: postId,
//       });
//       postModel.findById.mockResolvedValue(null);

//       await expect(
//         service.resolveReport(reportId, 'delete_post'),
//       ).rejects.toThrow(NotFoundException);
//     });

//     it('should throw BadRequestException for invalid action', async () => {
//       reportModel.findById.mockResolvedValue({ _id: reportId });

//       await expect(
//         service.resolveReport(reportId, 'invalid_action'),
//       ).rejects.toThrow(BadRequestException);
//     });

//     it('should throw NotFoundException if report not found', async () => {
//       reportModel.findById.mockResolvedValue(null);

//       await expect(
//         service.resolveReport(reportId, 'delete_post'),
//       ).rejects.toThrow(NotFoundException);
//     });
//   });

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
});
