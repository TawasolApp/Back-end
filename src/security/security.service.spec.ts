import { Test, TestingModule } from '@nestjs/testing';
import { SecurityService } from './security.service';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ReportedType, ReportRequestDto } from './dto/report-request.dto';
import { Types } from 'mongoose';
import { Report } from '../admin/infrastructure/database/schemas/report.schema';
import { Job } from '../jobs/infrastructure/database/schemas/job.schema';
import { ReportDocument } from '../admin/infrastructure/database/schemas/report.schema';
import { JobDocument } from '../jobs/infrastructure/database/schemas/job.schema';
import { InternalServerErrorException } from '@nestjs/common';

describe('SecurityService', () => {
  let service: SecurityService;
  let reportModel: Model<ReportDocument>;
  let jobModel: Model<JobDocument>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SecurityService,
        {
          provide: getModelToken(Report.name),
          useValue: {
            create: jest.fn().mockImplementation(() => ({
              _id: new Types.ObjectId(),
              user_id: new Types.ObjectId(),
              reported_id: new Types.ObjectId(),
              reported_type: ReportedType.User,
              reason: 'test',
              status: 'Pending',
              reported_at: new Date(),
            })),
          },
        },
        {
          provide: getModelToken(Job.name),
          useValue: {
            findByIdAndUpdate: jest.fn().mockImplementation(() => ({
              _id: new Types.ObjectId(),
              is_flagged: true,
            })),
          },
        },
      ],
    }).compile();

    service = module.get<SecurityService>(SecurityService);
    reportModel = module.get<Model<ReportDocument>>(getModelToken(Report.name));
    jobModel = module.get<Model<JobDocument>>(getModelToken(Job.name));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createReport', () => {
    it('should create a report with correct parameters', async () => {
      const mockUserId = new Types.ObjectId();
      const mockReportRequest: ReportRequestDto = {
        reportedId: '5f8d0a3e7f4f3b2e1c9d8e7f',
        reportedType: ReportedType.User,
        reason: 'Inappropriate behavior',
      };

      const reportSpy = jest.spyOn(reportModel, 'create');

      await service.createReport(mockUserId, mockReportRequest);

      expect(reportSpy).toHaveBeenCalledWith({
        _id: expect.any(Types.ObjectId),
        user_id: mockUserId,
        reported_id: new Types.ObjectId(mockReportRequest.reportedId),
        reported_type: mockReportRequest.reportedType,
        reason: mockReportRequest.reason,
        status: 'Pending',
        reported_at: expect.any(Date),
      });
    });

    it('should handle invalid reportedId format', async () => {
      const mockUserId = new Types.ObjectId();
      const invalidReportRequest: ReportRequestDto = {
        reportedId: 'invalid-id',
        reportedType: ReportedType.User,
        reason: 'Test reason',
      };

      await expect(
        service.createReport(mockUserId, invalidReportRequest),
      ).rejects.toThrow();
    });

    it('should throw InternalServerErrorException when report creation fails', async () => {
      const mockUserId = new Types.ObjectId();
      const mockReportRequest: ReportRequestDto = {
        reportedId: '5f8d0a3e7f4f3b2e1c9d8e7f',
        reportedType: ReportedType.User,
        reason: 'Inappropriate behavior',
      };

      jest
        .spyOn(reportModel, 'create')
        .mockRejectedValueOnce(new InternalServerErrorException('DB Error'));

      await expect(
        service.createReport(mockUserId, mockReportRequest),
      ).rejects.toThrow(InternalServerErrorException);
    });
    it('should throw InternalServerErrorException when create returns null', async () => {
      const mockUserId = new Types.ObjectId();
      const mockReportRequest: ReportRequestDto = {
        reportedId: '5f8d0a3e7f4f3b2e1c9d8e7f',
        reportedType: ReportedType.User,
        reason: 'Inappropriate behavior',
      };

      jest.spyOn(reportModel, 'create').mockResolvedValueOnce(null as any);

      await expect(
        service.createReport(mockUserId, mockReportRequest),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('reportJob', () => {
    it('should update job is_flagged to true', async () => {
      const mockJobId = new Types.ObjectId();
      const updateSpy = jest.spyOn(jobModel, 'findByIdAndUpdate');

      await service.reportJob(mockJobId);

      expect(updateSpy).toHaveBeenCalledWith(
        mockJobId,
        { is_flagged: true },
        { new: true },
      );
    });

    it('should throw InternalServerErrorException when job update fails', async () => {
      const mockJobId = new Types.ObjectId();

      jest
        .spyOn(jobModel, 'findByIdAndUpdate')
        .mockRejectedValueOnce(new InternalServerErrorException('DB Error'));

      await expect(service.reportJob(mockJobId)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
    it('should throw InternalServerErrorException when findByIdAndUpdate returns null', async () => {
      const mockJobId = new Types.ObjectId();

      jest.spyOn(jobModel, 'findByIdAndUpdate').mockResolvedValueOnce(null);

      await expect(service.reportJob(mockJobId)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });
});
