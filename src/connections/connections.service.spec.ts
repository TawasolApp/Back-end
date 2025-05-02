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

  describe('searchUsers', () => {
    it('should return all 5 profiles when page = 1 and limit = 5', async () => {
      profileModel.find.mockReturnValueOnce({
        select: jest.fn().mockReturnValueOnce({
          skip: jest.fn().mockReturnValueOnce({
            limit: jest.fn().mockReturnValueOnce({
              lean: jest.fn().mockResolvedValueOnce(mockProfiles),
            }),
          }),
        }),
      });
      const result = await service.searchUsers(
        mockProfiles[1]._id.toString(),
        1,
        5,
      );
      expect(result).toHaveLength(5);
      expect(profileModel.find).toHaveBeenCalledWith({});
    });

    it('should return only 2 profiles (profiles 1 & 3) when filtering by name = "testing"', async () => {
      const filtered = mockProfiles.filter(
        (profile) =>
          profile.first_name.toLowerCase().includes('testing') ||
          profile.last_name.toLowerCase().includes('testing'),
      );
      profileModel.find.mockReturnValueOnce({
        select: jest.fn().mockReturnValueOnce({
          skip: jest.fn().mockReturnValueOnce({
            limit: jest.fn().mockReturnValueOnce({
              lean: jest.fn().mockResolvedValueOnce(filtered),
            }),
          }),
        }),
      });
      const result = await service.searchUsers(
        mockProfiles[1]._id.toString(),
        1,
        5,
        'testing',
      );
      expect(result).toHaveLength(2);
      expect(
        result.map((profile) => profile.firstName + ' ' + profile.lastName),
      ).toEqual(['Testing User1', 'Testing User3']);
      expect(profileModel.find).toHaveBeenCalledWith({
        $expr: {
          $regexMatch: {
            input: { $concat: ['$first_name', ' ', '$last_name'] },
            regex: 'testing',
            options: 'i',
          },
        },
      });
    });

    it('should return only 1 profile (profile 2) when filtering by company = "company"', async () => {
      const filtered = mockProfiles.filter((profile) =>
        profile.work_experience?.some((exp) =>
          exp.company?.toLowerCase().includes('company'),
        ),
      );
      profileModel.find.mockReturnValueOnce({
        select: jest.fn().mockReturnValueOnce({
          skip: jest.fn().mockReturnValueOnce({
            limit: jest.fn().mockReturnValueOnce({
              lean: jest.fn().mockResolvedValueOnce(filtered),
            }),
          }),
        }),
      });
      const result = await service.searchUsers(
        mockProfiles[1]._id.toString(),
        1,
        5,
        undefined,
        'company',
      );
      expect(result).toHaveLength(1);
      expect(
        result.map((profile) => profile.firstName + ' ' + profile.lastName),
      ).toEqual(['Test User2']);
      expect(profileModel.find).toHaveBeenCalledWith({
        'work_experience.company': {
          $regex: 'company',
          $options: 'i',
        },
      });
    });

    it('should call handleError if searchUsers throws an error', async () => {
      profileModel.find.mockImplementationOnce(() => {
        throw new Error('Unexpected Error.');
      });
      try {
        await service.searchUsers(mockProfiles[1]._id.toString(), 1, 5, 'user');
      } catch (_) {}
      expect(handleError).toHaveBeenCalledWith(
        expect.any(Error),
        'Failed to retrieve list of users.',
      );
    });
  });

  describe('requestConnection', () => {
    it('should create a pending request (id1 → id5)', async () => {
      profileModel.findById
        .mockReturnValueOnce({
          lean: jest.fn().mockResolvedValueOnce(mockProfiles[0]),
        })
        .mockReturnValueOnce({
          lean: jest.fn().mockResolvedValueOnce(mockProfiles[4]),
        });
      (getBlocked as jest.Mock).mockResolvedValue(null);
      (getPending as jest.Mock).mockResolvedValue(null);
      (getIgnored as jest.Mock).mockResolvedValue(null);
      (getConnection as jest.Mock).mockResolvedValue(null);
      const saveMock = jest.fn();
      const userConnectionInstance = { save: saveMock };
      const userConnectionConstructorMock = jest
        .fn()
        .mockImplementation(() => userConnectionInstance);
      (service as any).userConnectionModel = userConnectionConstructorMock;
      await service.requestConnection(mockProfiles[0]._id.toString(), {
        userId: mockProfiles[4]._id.toString(),
      });
      expect(saveMock).toHaveBeenCalled();
    });

    it('should throw ForbiddenException if user is not premium and has exceeded connection limit (id1 → id2)', async () => {
      const nonPremiumUser = {
        ...mockProfiles[0],
        is_premium: false,
        connection_count: 51,
      };
      profileModel.findById
        .mockReturnValueOnce({
          lean: jest.fn().mockResolvedValueOnce(nonPremiumUser),
        })
        .mockReturnValueOnce({
          lean: jest.fn().mockResolvedValueOnce(mockProfiles[1]),
        });
      await service.requestConnection(mockProfiles[0]._id.toString(), {
        userId: mockProfiles[1]._id.toString(),
      });
      expect(handleError).toHaveBeenCalledWith(
        new ForbiddenException('User has exceeded his limit on connections.'),
        'Failed to request connection.',
      );
    });

    it('should throw NotFoundException if user is not found', async () => {
      profileModel.findById
        .mockReturnValueOnce({
          lean: jest.fn().mockResolvedValueOnce(mockProfiles[0]),
        })
        .mockReturnValueOnce({ lean: jest.fn().mockResolvedValueOnce(null) });
      await service.requestConnection(mockProfiles[0]._id.toString(), {
        userId: new Types.ObjectId().toString(),
      });
      expect(handleError).toHaveBeenCalledWith(
        new NotFoundException('User not found.'),
        'Failed to request connection.',
      );
    });

    it('should throw BadRequestException if sending and receiving party are the same (id1 → id1)', async () => {
      profileModel.findById
        .mockReturnValueOnce({
          lean: jest.fn().mockResolvedValueOnce(mockProfiles[0]),
        })
        .mockReturnValueOnce({
          lean: jest.fn().mockResolvedValueOnce(mockProfiles[0]),
        });
      await service.requestConnection(mockProfiles[0]._id.toString(), {
        userId: mockProfiles[0]._id.toString(),
      });
      expect(handleError).toHaveBeenCalledWith(
        new BadRequestException('Cannot request a connection with yourself.'),
        'Failed to request connection.',
      );
    });

    it('should throw ForbiddenException if users are blocked (id2 → id5)', async () => {
      profileModel.findById
        .mockReturnValueOnce({
          lean: jest.fn().mockResolvedValueOnce(mockProfiles[1]),
        })
        .mockReturnValueOnce({
          lean: jest.fn().mockResolvedValueOnce(mockProfiles[4]),
        });
      (getBlocked as jest.Mock).mockResolvedValueOnce(mockConnections[8]);
      await service.requestConnection(mockProfiles[1]._id.toString(), {
        userId: mockProfiles[4]._id.toString(),
      });
      expect(handleError).toHaveBeenCalledWith(
        new ForbiddenException(
          'Cannot place a connection request between blocked users.',
        ),
        'Failed to request connection.',
      );
    });

    it('should throw ConflictException if pending/ignored connection already exists (id1 → id2)', async () => {
      profileModel.findById
        .mockReturnValueOnce({
          lean: jest.fn().mockResolvedValueOnce(mockProfiles[0]),
        })
        .mockReturnValueOnce({
          lean: jest.fn().mockResolvedValueOnce(mockProfiles[1]),
        });
      (getBlocked as jest.Mock).mockResolvedValue(false);
      (getPending as jest.Mock).mockResolvedValueOnce(mockConnections[0]);
      await service.requestConnection(mockProfiles[0]._id.toString(), {
        userId: mockProfiles[1]._id.toString(),
      });
      expect(handleError).toHaveBeenCalledWith(
        new ConflictException(
          'Pending/ignored connection request already estbalished between users.',
        ),
        'Failed to request connection.',
      );
    });

    it('should throw ConflictException if connection already exists (id3 → id2)', async () => {
      profileModel.findById
        .mockReturnValueOnce({
          lean: jest.fn().mockResolvedValueOnce(mockProfiles[2]),
        })
        .mockReturnValueOnce({
          lean: jest.fn().mockResolvedValueOnce(mockProfiles[1]),
        });
      (getBlocked as jest.Mock).mockResolvedValue(null);
      (getPending as jest.Mock).mockResolvedValue(null);
      (getIgnored as jest.Mock).mockResolvedValue(null);
      (getConnection as jest.Mock).mockReturnValueOnce(mockConnections[2]);
      await service.requestConnection(mockProfiles[1]._id.toString(), {
        userId: mockProfiles[2]._id.toString(),
      });
      expect(handleError).toHaveBeenCalledWith(
        new ConflictException(
          'Connection instance already estbalished between users.',
        ),
        'Failed to request connection.',
      );
    });
  });

  describe('removeRequest', () => {
    it('should successfully remove a pending connection request (id1 → id2)', async () => {
      profileModel.findById.mockReturnValueOnce({
        lean: jest.fn().mockResolvedValueOnce(mockProfiles[1]),
      });
      (getPending as jest.Mock).mockResolvedValueOnce(mockConnections[0]);
      (getIgnored as jest.Mock).mockResolvedValueOnce(null);
      userConnectionModel.findByIdAndDelete = jest
        .fn()
        .mockResolvedValueOnce({});
      await service.removeRequest(
        mockProfiles[0]._id.toString(),
        mockProfiles[1]._id.toString(),
      );
      expect(userConnectionModel.findByIdAndDelete).toHaveBeenCalledWith(
        mockConnections[0]._id,
      );
    });

    it('should successfully remove an ignored connection request (id3 → id1)', async () => {
      profileModel.findById.mockReturnValueOnce({
        lean: jest.fn().mockResolvedValueOnce(mockProfiles[1]),
      });
      (getPending as jest.Mock).mockResolvedValueOnce(null);
      (getIgnored as jest.Mock).mockResolvedValueOnce(mockConnections[1]);
      userConnectionModel.findByIdAndDelete = jest
        .fn()
        .mockResolvedValueOnce({});
      await service.removeRequest(
        mockProfiles[2]._id.toString(),
        mockProfiles[0]._id.toString(),
      );
      expect(userConnectionModel.findByIdAndDelete).toHaveBeenCalledWith(
        mockConnections[1]._id,
      );
    });

    it('should throw NotFoundException if receiving user is not found', async () => {
      profileModel.findById.mockReturnValueOnce({
        lean: jest.fn().mockResolvedValueOnce(null),
      });
      await service.removeRequest(
        mockProfiles[0]._id.toString(),
        new Types.ObjectId().toString(),
      );
      expect(handleError).toHaveBeenCalledWith(
        new NotFoundException('User not found.'),
        'Failed to remove pending request.',
      );
    });

    it('should throw NotFoundException if no pending/ignored request exists (id1 → id5)', async () => {
      profileModel.findById.mockReturnValueOnce({
        lean: jest.fn().mockResolvedValueOnce(mockProfiles[4]),
      });
      (getPending as jest.Mock).mockResolvedValueOnce(null);
      (getIgnored as jest.Mock).mockResolvedValueOnce(null);
      await service.removeRequest(
        mockProfiles[0]._id.toString(),
        mockProfiles[4]._id.toString(),
      );
      expect(handleError).toHaveBeenCalledWith(
        new NotFoundException('Pending connection request was not found.'),
        'Failed to remove pending request.',
      );
    });
  });

  describe('updateConnection', () => {
    it('should successfully accept connection request (id1 → id2) and increment count and follow ', async () => {
      profileModel.findById
        .mockReturnValueOnce({
          lean: jest.fn().mockResolvedValueOnce(mockProfiles[0]),
        })
        .mockReturnValueOnce({
          lean: jest.fn().mockResolvedValueOnce(mockProfiles[1]),
        });
      (getPending as jest.Mock).mockResolvedValueOnce(mockConnections[0]);
      userConnectionModel.findByIdAndUpdate = jest
        .fn()
        .mockResolvedValueOnce(mockConnections[0]);
      const findByIdAndUpdateMock = jest.fn();
      profileModel.findByIdAndUpdate = findByIdAndUpdateMock;
      (getFollow as jest.Mock).mockResolvedValueOnce(null);
      const saveMock = jest.fn();
      const followInstance = { save: saveMock };
      const constructorMock = jest
        .fn()
        .mockImplementation(() => followInstance);
      (service as any).userConnectionModel = Object.assign(
        constructorMock,
        userConnectionModel,
      );
      await service.updateConnection(
        mockProfiles[0]._id.toString(),
        mockProfiles[1]._id.toString(),
        { isAccept: true },
      );
      expect(findByIdAndUpdateMock).toHaveBeenCalledTimes(2);
      expect(saveMock).toHaveBeenCalled();
    });

    it('should successfully ignore connection request (id1 → id2)', async () => {
      profileModel.findById
        .mockReturnValueOnce({
          lean: jest.fn().mockResolvedValueOnce(mockProfiles[0]),
        })
        .mockReturnValueOnce({
          lean: jest.fn().mockResolvedValueOnce(mockProfiles[1]),
        });
      (getPending as jest.Mock).mockResolvedValueOnce(mockConnections[0]);
      userConnectionModel.findByIdAndUpdate = jest
        .fn()
        .mockResolvedValueOnce(mockConnections[0]);
      await service.updateConnection(
        mockProfiles[0]._id.toString(),
        mockProfiles[1]._id.toString(),
        { isAccept: false },
      );
      expect(userConnectionModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockConnections[0]._id,
        expect.objectContaining({ status: ConnectionStatus.Ignored }),
        { new: true },
      );
    });

    it('should throw NotFoundException when user is not found', async () => {
      profileModel.findById
        .mockReturnValueOnce({
          lean: jest.fn().mockResolvedValueOnce(mockProfiles[0]),
        })
        .mockReturnValueOnce({
          lean: jest.fn().mockResolvedValueOnce(null),
        });
      await service.updateConnection(
        new Types.ObjectId().toString(),
        mockProfiles[0]._id.toString(),
        { isAccept: true },
      );
      expect(handleError).toHaveBeenCalledWith(
        new NotFoundException('User not found.'),
        'Failed to update connection request status.',
      );
    });

    it('should throw NotFoundException when connection request does not exist (id1 → id5)', async () => {
      profileModel.findById
        .mockReturnValueOnce({
          lean: jest.fn().mockResolvedValueOnce(mockProfiles[0]),
        })
        .mockReturnValueOnce({
          lean: jest.fn().mockResolvedValueOnce(mockProfiles[4]),
        });
      (getPending as jest.Mock).mockResolvedValueOnce(null);
      (service as any).userConnectionModel = mockUserConnectionModel;
      await service.updateConnection(
        mockProfiles[0]._id.toString(),
        mockProfiles[4]._id.toString(),
        { isAccept: true },
      );
      expect(handleError).toHaveBeenCalledWith(
        new NotFoundException('Connection request was not found.'),
        'Failed to update connection request status.',
      );
    });

    it('should throw ForbiddenException if receiving user is not premium and has exceeded connection limit (id1 → id2)', async () => {
      const sender = {
        ...mockProfiles[0],
      };
      const receiver = {
        ...mockProfiles[1],
        is_premium: false,
        connection_count: 50,
      };
      profileModel.findById
        .mockReturnValueOnce({
          lean: jest.fn().mockResolvedValueOnce(receiver),
        })
        .mockReturnValueOnce({
          lean: jest.fn().mockResolvedValueOnce(sender),
        });
      (getPending as jest.Mock).mockResolvedValueOnce(mockConnections[0]);
      await service.updateConnection(
        sender._id.toString(),
        receiver._id.toString(),
        { isAccept: true },
      );
      expect(handleError).toHaveBeenCalledWith(
        new ForbiddenException('User has exceeded his limit on connections.'),
        'Failed to update connection request status.',
      );
    });
  });

  describe('removeConnection', () => {
    it('should successfully remove a connection and decrement connection count (id2 → id4)', async () => {
      profileModel.findById.mockReturnValueOnce({
        lean: jest.fn().mockResolvedValueOnce(mockProfiles[3]),
      });
      (getConnection as jest.Mock).mockResolvedValueOnce(mockConnections[3]);
      (getConnection as jest.Mock).mockResolvedValueOnce(null);
      (getFollow as jest.Mock).mockResolvedValueOnce(null);
      userConnectionModel.findByIdAndDelete = jest
        .fn()
        .mockImplementation((id) => {
          return Promise.resolve(
            mockConnections.find((connection) => connection._id.equals(id)),
          );
        });
      const findByIdAndUpdateMock = jest.fn().mockResolvedValue({});
      profileModel.findByIdAndUpdate = findByIdAndUpdateMock;
      await service.removeConnection(
        mockProfiles[1]._id.toString(),
        mockProfiles[3]._id.toString(),
      );
      expect(userConnectionModel.findByIdAndDelete).toHaveBeenCalledWith(
        mockConnections[3]._id,
      );
      expect(profileModel.findByIdAndUpdate).toHaveBeenCalledTimes(2);
      expect(profileModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockConnections[3].sending_party,
        { $inc: { connection_count: -1 } },
        { new: true },
      );
      expect(profileModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockConnections[3].receiving_party,
        { $inc: { connection_count: -1 } },
        { new: true },
      );
    });

    it('should successfully remove a connection in other direction and decrement connection count (id4 → id2)', async () => {
      profileModel.findById.mockReturnValueOnce({
        lean: jest.fn().mockResolvedValueOnce(mockProfiles[3]),
      });
      (getConnection as jest.Mock).mockResolvedValueOnce(null);
      (getConnection as jest.Mock).mockResolvedValueOnce(mockConnections[3]);
      (getFollow as jest.Mock).mockResolvedValueOnce(null);
      userConnectionModel.findByIdAndDelete = jest
        .fn()
        .mockImplementation((id) => {
          return Promise.resolve(
            mockConnections.find((connection) => connection._id.equals(id)),
          );
        });
      const findByIdAndUpdateMock = jest.fn().mockResolvedValue({});
      profileModel.findByIdAndUpdate = findByIdAndUpdateMock;
      await service.removeConnection(
        mockProfiles[3]._id.toString(),
        mockProfiles[1]._id.toString(),
      );
      expect(userConnectionModel.findByIdAndDelete).toHaveBeenCalledWith(
        mockConnections[3]._id,
      );
      expect(profileModel.findByIdAndUpdate).toHaveBeenCalledTimes(2);
      expect(profileModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockConnections[3].sending_party,
        { $inc: { connection_count: -1 } },
        { new: true },
      );
      expect(profileModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockConnections[3].receiving_party,
        { $inc: { connection_count: -1 } },
        { new: true },
      );
    });

    it('should throw NotFoundException when receiving user does not exist', async () => {
      profileModel.findById.mockReturnValueOnce({
        lean: jest.fn().mockResolvedValueOnce(null),
      });
      await service.removeConnection(
        mockProfiles[0]._id.toString(),
        new Types.ObjectId().toString(),
      );
      expect(handleError).toHaveBeenCalledWith(
        new NotFoundException('User not found.'),
        'Failed to remove connection.',
      );
    });

    it('should throw NotFoundException when no connection exists (id1 → id5)', async () => {
      profileModel.findById.mockReturnValueOnce({
        lean: jest.fn().mockResolvedValueOnce(mockProfiles[4]),
      });
      (getConnection as jest.Mock).mockResolvedValueOnce(null);
      (getConnection as jest.Mock).mockResolvedValueOnce(null);
      await service.removeConnection(
        mockProfiles[0]._id.toString(),
        mockProfiles[4]._id.toString(),
      );
      expect(handleError).toHaveBeenCalledWith(
        new NotFoundException('Connection instance not found.'),
        'Failed to remove connection.',
      );
    });
  });

  describe('getConnections', () => {
    const subId = mockProfiles[4]._id.toString();
    const page = 1;
    const limit = 5;
    beforeEach(() => {
      jest.clearAllMocks();
    });
    const mockAggregate = (result: any[]) => {
      userConnectionModel.aggregate = jest.fn().mockReturnValueOnce(result);
    };
    const mockFindConnected = (ids: string[]) => {
      userConnectionModel.find = jest.fn().mockResolvedValueOnce([]);
    };
    const expectResultOrder = async (
      userId: string,
      expected: string[],
      by: number,
      direction: number,
      name?: string,
    ) => {
      const dtoMock = (profile: any) => ({
        ...profile,
        createdAt: profile.created_at,
        isConnected: false,
      });
      const aggregateResult = expected.map((id) => {
        const profile = mockProfiles.find(
          (profile) => profile._id.toString() === id,
        );
        return {
          ...profile,
          _id: profile!._id,
          created_at: mockConnections.find(
            (connection) =>
              (connection.sending_party.equals(userId) &&
                connection.receiving_party.equals(profile!._id)) ||
              (connection.receiving_party.equals(userId) &&
                connection.sending_party.equals(profile!._id)),
          )?.created_at,
        };
      });
      mockAggregate(aggregateResult);
      mockFindConnected(expected);
      const results = await service.getConnections(
        subId,
        userId,
        page,
        limit,
        by,
        direction,
        name,
      );
      expect(results.map((profile) => profile.userId)).toEqual(expected);
      for (const result of results) {
        expect(result.isConnected).toBe(false);
      }
    };

    it('should call handleError if getConnections throws an error', async () => {
      profileModel.find.mockImplementationOnce(() => {
        throw new Error('Unexpected Error.');
      });
      try {
        await service.getConnections(
          mockProfiles[4]._id.toString(),
          mockProfiles[1]._id.toString(),
          1,
          5,
          1,
          -1,
        );
      } catch (_) {}
      expect(handleError).toHaveBeenCalledWith(
        expect.any(Error),
        'Failed to retrieve list of connections.',
      );
    });

    it('should return profiles sorted by created_at ascendingnly', async () => {
      await expectResultOrder(
        mockProfiles[1]._id.toString(),
        [mockProfiles[3]._id.toString(), mockProfiles[2]._id.toString()],
        1,
        1,
      );
    });

    it('should return profiles sorted by created_at descendingly ', async () => {
      await expectResultOrder(
        mockProfiles[1]._id.toString(),
        [mockProfiles[2]._id.toString(), mockProfiles[3]._id.toString()],
        1,
        -1,
      );
    });

    it('should return filtered profile with name = "testing"', async () => {
      await expectResultOrder(
        mockProfiles[1]._id.toString(),
        [mockProfiles[2]._id.toString()],
        1,
        1,
        'testing',
      );
    });

    it('should return profiles sorted by first_name ascendingly', async () => {
      await expectResultOrder(
        mockProfiles[1]._id.toString(),
        [mockProfiles[3]._id.toString(), mockProfiles[2]._id.toString()],
        2,
        1,
      );
    });

    it('should return profiles sorted by first_name descendingly', async () => {
      await expectResultOrder(
        mockProfiles[1]._id.toString(),
        [mockProfiles[2]._id.toString(), mockProfiles[3]._id.toString()],
        2,
        -1,
      );
    });

    it('should return profiles sorted by last_name ascendingnly', async () => {
      await expectResultOrder(
        mockProfiles[1]._id.toString(),
        [mockProfiles[2]._id.toString(), mockProfiles[3]._id.toString()],
        3,
        1,
      );
    });

    it('should return profiles sorted by last_name descendingnly', async () => {
      await expectResultOrder(
        mockProfiles[1]._id.toString(),
        [mockProfiles[3]._id.toString(), mockProfiles[2]._id.toString()],
        3,
        -1,
      );
    });
  });

  describe('getPendingRequests', () => {
    it('should call handleError if getPendingRequests throws an error', async () => {
      profileModel.find.mockImplementationOnce(() => {
        throw new Error('Unexpected Error.');
      });
      try {
        await service.getPendingRequests(mockProfiles[4]._id.toString(), 1, 5);
      } catch (_) {}
      expect(handleError).toHaveBeenCalledWith(
        expect.any(Error),
        'Failed to retrieve list of pending connection requests.',
      );
    });

    it('should return profile1 as sender (id1 → id2)', async () => {
      const userId = mockProfiles[1]._id.toString();
      userConnectionModel.aggregate.mockResolvedValueOnce([
        {
          _id: mockProfiles[0]._id,
          first_name: mockProfiles[0].first_name,
          last_name: mockProfiles[0].last_name,
          profile_picture: mockProfiles[0].profile_picture,
          headline: mockProfiles[0].headline,
          created_at: mockConnections[0].created_at,
        },
      ]);
      const result = await service.getPendingRequests(userId, 1, 5);
      expect(result).toHaveLength(1);
      expect(result[0].userId).toEqual(mockProfiles[0]._id.toString());
      expect(result[0].firstName).toBe('Testing');
      expect(result[0].lastName).toBe('User1');
      expect(result[0].createdAt).toBe(mockConnections[0].created_at);
    });
  });

  describe('getSentRequests', () => {
    it('should call handleError if getSentRequests throws an error', async () => {
      profileModel.find.mockImplementationOnce(() => {
        throw new Error('Unexpected Error.');
      });
      try {
        await service.getSentRequests(mockProfiles[4]._id.toString(), 1, 5);
      } catch (_) {}
      expect(handleError).toHaveBeenCalledWith(
        expect.any(Error),
        'Failed to retrieve list of sent connection requests.',
      );
    });

    it('should return profile2 as receiver (id1 → id2)', async () => {
      const userId = mockProfiles[0]._id.toString();
      userConnectionModel.aggregate.mockResolvedValueOnce([
        {
          _id: mockProfiles[1]._id,
          first_name: mockProfiles[1].first_name,
          last_name: mockProfiles[1].last_name,
          profile_picture: mockProfiles[1].profile_picture,
          headline: mockProfiles[1].headline,
          created_at: mockConnections[0].created_at,
        },
      ]);
      const result = await service.getSentRequests(userId, 1, 5);
      expect(result).toHaveLength(1);
      expect(result[0].userId).toEqual(mockProfiles[1]._id.toString());
      expect(result[0].firstName).toBe('Test');
      expect(result[0].lastName).toBe('User2');
      expect(result[0].createdAt).toBe(mockConnections[0].created_at);
    });
  });

  describe('getRecommendedUsers', () => {
    it('should call handleError if getRecommendedUsers throws an error', async () => {
      profileModel.find.mockImplementationOnce(() => {
        throw new Error('Unexpected Error.');
      });
      try {
        await service.getRecommendedUsers(mockProfiles[4]._id.toString(), 1, 5);
      } catch (_) {}
      expect(handleError).toHaveBeenCalledWith(
        expect.any(Error),
        'Failed to retrieve people you may know.',
      );
    });

    it('should return profile5 as recommended for user id1', async () => {
      const userId = mockProfiles[0]._id.toString();
      userConnectionModel.find = jest.fn().mockReturnValueOnce({
        select: jest.fn().mockReturnValueOnce({
          lean: jest.fn().mockResolvedValueOnce([
            {
              sending_party: mockProfiles[0]._id,
              receiving_party: mockProfiles[1]._id,
            },
            {
              sending_party: mockProfiles[2]._id,
              receiving_party: mockProfiles[0]._id,
            },
            {
              sending_party: mockProfiles[0]._id,
              receiving_party: mockProfiles[3]._id,
            },
            {
              sending_party: mockProfiles[3]._id,
              receiving_party: mockProfiles[0]._id,
            },
          ]),
        }),
      });
      profileModel.find = jest.fn().mockReturnValueOnce({
        select: jest.fn().mockReturnValueOnce({
          sort: jest.fn().mockReturnValueOnce({
            skip: jest.fn().mockReturnValueOnce({
              limit: jest.fn().mockReturnValueOnce({
                lean: jest.fn().mockResolvedValueOnce([mockProfiles[4]]),
              }),
            }),
          }),
        }),
      });
      const result = await service.getRecommendedUsers(userId, 1, 5);
      expect(result).toHaveLength(1);
      expect(result[0].userId).toEqual(mockProfiles[4]._id.toString());
      expect(result[0].firstName).toBe('Test');
      expect(result[0].lastName).toBe('User5');
    });
  });

  describe('follow', () => {
    it('should successfully follow a user (id1 → id5)', async () => {
      profileModel.findById.mockReturnValueOnce({
        lean: jest.fn().mockResolvedValueOnce(mockProfiles[4]),
      });
      (getBlocked as jest.Mock).mockResolvedValueOnce(null);
      (getBlocked as jest.Mock).mockResolvedValueOnce(null);
      (getFollow as jest.Mock).mockResolvedValueOnce(null);
      const saveMock = jest.fn();
      const followInstance = { save: saveMock };
      const constructorMock = jest
        .fn()
        .mockImplementation(() => followInstance);
      (service as any).userConnectionModel = constructorMock;
      await service.follow(mockProfiles[0]._id.toString(), {
        userId: mockProfiles[4]._id.toString(),
      });
      expect(saveMock).toHaveBeenCalled();
    });

    it('should throw ConflictException if follow instance already exists (id4 → id1)', async () => {
      profileModel.findById.mockReturnValueOnce({
        lean: jest.fn().mockResolvedValueOnce(mockProfiles[0]),
      });
      (getBlocked as jest.Mock).mockResolvedValue(null);
      (getBlocked as jest.Mock).mockResolvedValue(null);
      (getFollow as jest.Mock).mockResolvedValueOnce(mockConnections[6]);
      await service.follow(mockProfiles[3]._id.toString(), {
        userId: mockProfiles[0]._id.toString(),
      });
      expect(handleError).toHaveBeenCalledWith(
        new ConflictException('Follow instance already exists.'),
        'Failed to follow user.',
      );
    });

    it('should throw NotFoundException if receiving user is not found', async () => {
      profileModel.findById.mockReturnValueOnce({
        lean: jest.fn().mockResolvedValueOnce(null),
      });
      await service.follow(mockProfiles[0]._id.toString(), {
        userId: new Types.ObjectId().toString(),
      });
      expect(handleError).toHaveBeenCalledWith(
        new NotFoundException('User not found.'),
        'Failed to follow user.',
      );
    });

    it('should throw BadRequestException if sending and receiving party are the same (id1 → id1)', async () => {
      profileModel.findById.mockReturnValueOnce({
        lean: jest.fn().mockResolvedValueOnce(mockProfiles[0]),
      });
      await service.follow(mockProfiles[0]._id.toString(), {
        userId: mockProfiles[0]._id.toString(),
      });
      expect(handleError).toHaveBeenCalledWith(
        new BadRequestException('Cannot follow yourself.'),
        'Failed to follow user.',
      );
    });

    it('should throw ForbiddenException if users are blocked (id2 → id5)', async () => {
      profileModel.findById.mockReturnValueOnce({
        lean: jest.fn().mockResolvedValueOnce(mockProfiles[4]),
      });
      (getBlocked as jest.Mock).mockResolvedValueOnce(mockConnections[8]);
      await service.follow(mockProfiles[1]._id.toString(), {
        userId: mockProfiles[4]._id.toString(),
      });
      expect(handleError).toHaveBeenCalledWith(
        new ForbiddenException(
          'Cannot place a follow instance between blocked users.',
        ),
        'Failed to follow user.',
      );
    });
  });

  describe('unfollow', () => {
    it('should successfully unfollow a user (id4 → id1)', async () => {
      profileModel.findById.mockReturnValueOnce({
        lean: jest.fn().mockResolvedValueOnce(mockProfiles[0]),
      });
      (getFollow as jest.Mock).mockResolvedValueOnce(mockConnections[6]);
      userConnectionModel.findByIdAndDelete = jest
        .fn()
        .mockResolvedValueOnce(mockConnections[6]);
      await service.unfollow(
        mockProfiles[3]._id.toString(),
        mockProfiles[0]._id.toString(),
      );
      expect(userConnectionModel.findByIdAndDelete).toHaveBeenCalledWith(
        mockConnections[6]._id,
      );
    });

    it('should throw NotFoundException if receiving user is not found', async () => {
      profileModel.findById.mockReturnValueOnce({
        lean: jest.fn().mockResolvedValueOnce(null),
      });
      await service.unfollow(
        mockProfiles[2]._id.toString(),
        new Types.ObjectId().toString(),
      );
      expect(handleError).toHaveBeenCalledWith(
        new NotFoundException('User not found.'),
        'Failed to unfollow user.',
      );
    });

    it('should throw NotFoundException if follow instance does not exist (id1 → id5)', async () => {
      profileModel.findById.mockReturnValueOnce({
        lean: jest.fn().mockResolvedValueOnce(mockProfiles[4]),
      });
      (getFollow as jest.Mock).mockResolvedValueOnce(null);
      await service.unfollow(
        mockProfiles[0]._id.toString(),
        mockProfiles[4]._id.toString(),
      );
      expect(handleError).toHaveBeenCalledWith(
        new NotFoundException('Follow instance not found.'),
        'Failed to unfollow user.',
      );
    });
  });

  describe('getFollowers', () => {
    it('should call handleError if getFollowers throws an error', async () => {
      profileModel.find.mockImplementationOnce(() => {
        throw new Error('Unexpected Error.');
      });
      try {
        await service.getFollowers(mockProfiles[4]._id.toString(), 1, 5);
      } catch (_) {}
      expect(handleError).toHaveBeenCalledWith(
        expect.any(Error),
        'Failed to retrieve list of followers.',
      );
    });

    it('should return profile4 as a follower (id4 → id1)', async () => {
      const userId = mockProfiles[0]._id.toString();
      userConnectionModel.aggregate.mockResolvedValueOnce([
        {
          _id: mockProfiles[3]._id,
          first_name: mockProfiles[3].first_name,
          last_name: mockProfiles[3].last_name,
          profile_picture: mockProfiles[3].profile_picture,
          headline: mockProfiles[3].headline,
          created_at: mockConnections[6].created_at,
        },
      ]);
      const result = await service.getFollowers(userId, 1, 5);
      expect(result).toHaveLength(1);
      expect(result[0].userId.toString()).toBe(mockProfiles[3]._id.toString());
      expect(result[0].firstName).toBe('Test');
      expect(result[0].lastName).toBe('User4');
      expect(result[0].createdAt).toBe(mockConnections[6].created_at);
    });
  });

  describe('getFollowing', () => {
    it('should call handleError if getFollowing throws an error', async () => {
      profileModel.find.mockImplementationOnce(() => {
        throw new Error('Unexpected Error.');
      });
      try {
        await service.getFollowing(mockProfiles[4]._id.toString(), 1, 5);
      } catch (_) {}
      expect(handleError).toHaveBeenCalledWith(
        expect.any(Error),
        'Failed to retrieve list of followed users.',
      );
    });

    it('should return profile1 as followed user (id4 → id1)', async () => {
      const userId = mockProfiles[3]._id.toString();
      userConnectionModel.aggregate.mockResolvedValueOnce([
        {
          _id: mockProfiles[0]._id,
          first_name: mockProfiles[0].first_name,
          last_name: mockProfiles[0].last_name,
          profile_picture: mockProfiles[0].profile_picture,
          headline: mockProfiles[0].headline,
          created_at: mockConnections[6].created_at,
        },
      ]);
      const result = await service.getFollowing(userId, 1, 5);
      expect(result).toHaveLength(1);
      expect(result[0].userId).toBe(mockProfiles[0]._id.toString());
      expect(result[0].firstName).toBe('Testing');
      expect(result[0].lastName).toBe('User1');
      expect(result[0].createdAt).toBe(mockConnections[6].created_at);
    });
  });

  describe('getFollowerCount', () => {
    it('should return the correct followers count', async () => {
      userConnectionModel.countDocuments = jest.fn().mockResolvedValueOnce(1);
      const result = await service.getFollowerCount(
        mockProfiles[4]._id.toString(),
      );
      expect(result).toEqual({ count: 1 });
      expect(userConnectionModel.countDocuments).toHaveBeenCalledWith({
        receiving_party: new Types.ObjectId(mockProfiles[4]._id.toString()),
        status: ConnectionStatus.Following,
      });
    });

    it('should call handleError if getFollowerCount throws an error', async () => {
      userConnectionModel.countDocuments = jest
        .fn()
        .mockRejectedValueOnce(new Error('Unexpected Error'));
      try {
        await service.getFollowerCount(mockProfiles[4]._id.toString());
      } catch (_) {}
      expect(handleError).toHaveBeenCalledWith(
        expect.any(Error),
        'Failed to get follower count.',
      );
    });
  });

  describe('getFollowingCount', () => {
    it('should return the correct following count', async () => {
      userConnectionModel.countDocuments = jest.fn().mockResolvedValueOnce(2);
      const result = await service.getFollowingCount(
        mockProfiles[4]._id.toString(),
      );
      expect(result).toEqual({ count: 2 });
      expect(userConnectionModel.countDocuments).toHaveBeenCalledWith({
        sending_party: new Types.ObjectId(mockProfiles[4]._id.toString()),
        status: ConnectionStatus.Following,
      });
    });

    it('should call handleError if getFollowingCount throws an error', async () => {
      userConnectionModel.countDocuments = jest
        .fn()
        .mockRejectedValueOnce(new Error('Unexpected Error'));
      try {
        await service.getFollowingCount(mockProfiles[4]._id.toString());
      } catch (_) {}
      expect(handleError).toHaveBeenCalledWith(
        expect.any(Error),
        'Failed to get following count.',
      );
    });
  });

  describe('getPendingCount', () => {
    it('should return the correct pending count', async () => {
      userConnectionModel.countDocuments = jest.fn().mockResolvedValueOnce(1);
      const result = await service.getPendingCount(
        mockProfiles[1]._id.toString(),
      );
      expect(result).toEqual({ count: 1 });
      expect(userConnectionModel.countDocuments).toHaveBeenCalledWith({
        receiving_party: new Types.ObjectId(mockProfiles[1]._id.toString()),
        status: ConnectionStatus.Pending,
      });
    });

    it('should call handleError if getPendingCount throws an error', async () => {
      userConnectionModel.countDocuments = jest
        .fn()
        .mockRejectedValueOnce(new Error('Unexpected Error'));
      try {
        await service.getPendingCount(mockProfiles[0]._id.toString());
      } catch (_) {}
      expect(handleError).toHaveBeenCalledWith(
        expect.any(Error),
        'Failed to get pending requests count.',
      );
    });
  });

  describe('endorseSkill', () => {
    it('should successfully endorse a skill (id4 → id2)', async () => {
      profileModel.findById.mockResolvedValueOnce({
        ...mockProfiles[1],
        save: jest.fn(),
      });
      (getConnection as jest.Mock).mockResolvedValueOnce(mockConnections[3]);
      (getConnection as jest.Mock).mockResolvedValueOnce(null);
      await service.endorseSkill(
        mockProfiles[3]._id.toString(),
        mockProfiles[1]._id.toString(),
        { skillName: 'Skill1' },
      );
      expect(profileModel.findById).toHaveBeenCalled();
    });

    it('should throw NotFoundException if endorsee user is not found', async () => {
      profileModel.findById.mockResolvedValueOnce(null);
      await service.endorseSkill(
        mockProfiles[0]._id.toString(),
        new Types.ObjectId().toString(),
        { skillName: 'Skill1' },
      );
      expect(handleError).toHaveBeenCalledWith(
        new NotFoundException('Endorsee profile not found.'),
        'Failed to endorse skill.',
      );
    });

    it('should throw BadRequestException if user endorses their own skill', async () => {
      profileModel.findById.mockResolvedValueOnce(mockProfiles[0]);
      await service.endorseSkill(
        mockProfiles[0]._id.toString(),
        mockProfiles[0]._id.toString(),
        { skillName: 'Skill1' },
      );
      expect(handleError).toHaveBeenCalledWith(
        new BadRequestException('User cannot endorse their own skill.'),
        'Failed to endorse skill.',
      );
    });

    it('should throw ForbiddenException if no connection exists (id5 → id1)', async () => {
      profileModel.findById.mockResolvedValueOnce(mockProfiles[1]);
      (getConnection as jest.Mock).mockResolvedValueOnce(null);
      (getConnection as jest.Mock).mockResolvedValueOnce(null);
      await service.endorseSkill(
        mockProfiles[4]._id.toString(),
        mockProfiles[0]._id.toString(),
        { skillName: 'Skill1' },
      );
      expect(handleError).toHaveBeenCalledWith(
        new ForbiddenException("User cannot endorse a non-connection's skill."),
        'Failed to endorse skill.',
      );
    });

    it('should throw NotFoundException if skill does not exist', async () => {
      profileModel.findById.mockResolvedValueOnce(mockProfiles[1]);
      (getConnection as jest.Mock).mockResolvedValueOnce(mockConnections[3]);
      (getConnection as jest.Mock).mockResolvedValueOnce(null);
      await service.endorseSkill(
        mockProfiles[3]._id.toString(),
        mockProfiles[1]._id.toString(),
        { skillName: 'NoSkill' },
      );
      expect(handleError).toHaveBeenCalledWith(
        new NotFoundException('Skill not found in endorsee profile.'),
        'Failed to endorse skill.',
      );
    });

    it('should throw ConflictException if skill already endorsed', async () => {
      profileModel.findById.mockResolvedValueOnce(mockProfiles[1]);
      (getConnection as jest.Mock).mockResolvedValueOnce(mockConnections[3]);
      (getConnection as jest.Mock).mockResolvedValueOnce(null);
      await service.endorseSkill(
        mockProfiles[3]._id.toString(),
        mockProfiles[1]._id.toString(),
        { skillName: 'Skill1' },
      );
      expect(handleError).toHaveBeenCalledWith(
        new ConflictException('Endorser has already endorsed this skill.'),
        'Failed to endorse skill.',
      );
    });
  });

  describe('removeEndorsement', () => {
    it('should successfully remove an endorsement (id3 → id2)', async () => {
      const saveMock = jest.fn();
      profileModel.findById.mockResolvedValueOnce({
        ...mockProfiles[1],
        save: saveMock,
      });
      await service.removeEndorsement(
        mockProfiles[2]._id.toString(),
        mockProfiles[1]._id.toString(),
        'Skill1',
      );
      expect(profileModel.findById).toHaveBeenCalledWith(mockProfiles[1]._id);
      expect(saveMock).toHaveBeenCalled();
    });

    it('should throw NotFoundException if user profile is not found', async () => {
      profileModel.findById.mockResolvedValueOnce(null);
      await service.removeEndorsement(
        mockProfiles[0]._id.toString(),
        new Types.ObjectId().toString(),
        'Skill1',
      );
      expect(handleError).toHaveBeenCalledWith(
        new NotFoundException('User profile not found.'),
        'Failed to remove endorsement.',
      );
    });

    it('should throw NotFoundException if skill is not found in profile', async () => {
      profileModel.findById.mockResolvedValueOnce(mockProfiles[1]);
      await service.removeEndorsement(
        mockProfiles[2]._id.toString(),
        mockProfiles[1]._id.toString(),
        'NoSkill',
      );
      expect(handleError).toHaveBeenCalledWith(
        new NotFoundException("Skill not found in user's profile."),
        'Failed to remove endorsement.',
      );
    });

    it('should throw BadRequestException if user has not endorsed the skill', async () => {
      profileModel.findById.mockResolvedValueOnce(mockProfiles[1]);
      await service.removeEndorsement(
        mockProfiles[4]._id.toString(),
        mockProfiles[1]._id.toString(),
        'Skill1',
      );
      expect(handleError).toHaveBeenCalledWith(
        new BadRequestException('Logged in user has not endorsed this skill.'),
        'Failed to remove endorsement.',
      );
    });
  });

  describe('block', () => {
    it('should successfully block user (id1 → id2) and delete any existing connection', async () => {
      profileModel.findById.mockReturnValueOnce({
        lean: jest.fn().mockResolvedValueOnce(mockProfiles[1]),
      });
      (getBlocked as jest.Mock).mockResolvedValueOnce(null);
      (getBlocked as jest.Mock).mockResolvedValueOnce(null);
      const deleteManyMock = jest.fn().mockResolvedValueOnce({});
      const saveMock = jest.fn();
      const blockInstance = { save: saveMock };
      const blockConstructorMock = jest
        .fn()
        .mockImplementation(() => blockInstance);
      (service as any).userConnectionModel = Object.assign(
        blockConstructorMock,
        {
          deleteMany: deleteManyMock,
        },
      );
      await service.block(
        mockProfiles[0]._id.toString(),
        mockProfiles[1]._id.toString(),
      );
      expect(profileModel.findById).toHaveBeenCalled();
      expect(getBlocked).toHaveBeenCalledTimes(2);
      expect(deleteManyMock).toHaveBeenCalledWith({
        $or: [
          {
            sending_party: mockProfiles[0]._id,
            receiving_party: mockProfiles[1]._id,
          },
          {
            sending_party: mockProfiles[1]._id,
            receiving_party: mockProfiles[0]._id,
          },
        ],
      });
      expect(saveMock).toHaveBeenCalled();
    });

    it('should throw NotFoundException if receiving user not found', async () => {
      profileModel.findById.mockReturnValueOnce({
        lean: jest.fn().mockResolvedValueOnce(null),
      });
      await service.block(
        mockProfiles[0]._id.toString(),
        new Types.ObjectId().toString(),
      );
      expect(handleError).toHaveBeenCalledWith(
        new NotFoundException('User not found.'),
        'Failed to block user.',
      );
    });

    it('should throw BadRequestException if trying to block yourself', async () => {
      profileModel.findById.mockReturnValueOnce({
        lean: jest.fn().mockResolvedValueOnce(mockProfiles[0]),
      });
      await service.block(
        mockProfiles[0]._id.toString(),
        mockProfiles[0]._id.toString(),
      );
      expect(handleError).toHaveBeenCalledWith(
        new BadRequestException('Cannot block yourself.'),
        'Failed to block user.',
      );
    });

    it('should throw ConflictException if a block already exists (id2 → id5)', async () => {
      profileModel.findById.mockReturnValueOnce({
        lean: jest.fn().mockResolvedValueOnce(mockProfiles[4]),
      });
      (getBlocked as jest.Mock).mockResolvedValueOnce(mockConnections[8]);
      (getBlocked as jest.Mock).mockResolvedValueOnce(null);
      await service.block(
        mockProfiles[1]._id.toString(),
        mockProfiles[4]._id.toString(),
      );
      expect(handleError).toHaveBeenCalledWith(
        new ConflictException('Block instance already exists.'),
        'Failed to block user.',
      );
    });
  });

  describe('unblock', () => {
    it('should successfully unblock user (id2 → id5)', async () => {
      profileModel.findById.mockReturnValueOnce({
        lean: jest.fn().mockResolvedValueOnce(mockProfiles[4]),
      });
      const mockBlock = mockConnections[8];
      (getBlocked as jest.Mock).mockResolvedValueOnce(mockBlock);
      const findByIdAndDeleteMock = jest.fn().mockResolvedValueOnce(mockBlock);
      userConnectionModel.findByIdAndDelete = findByIdAndDeleteMock;
      await service.unblock(
        mockProfiles[1]._id.toString(),
        mockProfiles[4]._id.toString(),
      );
      expect(profileModel.findById).toHaveBeenCalled();
      expect(getBlocked).toHaveBeenCalledWith(
        userConnectionModel,
        mockProfiles[1]._id.toString(),
        mockProfiles[4]._id.toString(),
      );
      expect(findByIdAndDeleteMock).toHaveBeenCalledWith(mockBlock._id);
    });

    it('should throw NotFoundException if no block instance exists (id1 → id2)', async () => {
      profileModel.findById.mockReturnValueOnce({
        lean: jest.fn().mockResolvedValueOnce(mockProfiles[1]),
      });
      (getBlocked as jest.Mock).mockResolvedValueOnce(null);
      await service.unblock(
        mockProfiles[0]._id.toString(),
        mockProfiles[1]._id.toString(),
      );
      expect(handleError).toHaveBeenCalledWith(
        new NotFoundException('Block instance not found.'),
        'Failed to unblock user.',
      );
    });

    it('should throw NotFoundException if receiving user does not exist', async () => {
      profileModel.findById.mockReturnValueOnce({
        lean: jest.fn().mockResolvedValueOnce(null),
      });
      await service.unblock(
        mockProfiles[0]._id.toString(),
        new Types.ObjectId().toString(),
      );
      expect(handleError).toHaveBeenCalledWith(
        new NotFoundException('User not found.'),
        'Failed to unblock user.',
      );
    });
  });

  describe('getBlocked', () => {
    it('should call handleError if getBlocked throws an error', async () => {
      profileModel.find.mockImplementationOnce(() => {
        throw new Error('Unexpected Error.');
      });
      try {
        await service.getBlocked(mockProfiles[0]._id.toString(), 1, 5);
      } catch (_) {}
      expect(handleError).toHaveBeenCalledWith(
        expect.any(Error),
        'Failed to retrieve list of blocked users.',
      );
    });

    it('should return profile5 as a blocked user (id2 → id5)', async () => {
      const userId = mockProfiles[1]._id.toString();
      userConnectionModel.aggregate.mockResolvedValueOnce([
        {
          _id: mockProfiles[4]._id,
          first_name: mockProfiles[4].first_name,
          last_name: mockProfiles[4].last_name,
          profile_picture: mockProfiles[4].profile_picture,
          headline: mockProfiles[4].headline,
          created_at: mockConnections[8].created_at,
        },
      ]);
      const result = await service.getBlocked(userId, 1, 5);
      expect(result).toHaveLength(1);
      expect(result[0].userId).toBe(mockProfiles[4]._id.toString());
      expect(result[0].firstName).toBe('Test');
      expect(result[0].lastName).toBe('User5');
      expect(result[0].createdAt).toBe(mockConnections[8].created_at);
    });
  });
});
