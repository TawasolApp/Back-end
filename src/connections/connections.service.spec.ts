import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { mockProfiles, mockConnections } from './mock.data';
import { ConnectionsService } from './connections.service';
import { UserConnection } from './infrastructure/database/schemas/user-connection.schema';
import { Profile } from '../profiles/infrastructure/database/schemas/profile.schema';
import { User } from '../users/infrastructure/database/schemas/user.schema';
import { CompanyManager } from '../companies/infrastructure/database/schemas/company-manager.schema';
import { Company } from '../companies/infrastructure/database/schemas/company.schema';
import { PlanDetail } from '../payments/infrastructure/database/schemas/plan-detail.schema';
import { Notification } from '../notifications/infrastructure/database/schemas/notification.schema';
import { NotificationGateway } from '../gateway/notification.gateway';
import { ConnectionStatus } from './enums/connection-status.enum';
import { handleError } from '../common/utils/exception-handler';
import * as notificationHelpers from '../notifications/helpers/notification.helper';
import {
  getConnection,
  getFollow,
  getPending,
  getBlocked,
  getIgnored,
} from './helpers/connection-helpers';

jest.mock('../common/utils/exception-handler', () => ({
  handleError: jest.fn(),
}));

jest.mock('./helpers/connection-helpers', () => ({
  getBlocked: jest.fn(),
  getPending: jest.fn(),
  getConnection: jest.fn(),
  getIgnored: jest.fn(),
  getFollow: jest.fn(),
}));

describe('ConnectionsService', () => {
  let service: ConnectionsService;
  let userConnectionModel: any;
  let profileModel: any;

  const mockUserConnectionModel = {
    findOne: jest.fn(),
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
    save: jest.fn(),
  };

  const mockProfileModel = {
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn().mockReturnValue({
      lean: jest.fn().mockResolvedValue(undefined),
    }),
  };

  const mockCompanyModel = {
    findOne: jest.fn().mockReturnValue({
      lean: jest.fn().mockResolvedValue(undefined),
    }),
  };

  const mockCompanyManagerModel = {
    findOne: jest.fn().mockReturnValue({
      lean: jest.fn().mockResolvedValue(undefined),
    }),
  };

  const mockNotificationModel = Object.assign(
    jest.fn().mockImplementation(() => ({
      save: jest.fn(),
    })),
    {
      findOneAndDelete: jest.fn(),
    },
  );

  const mockNotificationGateway = {
    getClients: jest.fn().mockReturnValue(new Map()),
  };

  const mockUserModel = {
    findById: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(undefined),
      }),
    }),
  };

  const mockPlanDetailModel = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConnectionsService,
        {
          provide: getModelToken(UserConnection.name),
          useValue: mockUserConnectionModel,
        },
        {
          provide: getModelToken(Profile.name),
          useValue: mockProfileModel,
        },
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
        {
          provide: getModelToken(Company.name),
          useValue: mockCompanyModel,
        },
        {
          provide: getModelToken(CompanyManager.name),
          useValue: mockCompanyManagerModel,
        },
        {
          provide: getModelToken(PlanDetail.name),
          useValue: mockPlanDetailModel,
        },
        {
          provide: getModelToken(Notification.name),
          useValue: mockNotificationModel,
        },
        {
          provide: NotificationGateway,
          useValue: mockNotificationGateway,
        },
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
        {
          provide: getModelToken(PlanDetail.name),
          useValue: mockPlanDetailModel,
        },
      ],
    }).compile();

    service = module.get<ConnectionsService>(ConnectionsService);
    userConnectionModel = module.get(getModelToken(UserConnection.name));
    profileModel = module.get(getModelToken(Profile.name));
    jest.spyOn(notificationHelpers, 'addNotification').mockResolvedValue(null);
    jest
      .spyOn(notificationHelpers, 'deleteNotification')
      .mockResolvedValue(null);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
