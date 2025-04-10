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
import { CreateRequestDto } from './dtos/create-request.dto';
import { UpdateRequestDto } from './dtos/update-request.dto';
import { ConnectionStatus } from './enums/connection-status.enum';
import { handleError } from '../common/utils/exception-handler';
import {
  getConnection,
  getFollow,
  getPending,
  getBlocked,
  getIgnored,
} from './helpers/connection-helpers';

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
      ],
    }).compile();
    service = module.get<ConnectionsService>(ConnectionsService);
    userConnectionModel = module.get(getModelToken(UserConnection.name));
    profileModel = module.get(getModelToken(Profile.name));
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

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
    const result = await service.searchUsers(1, 5);
    expect(result).toHaveLength(5);
    expect(profileModel.find).toHaveBeenCalledWith({});
  });

  it('should return only 2 profiles when filtering by name = "testing"', async () => {
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
    const result = await service.searchUsers(1, 5, 'testing');
    expect(result).toHaveLength(2);
    expect(
      result.map((profile) => profile.firstName + ' ' + profile.lastName),
    ).toEqual(['Testing User1', 'Testing User2']);
    expect(profileModel.find).toHaveBeenCalledWith({
      $or: [
        { first_name: { $regex: 'testing', $options: 'i' } },
        { last_name: { $regex: 'testing', $options: 'i' } },
      ],
    });
  });

  it('should call handleError if searchUsers throws', async () => {
    profileModel.find.mockImplementationOnce(() => {
      throw new Error('Database Failure');
    });
    try {
      await service.searchUsers(1, 5, 'user');
    } catch (_) {}
    expect(handleError).toHaveBeenCalledWith(
      expect.any(Error),
      'Failed to retrieve list of users.',
    );
  });

  // it('should call handleError if requestConnection throws unexpectedly', async () => {
  //   profileModel.findById.mockImplementationOnce(() => {
  //     throw new Error('Unexpected');
  //   });
  //   try {
  //     await service.requestConnection(mockProfiles[0]._id.toString(), {
  //       userId: mockProfiles[4]._id.toString(),
  //     });
  //   } catch (_) {}
  //   expect(handleError).toHaveBeenCalledWith(
  //     expect.any(Error),
  //     'Failed to request connection.',
  //   );
  // });

  it('should create a pending request from user1 to user5', async () => {
    profileModel.findById.mockReturnValueOnce({
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

  it('should throw NotFoundException if user is not found', async () => {
    profileModel.findById.mockReturnValueOnce({
      lean: jest.fn().mockResolvedValueOnce(null),
    });
    await service.requestConnection(mockProfiles[0]._id.toString(), {
      userId: new Types.ObjectId().toString(),
    });
    expect(handleError).toHaveBeenCalledWith(
      new NotFoundException('User not found.'),
      'Failed to request connection.',
    );
  });

  it('should throw BadRequestException if sending and receiving party are the same', async () => {
    profileModel.findById.mockReturnValueOnce({
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

  it('should throw ConflictException if pending/ignored connection already exists', async () => {
    profileModel.findById.mockReturnValueOnce({
      lean: jest.fn().mockResolvedValueOnce(mockProfiles[1]),
    });
    (getBlocked as jest.Mock).mockResolvedValue(false);
    (getPending as jest.Mock).mockResolvedValueOnce(true);
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

  it('should throw ConflictException if connection already exists', async () => {
    profileModel.findById.mockReturnValueOnce({
      lean: jest.fn().mockResolvedValueOnce(mockProfiles[2]),
    });
    (getBlocked as jest.Mock).mockResolvedValue(null);
    (getPending as jest.Mock).mockResolvedValue(null);
    (getIgnored as jest.Mock).mockResolvedValue(null);
    (getConnection as jest.Mock).mockReturnValueOnce({
      lean: jest.fn().mockResolvedValueOnce(mockConnections[2]),
    });
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

  it('should successfully remove a pending connection request (id1 → id2)', async () => {
    profileModel.findById.mockReturnValueOnce({
      lean: jest.fn().mockResolvedValueOnce(mockProfiles[1]),
    });
    (getPending as jest.Mock).mockResolvedValueOnce(mockConnections[0]);
    (getIgnored as jest.Mock).mockResolvedValueOnce(null);
    userConnectionModel.findByIdAndDelete = jest.fn().mockResolvedValueOnce({});

    await service.removeRequest(
      mockProfiles[0]._id.toString(),
      mockProfiles[1]._id.toString(),
    );

    expect(userConnectionModel.findByIdAndDelete).toHaveBeenCalledWith(
      mockConnections[0]._id,
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

  it('should successfully accept connection request and increment count and follow', async () => {
    profileModel.findById.mockReturnValueOnce({
      lean: jest.fn().mockResolvedValueOnce(mockProfiles[0]),
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
    const constructorMock = jest.fn().mockImplementation(() => followInstance);
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

  it('should successfully ignore connection request', async () => {
    profileModel.findById.mockReturnValueOnce({
      lean: jest.fn().mockResolvedValueOnce(mockProfiles[2]),
    });
    (getPending as jest.Mock).mockResolvedValueOnce(mockConnections[1]);
    userConnectionModel.findByIdAndUpdate = jest
      .fn()
      .mockResolvedValueOnce(mockConnections[1]);
    await service.updateConnection(
      mockProfiles[2]._id.toString(),
      mockProfiles[0]._id.toString(),
      { isAccept: false },
    );
    expect(userConnectionModel.findByIdAndUpdate).toHaveBeenCalledWith(
      mockConnections[1]._id,
      expect.objectContaining({ status: ConnectionStatus.Ignored }),
      { new: true },
    );
  });

  it('should throw NotFoundException when user is not found', async () => {
    profileModel.findById.mockReturnValueOnce({
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

  it('should throw NotFoundException when connection request does not exist', async () => {
    profileModel.findById.mockReturnValueOnce({
      lean: jest.fn().mockResolvedValueOnce(mockProfiles[0]),
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

  it('should successfully remove a connection and decrement connection count (id2 → id4)', async () => {
    profileModel.findById.mockReturnValueOnce({
      lean: jest.fn().mockResolvedValueOnce(mockProfiles[3]),
    });

    (getConnection as jest.Mock).mockResolvedValueOnce(mockConnections[3]); // connection1
    (getConnection as jest.Mock).mockResolvedValueOnce(null); // connection2
    (getFollow as jest.Mock).mockResolvedValueOnce(null);

    // simulate return of the deleted connection
    userConnectionModel.findByIdAndDelete = jest
      .fn()
      .mockImplementation((id) => {
        return Promise.resolve(
          mockConnections.find((conn) => conn._id.equals(id)),
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

  it('should successfully follow a user (id1 → id5)', async () => {
    profileModel.findById.mockReturnValueOnce({
      lean: jest.fn().mockResolvedValueOnce(mockProfiles[4]),
    });

    (getBlocked as jest.Mock).mockResolvedValueOnce(null);
    (getBlocked as jest.Mock).mockResolvedValueOnce(null);
    (getFollow as jest.Mock).mockResolvedValueOnce(null);

    const saveMock = jest.fn();
    const followInstance = { save: saveMock };
    const constructorMock = jest.fn().mockImplementation(() => followInstance);
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
    (getFollow as jest.Mock).mockResolvedValueOnce(mockConnections[7]); // id4 → id1

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

  it('should throw ForbiddenException if users are blocked (id2 → id5)', async () => {
    profileModel.findById.mockReturnValueOnce({
      lean: jest.fn().mockResolvedValueOnce(mockProfiles[4]),
    });

    (getBlocked as jest.Mock).mockResolvedValueOnce(
      mockConnections.find(
        (conn) =>
          conn.sending_party.equals(mockProfiles[1]._id) &&
          conn.receiving_party.equals(mockProfiles[4]._id) &&
          conn.status === ConnectionStatus.Blocked,
      ),
    );

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

  it('should successfully unfollow a user (id4 → id1)', async () => {
    profileModel.findById.mockReturnValueOnce({
      lean: jest.fn().mockResolvedValueOnce(mockProfiles[0]),
    });

    (getFollow as jest.Mock).mockResolvedValueOnce(mockConnections[7]); // id4 → id1

    userConnectionModel.findByIdAndDelete = jest
      .fn()
      .mockResolvedValueOnce(mockConnections[7]);

    await service.unfollow(
      mockProfiles[3]._id.toString(),
      mockProfiles[0]._id.toString(),
    );

    expect(userConnectionModel.findByIdAndDelete).toHaveBeenCalledWith(
      mockConnections[7]._id,
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

  describe('ConnectionsService - getConnections', () => {
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
        const profile = mockProfiles.find((p) => p._id.toString() === id);
        return {
          ...profile,
          _id: profile!._id,
          created_at: mockConnections.find(
            (c) =>
              (c.sending_party.equals(userId) &&
                c.receiving_party.equals(profile!._id)) ||
              (c.receiving_party.equals(userId) &&
                c.sending_party.equals(profile!._id)),
          )?.created_at,
        };
      });

      mockAggregate(aggregateResult);
      mockFindConnected(expected);

      const result = await service.getConnections(
        subId,
        userId,
        page,
        limit,
        by,
        direction,
        name,
      );
      expect(result.map((r) => r.userId)).toEqual(expected);
      for (const r of result) {
        expect(r.isConnected).toBe(false);
      }
    };

    it('should return profiles sorted by created_at ascending (id1 → id2)', async () => {
      await expectResultOrder(
        mockProfiles[0]._id.toString(),
        [mockProfiles[1]._id.toString(), mockProfiles[3]._id.toString()],
        1,
        1,
      );
    });

    it('should return profiles sorted by created_at descending', async () => {
      await expectResultOrder(
        mockProfiles[0]._id.toString(),
        [mockProfiles[3]._id.toString(), mockProfiles[1]._id.toString()],
        1,
        -1,
      );
    });

    it('should return filtered profile with name = "testing"', async () => {
      await expectResultOrder(
        mockProfiles[0]._id.toString(),
        [mockProfiles[1]._id.toString()],
        1,
        1,
        'testing',
      );
    });

    it('should return profiles sorted by first_name ascending', async () => {
      await expectResultOrder(
        mockProfiles[0]._id.toString(),
        [mockProfiles[1]._id.toString(), mockProfiles[3]._id.toString()],
        2,
        1,
      );
    });

    it('should return profiles sorted by first_name descending', async () => {
      await expectResultOrder(
        mockProfiles[0]._id.toString(),
        [mockProfiles[3]._id.toString(), mockProfiles[1]._id.toString()],
        2,
        -1,
      );
    });

    it('should return profiles sorted by last_name ascending', async () => {
      await expectResultOrder(
        mockProfiles[0]._id.toString(),
        [mockProfiles[3]._id.toString(), mockProfiles[1]._id.toString()],
        3,
        1,
      );
    });

    it('should return profiles sorted by last_name descending', async () => {
      await expectResultOrder(
        mockProfiles[0]._id.toString(),
        [mockProfiles[1]._id.toString(), mockProfiles[3]._id.toString()],
        3,
        -1,
      );
    });
  });
});

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// it('should return the connection ID when a match is found (id3 → id4)', async () => {
//   const sendingParty = mockProfiles[2]._id.toString();
//   const receivingParty = mockProfiles[4]._id.toString();

//   const expectedConnection = mockConnections.find(
//     (conn) =>
//       conn.sending_party.equals(sendingParty) &&
//       conn.receiving_party.equals(receivingParty),
//   );

//   userConnectionModel.findOne.mockReturnValueOnce({
//     lean: jest.fn().mockResolvedValueOnce(expectedConnection),
//   });

//   const result = await service.getConnectionId(sendingParty, receivingParty);
//   expect(result?.toString()).toEqual(expectedConnection?._id.toString());
//   expect(userConnectionModel.findOne).toHaveBeenCalledWith({
//     sending_party: expect.any(Types.ObjectId),
//     receiving_party: expect.any(Types.ObjectId),
//   });
// });

// it('should return null when no connection is found (id2 → id5)', async () => {
//   const sendingParty = mockProfiles[1]._id.toString();
//   const receivingParty = mockProfiles[4]._id.toString();

//   userConnectionModel.findOne.mockReturnValueOnce({
//     lean: jest.fn().mockResolvedValueOnce(null),
//   });

//   const result = await service.getConnectionId(sendingParty, receivingParty);
//   expect(result).toBeNull();
//   expect(userConnectionModel.findOne).toHaveBeenCalledWith({
//     sending_party: expect.any(Types.ObjectId),
//     receiving_party: expect.any(Types.ObjectId),
//   });
// });

// it('should return only 2 profiles when filtering by name = "testing"', async () => {
//   const filtered = mockProfiles.filter((p) =>
//     p.name.toLowerCase().includes('testing'),
//   );

//   profileModel.find.mockReturnValueOnce({
//     select: jest.fn().mockReturnValueOnce({
//       lean: jest.fn().mockResolvedValueOnce(filtered),
//     }),
//   });

//   const result = await service.searchUsers('testing');
//   expect(result).toHaveLength(2);
//   expect(result.map((r) => r.username)).toEqual([
//     'Testing User1',
//     'Testing User2',
//   ]);
//   expect(profileModel.find).toHaveBeenCalledWith({
//     name: { $regex: 'testing', $options: 'i' },
//   });
// });

// it('should throw ConflictException if connection already exists (id2 → id3)', async () => {
//   const sendingParty = mockProfiles[1]._id.toString();
//   const createRequestDto: CreateRequestDto = {
//     userId: mockProfiles[2]._id.toString(),
//   };

//   profileModel.findById.mockReturnValueOnce({
//     lean: jest.fn().mockResolvedValue(mockProfiles[2]),
//   });

//   jest
//     .spyOn(service, 'getConnectionId')
//     .mockResolvedValueOnce(new Types.ObjectId())
//     .mockResolvedValueOnce(null);

//   await expect(
//     service.requestConnection(sendingParty, createRequestDto),
//   ).rejects.toThrow(ConflictException);
// });

// it('should throw BadRequestException if user tries to connect with themselves (id1 → id1)', async () => {
//   const sendingParty = mockProfiles[0]._id.toString();
//   const createRequestDto: CreateRequestDto = {
//     userId: mockProfiles[0]._id.toString(),
//   };
//   profileModel.findById.mockReturnValueOnce({
//     lean: jest.fn().mockResolvedValue(mockProfiles[0]),
//   });

//   await expect(
//     service.requestConnection(sendingParty, createRequestDto),
//   ).rejects.toThrow(BadRequestException);
// });

// it('should throw NotFoundException if target user not found (id1 → newId)', async () => {
//   const sendingParty = mockProfiles[0]._id.toString();
//   const fakeId = new Types.ObjectId().toString();
//   const createRequestDto: CreateRequestDto = {
//     userId: fakeId,
//   };

//   profileModel.findById.mockReturnValueOnce({
//     lean: jest.fn().mockResolvedValue(null),
//   });

//   await expect(
//     service.requestConnection(sendingParty, createRequestDto),
//   ).rejects.toThrow(NotFoundException);
// });

// it('should create a new pending connection if no conflict (id1 → id5)', async () => {
//   const sendingParty = mockProfiles[0]._id.toString();
//   const createRequestDto: CreateRequestDto = {
//     userId: mockProfiles[4]._id.toString(),
//   };

//   profileModel.findById.mockReturnValueOnce({
//     lean: jest.fn().mockResolvedValue(mockProfiles[4]),
//   });

//   jest
//     .spyOn(service, 'getConnectionId')
//     .mockResolvedValueOnce(null)
//     .mockResolvedValueOnce(null);
//   const mockSave = jest.fn();
//   const mockConstructor = jest.fn().mockImplementation(() => ({
//     save: mockSave,
//   }));

//   (service as any).userConnectionModel = mockConstructor;

//   await expect(
//     service.requestConnection(sendingParty, createRequestDto),
//   ).resolves.not.toThrow();

//   expect(mockSave).toHaveBeenCalled();
// });

// it('should update connection to Connected if isAccept is true (id1 → id2)', async () => {
//   const sendingParty = mockProfiles[0]._id.toString();
//   const receivingParty = mockProfiles[1]._id.toString();
//   const updateRequestDto: UpdateRequestDto = { isAccept: true };
//   profileModel.findById.mockReturnValueOnce({
//     lean: jest.fn().mockResolvedValue(mockProfiles[0]),
//   });

//   jest
//     .spyOn(service, 'getConnectionId')
//     .mockResolvedValue(new Types.ObjectId());

//   userConnectionModel.findById.mockReturnValueOnce({
//     lean: jest.fn().mockResolvedValue({
//       _id: new Types.ObjectId(),
//       status: ConnectionStatus.Pending,
//       sending_party: mockProfiles[0]._id,
//       receiving_party: mockProfiles[1]._id,
//     }),
//   });

//   userConnectionModel.findByIdAndUpdate.mockResolvedValueOnce({
//     sending_party: mockProfiles[0]._id,
//     receiving_party: mockProfiles[1]._id,
//   });

//   profileModel.findByIdAndUpdate.mockResolvedValue({});

//   jest.spyOn(service, 'getPendingRequests').mockResolvedValue([]);

//   const result = await service.updateConnection(
//     sendingParty,
//     receivingParty,
//     updateRequestDto,
//   );

//   expect(result).toEqual([]);
//   expect(profileModel.findByIdAndUpdate).toHaveBeenCalledTimes(2);
// });

// it('should update connection to Ignored if isAccept is false (id3 → id2)', async () => {
//   const sendingParty = mockProfiles[2]._id.toString();
//   const receivingParty = mockProfiles[1]._id.toString();
//   const updateRequestDto: UpdateRequestDto = { isAccept: false };

//   profileModel.findById.mockReturnValueOnce({
//     lean: jest.fn().mockResolvedValue(mockProfiles[2]),
//   });

//   jest
//     .spyOn(service, 'getConnectionId')
//     .mockResolvedValue(new Types.ObjectId());

//   userConnectionModel.findById.mockReturnValueOnce({
//     lean: jest.fn().mockResolvedValue({
//       _id: new Types.ObjectId(),
//       status: ConnectionStatus.Pending,
//     }),
//   });

//   userConnectionModel.findByIdAndUpdate.mockResolvedValueOnce({
//     sending_party: mockProfiles[2]._id,
//     receiving_party: mockProfiles[1]._id,
//   });

//   jest.spyOn(service, 'getPendingRequests').mockResolvedValue([]);

//   const result = await service.updateConnection(
//     sendingParty,
//     receivingParty,
//     updateRequestDto,
//   );

//   expect(result).toEqual([]);
//   expect(profileModel.findByIdAndUpdate).not.toHaveBeenCalled();
// });

// it('should throw NotFoundException if sending party does not exist', async () => {
//   const sendingParty = new Types.ObjectId().toString();
//   const receivingParty = mockProfiles[1]._id.toString();
//   const updateRequestDto = { isAccept: true };

//   profileModel.findById.mockReturnValueOnce({
//     lean: jest.fn().mockResolvedValueOnce(null),
//   });

//   await expect(
//     service.updateConnection(sendingParty, receivingParty, updateRequestDto),
//   ).rejects.toThrow(NotFoundException);

//   expect(profileModel.findById).toHaveBeenCalledWith(
//     new Types.ObjectId(sendingParty),
//   );
// });

// it('should throw NotFoundException if no connection request exists (id4 → id5)', async () => {
//   const sendingParty = mockProfiles[3]._id.toString();
//   const receivingParty = mockProfiles[4]._id.toString();
//   const updateRequestDto: UpdateRequestDto = { isAccept: true };

//   profileModel.findById.mockReturnValueOnce({
//     lean: jest.fn().mockResolvedValue(mockProfiles[3]),
//   });

//   jest.spyOn(service, 'getConnectionId').mockResolvedValue(null);

//   await expect(
//     service.updateConnection(sendingParty, receivingParty, updateRequestDto),
//   ).rejects.toThrow(NotFoundException);
// });

// it('should throw BadRequestException if connection status is not Pending (id4 → id1)', async () => {
//   const sendingParty = mockProfiles[3]._id.toString();
//   const receivingParty = mockProfiles[0]._id.toString();
//   const updateRequestDto: UpdateRequestDto = { isAccept: true };

//   profileModel.findById.mockReturnValueOnce({
//     lean: jest.fn().mockResolvedValue(mockProfiles[3]),
//   });

//   jest
//     .spyOn(service, 'getConnectionId')
//     .mockResolvedValue(new Types.ObjectId());

//   userConnectionModel.findById.mockReturnValueOnce({
//     lean: jest.fn().mockResolvedValue({
//       _id: new Types.ObjectId(),
//       status: ConnectionStatus.Following,
//     }),
//   });

//   await expect(
//     service.updateConnection(sendingParty, receivingParty, updateRequestDto),
//   ).rejects.toThrow(BadRequestException);
// });

// it('should throw BadRequestException if users are not connected (id3 → id4)', async () => {
//   const sendingParty = mockProfiles[2]._id.toString();
//   const receivingParty = mockProfiles[3]._id.toString();

//   profileModel.findById.mockReturnValueOnce({
//     lean: jest.fn().mockResolvedValue(mockProfiles[3]),
//   });

//   jest
//     .spyOn(service, 'getConnectionId')
//     .mockResolvedValueOnce(mockConnections[4]._id)
//     .mockResolvedValueOnce(null);

//   userConnectionModel.findById = jest.fn().mockResolvedValue({
//     status: ConnectionStatus.Following,
//   });

//   await expect(
//     service.removeConnection(sendingParty, receivingParty),
//   ).rejects.toThrow(BadRequestException);
// });

// it('should throw BadRequestException if users are not connected (id4 → id3)', async () => {
//   const sendingParty = mockProfiles[3]._id.toString();
//   const receivingParty = mockProfiles[2]._id.toString();

//   profileModel.findById.mockReturnValueOnce({
//     lean: jest.fn().mockResolvedValue(mockProfiles[2]),
//   });

//   jest
//     .spyOn(service, 'getConnectionId')
//     .mockResolvedValueOnce(null)
//     .mockResolvedValueOnce(mockConnections[4]._id);

//   userConnectionModel.findById = jest.fn().mockResolvedValue({
//     status: ConnectionStatus.Following,
//   });

//   await expect(
//     service.removeConnection(sendingParty, receivingParty),
//   ).rejects.toThrow(BadRequestException);
// });

// it('should throw NotFoundException if receving party does not exist', async () => {
//   const receivingParty = new Types.ObjectId().toString();
//   const sendingParty = mockProfiles[1]._id.toString();
//   const updateRequestDto = { isAccept: true };

//   profileModel.findById.mockReturnValueOnce({
//     lean: jest.fn().mockResolvedValueOnce(null),
//   });

//   await expect(
//     service.removeConnection(sendingParty, receivingParty),
//   ).rejects.toThrow(NotFoundException);

//   expect(profileModel.findById).toHaveBeenCalledWith(
//     new Types.ObjectId(receivingParty),
//   );
// });

// it('should remove connection if connected (id2 → id4)', async () => {
//   const sendingParty = mockProfiles[1]._id.toString();
//   const receivingParty = mockProfiles[3]._id.toString();

//   profileModel.findById.mockReturnValueOnce({
//     lean: jest.fn().mockResolvedValue(mockProfiles[3]),
//   });

//   jest
//     .spyOn(service, 'getConnectionId')
//     .mockResolvedValueOnce(mockConnections[3]._id)
//     .mockResolvedValueOnce(null);

//   const deletedConnection = {
//     _id: mockConnections[3]._id,
//     sending_party: mockProfiles[1]._id,
//     receiving_party: mockProfiles[3]._id,
//     status: ConnectionStatus.Connected,
//   };

//   userConnectionModel.findById = jest
//     .fn()
//     .mockResolvedValue(deletedConnection);
//   userConnectionModel.findByIdAndDelete = jest
//     .fn()
//     .mockResolvedValue(deletedConnection);
//   profileModel.findByIdAndUpdate = jest.fn();

//   await expect(
//     service.removeConnection(sendingParty, receivingParty),
//   ).resolves.not.toThrow();

//   expect(userConnectionModel.findByIdAndDelete).toHaveBeenCalledWith(
//     mockConnections[3]._id,
//   );
//   expect(profileModel.findByIdAndUpdate).toHaveBeenCalledTimes(2);
// });

// it('should remove a connection through connectionId2 path (id4 → id2)', async () => {
//   const sendingParty = mockProfiles[3]._id.toString();
//   const receivingParty = mockProfiles[1]._id.toString();

//   const connection = mockConnections.find(
//     (conn) =>
//       conn.sending_party.equals(receivingParty) &&
//       conn.receiving_party.equals(sendingParty) &&
//       conn.status === ConnectionStatus.Connected,
//   );

//   profileModel.findById.mockReturnValueOnce({
//     lean: jest.fn().mockResolvedValueOnce(mockProfiles[1]),
//   });
//   jest
//     .spyOn(service, 'getConnectionId')
//     .mockResolvedValueOnce(null)
//     .mockResolvedValueOnce(connection?._id!);

//   userConnectionModel.findById.mockResolvedValueOnce(connection);

//   userConnectionModel.findByIdAndDelete.mockResolvedValueOnce(connection);

//   profileModel.findByIdAndUpdate.mockResolvedValueOnce({});

//   await expect(
//     service.removeConnection(sendingParty, receivingParty),
//   ).resolves.not.toThrow();

//   expect(userConnectionModel.findByIdAndDelete).toHaveBeenCalledWith(
//     connection?._id,
//   );
// });

// it('should throw NotFoundException if no connection exists (id3 → id5)', async () => {
//   const sendingParty = mockProfiles[2]._id.toString();
//   const receivingParty = mockProfiles[4]._id.toString();

//   profileModel.findById.mockReturnValueOnce({
//     lean: jest.fn().mockResolvedValue(mockProfiles[4]),
//   });

//   jest
//     .spyOn(service, 'getConnectionId')
//     .mockResolvedValueOnce(null)
//     .mockResolvedValueOnce(null);

//   await expect(
//     service.removeConnection(sendingParty, receivingParty),
//   ).rejects.toThrow(NotFoundException);
// });

// it('should throw ConflictException if connection already exists (id1 → id2)', async () => {
//   const sendingParty = mockProfiles[0]._id.toString();
//   const createRequestDto: CreateRequestDto = {
//     userId: mockProfiles[1]._id.toString(),
//   };

//   profileModel.findById.mockReturnValueOnce({
//     lean: jest.fn().mockResolvedValue(mockProfiles[1]),
//   });

//   jest
//     .spyOn(service, 'getConnectionId')
//     .mockResolvedValueOnce(new Types.ObjectId());

//   await expect(
//     service.follow(sendingParty, createRequestDto),
//   ).rejects.toThrow(ConflictException);
// });

// it('should throw BadRequestException if trying to follow yourself (id3 → id3)', async () => {
//   const sendingParty = mockProfiles[2]._id.toString();
//   const createRequestDto: CreateRequestDto = {
//     userId: mockProfiles[2]._id.toString(),
//   };

//   profileModel.findById.mockReturnValueOnce({
//     lean: jest.fn().mockResolvedValue(mockProfiles[2]),
//   });

//   await expect(
//     service.follow(sendingParty, createRequestDto),
//   ).rejects.toThrow(BadRequestException);
// });

// it('should throw NotFoundException if target user not found (id1 → newId)', async () => {
//   const sendingParty = mockProfiles[0]._id.toString();
//   const fakeId = new Types.ObjectId().toString();
//   const createRequestDto: CreateRequestDto = {
//     userId: fakeId,
//   };

//   profileModel.findById.mockReturnValueOnce({
//     lean: jest.fn().mockResolvedValue(null),
//   });

//   await expect(
//     service.follow(sendingParty, createRequestDto),
//   ).rejects.toThrow(NotFoundException);
// });

// it('should create a follow connection if no existing connection (id2 → id5)', async () => {
//   const sendingParty = mockProfiles[1]._id.toString();
//   const createRequestDto: CreateRequestDto = {
//     userId: mockProfiles[4]._id.toString(),
//   };

//   profileModel.findById.mockReturnValueOnce({
//     lean: jest.fn().mockResolvedValue(mockProfiles[4]),
//   });

//   jest.spyOn(service, 'getConnectionId').mockResolvedValueOnce(null);

//   const mockSave = jest.fn();
//   const mockConstructor = jest.fn().mockImplementation(() => ({
//     save: mockSave,
//   }));
//   (service as any).userConnectionModel = mockConstructor;

//   await expect(
//     service.follow(sendingParty, createRequestDto),
//   ).resolves.not.toThrow();

//   expect(mockSave).toHaveBeenCalled();
// });

// it('should create a follow connection in opposite direction (id2 → id1)', async () => {
//   const sendingParty = mockProfiles[1]._id.toString();
//   const createRequestDto: CreateRequestDto = {
//     userId: mockProfiles[0]._id.toString(),
//   };

//   profileModel.findById.mockReturnValueOnce({
//     lean: jest.fn().mockResolvedValue(mockProfiles[0]),
//   });

//   jest.spyOn(service, 'getConnectionId').mockResolvedValueOnce(null);

//   const mockSave = jest.fn();
//   const mockConstructor = jest.fn().mockImplementation(() => ({
//     save: mockSave,
//   }));
//   (service as any).userConnectionModel = mockConstructor;

//   await expect(
//     service.follow(sendingParty, createRequestDto),
//   ).resolves.not.toThrow();

//   expect(mockSave).toHaveBeenCalled();
// });

// it('should throw BadRequestException if connection is not following (id1 → id2)', async () => {
//   const sendingParty = mockProfiles[0]._id.toString();
//   const receivingParty = mockProfiles[1]._id.toString();

//   profileModel.findById.mockReturnValueOnce({
//     lean: jest.fn().mockResolvedValue(mockProfiles[1]),
//   });

//   jest
//     .spyOn(service, 'getConnectionId')
//     .mockResolvedValueOnce(mockConnections[0]._id);

//   userConnectionModel.findById.mockResolvedValueOnce({
//     ...mockConnections[0],
//     status: ConnectionStatus.Connected,
//   });

//   await expect(
//     service.unfollow(sendingParty, receivingParty),
//   ).rejects.toThrow(BadRequestException);
// });

// it('should successfully unfollow a user if connection is following (id4 → id1)', async () => {
//   const sendingParty = mockProfiles[3]._id.toString();
//   const receivingParty = mockProfiles[0]._id.toString();

//   profileModel.findById.mockReturnValueOnce({
//     lean: jest.fn().mockResolvedValue(mockProfiles[0]),
//   });

//   jest
//     .spyOn(service, 'getConnectionId')
//     .mockResolvedValueOnce(mockConnections[5]._id);

//   userConnectionModel.findById.mockResolvedValueOnce({
//     ...mockConnections[5],
//     status: ConnectionStatus.Following,
//   });

//   userConnectionModel.findByIdAndDelete.mockResolvedValueOnce(
//     mockConnections[5],
//   );

//   await expect(
//     service.unfollow(sendingParty, receivingParty),
//   ).resolves.not.toThrow();

//   expect(userConnectionModel.findByIdAndDelete).toHaveBeenCalledWith(
//     mockConnections[5]._id,
//   );
// });

// it('should throw NotFoundException if receiving user does not exist (id3 → newId)', async () => {
//   const sendingParty = mockProfiles[2]._id.toString();
//   const receivingParty = new Types.ObjectId().toString();

//   profileModel.findById.mockReturnValueOnce({
//     lean: jest.fn().mockResolvedValue(null),
//   });

//   await expect(
//     service.unfollow(sendingParty, receivingParty),
//   ).rejects.toThrow(NotFoundException);
// });

// it('should throw NotFoundException if follow connection does not exist (id3 → id5)', async () => {
//   const sendingParty = mockProfiles[2]._id.toString();
//   const receivingParty = mockProfiles[4]._id.toString();

//   profileModel.findById.mockReturnValueOnce({
//     lean: jest.fn().mockResolvedValue(mockProfiles[4]),
//   });

//   jest.spyOn(service, 'getConnectionId').mockResolvedValueOnce(null);

//   await expect(
//     service.unfollow(sendingParty, receivingParty),
//   ).rejects.toThrow(NotFoundException);
// });

// it('should return 2 connected profiles for user id2 (id3 and id4)', async () => {
//   const userId = mockProfiles[1]._id.toString();

//   userConnectionModel.find.mockReturnValueOnce({
//     sort: jest.fn().mockReturnValueOnce({
//       select: jest.fn().mockReturnValueOnce({
//         lean: jest.fn().mockResolvedValueOnce([
//           {
//             sending_party: mockProfiles[1]._id,
//             receiving_party: mockProfiles[2]._id,
//             created_at: new Date().toISOString(),
//           },
//           {
//             sending_party: mockProfiles[1]._id,
//             receiving_party: mockProfiles[3]._id,
//             created_at: new Date().toISOString(),
//           },
//         ]),
//       }),
//     }),
//   });

//   profileModel.findById
//     .mockReturnValueOnce({
//       select: jest.fn().mockReturnValueOnce({
//         lean: jest.fn().mockResolvedValueOnce(mockProfiles[2]),
//       }),
//     })
//     .mockReturnValueOnce({
//       select: jest.fn().mockReturnValueOnce({
//         lean: jest.fn().mockResolvedValueOnce(mockProfiles[3]),
//       }),
//     });

//   const result = await service.getConnections(userId);

//   expect(result).toHaveLength(2);
//   expect(result.map((r) => r.userId?.toString())).toEqual([
//     mockProfiles[2]._id.toString(),
//     mockProfiles[3]._id.toString(),
//   ]);
// });

// it('should return an empty array if user id1 has no connections', async () => {
//   const userId = mockProfiles[0]._id.toString();

//   userConnectionModel.find.mockReturnValueOnce({
//     sort: jest.fn().mockReturnValueOnce({
//       select: jest.fn().mockReturnValueOnce({
//         lean: jest.fn().mockResolvedValueOnce([]),
//       }),
//     }),
//   });

//   const result = await service.getConnections(userId);

//   expect(result).toEqual([]);
// });

// it('should return an empty array if user id1 has no pending requests', async () => {
//   const userId = mockProfiles[0]._id.toString();

//   userConnectionModel.find.mockReturnValueOnce({
//     sort: jest.fn().mockReturnValueOnce({
//       select: jest.fn().mockReturnValueOnce({
//         lean: jest.fn().mockResolvedValueOnce([]),
//       }),
//     }),
//   });

//   const result = await service.getPendingRequests(userId);
//   expect(result).toEqual([]);
// });

// it('should return profile1 as sender if user id2 has one pending request', async () => {
//   const userId = mockProfiles[1]._id.toString();

//   const pendingConnection = {
//     sending_party: mockProfiles[0]._id,
//     receiving_party: mockProfiles[1]._id,
//     created_at: new Date().toISOString(),
//   };

//   userConnectionModel.find.mockReturnValueOnce({
//     sort: jest.fn().mockReturnValueOnce({
//       select: jest.fn().mockReturnValueOnce({
//         lean: jest.fn().mockResolvedValueOnce([pendingConnection]),
//       }),
//     }),
//   });

//   profileModel.findById.mockReturnValueOnce({
//     select: jest.fn().mockReturnValueOnce({
//       lean: jest.fn().mockResolvedValueOnce(mockProfiles[0]),
//     }),
//   });

//   const result = await service.getPendingRequests(userId);
//   expect(result).toHaveLength(1);
//   expect(result[0].userId?.toString()).toEqual(
//     mockProfiles[0]._id.toString(),
//   );
// });

// it('should return an empty array if user id2 has no sent requests', async () => {
//   const userId = mockProfiles[1]._id.toString();

//   userConnectionModel.find.mockReturnValueOnce({
//     sort: jest.fn().mockReturnValueOnce({
//       select: jest.fn().mockReturnValueOnce({
//         lean: jest.fn().mockResolvedValueOnce([]),
//       }),
//     }),
//   });

//   const result = await service.getSentRequests(userId);
//   expect(result).toEqual([]);
// });

// it('should return profile1 as receiver if user id3 has one sent request', async () => {
//   const userId = mockProfiles[2]._id.toString();

//   const pendingConnection = {
//     sending_party: mockProfiles[2]._id,
//     receiving_party: mockProfiles[0]._id,
//     created_at: new Date().toISOString(),
//   };

//   userConnectionModel.find.mockReturnValueOnce({
//     sort: jest.fn().mockReturnValueOnce({
//       select: jest.fn().mockReturnValueOnce({
//         lean: jest.fn().mockResolvedValueOnce([pendingConnection]),
//       }),
//     }),
//   });

//   profileModel.findById.mockReturnValueOnce({
//     select: jest.fn().mockReturnValueOnce({
//       lean: jest.fn().mockResolvedValueOnce(mockProfiles[0]),
//     }),
//   });

//   const result = await service.getSentRequests(userId);
//   expect(result).toHaveLength(1);
//   expect(result[0].userId?.toString()).toEqual(
//     mockProfiles[0]._id.toString(),
//   );
// });

// it('should return an empty array if user id3 has no followers', async () => {
//   const userId = mockProfiles[2]._id.toString();

//   userConnectionModel.find.mockReturnValueOnce({
//     sort: jest.fn().mockReturnValueOnce({
//       select: jest.fn().mockReturnValueOnce({
//         lean: jest.fn().mockResolvedValueOnce([]),
//       }),
//     }),
//   });

//   const result = await service.getFollowers(userId);
//   expect(result).toEqual([]);
// });

// it('should return profile3 as follower if user id4 has one follower', async () => {
//   const userId = mockProfiles[3]._id.toString();

//   const followConnection = {
//     sending_party: mockProfiles[2]._id,
//     receiving_party: mockProfiles[3]._id,
//     created_at: new Date().toISOString(),
//   };

//   userConnectionModel.find.mockReturnValueOnce({
//     sort: jest.fn().mockReturnValueOnce({
//       select: jest.fn().mockReturnValueOnce({
//         lean: jest.fn().mockResolvedValueOnce([followConnection]),
//       }),
//     }),
//   });

//   profileModel.findById.mockReturnValueOnce({
//     select: jest.fn().mockReturnValueOnce({
//       lean: jest.fn().mockResolvedValueOnce(mockProfiles[2]),
//     }),
//   });

//   const result = await service.getFollowers(userId);
//   expect(result).toHaveLength(1);
//   expect(result[0].userId?.toString()).toEqual(
//     mockProfiles[2]._id.toString(),
//   );
// });

// it('should return an empty array if user id1 does not follow any user', async () => {
//   const userId = mockProfiles[0]._id.toString();

//   userConnectionModel.find.mockReturnValueOnce({
//     sort: jest.fn().mockReturnValueOnce({
//       select: jest.fn().mockReturnValueOnce({
//         lean: jest.fn().mockResolvedValueOnce([]),
//       }),
//     }),
//   });

//   const result = await service.getFollowing(userId);
//   expect(result).toEqual([]);
// });

// it('should return profile1 as a followed user if user id4 follows one user', async () => {
//   const userId = mockProfiles[3]._id.toString();

//   const followConnection = {
//     sending_party: mockProfiles[3]._id,
//     receiving_party: mockProfiles[0]._id,
//     created_at: new Date().toISOString(),
//   };

//   userConnectionModel.find.mockReturnValueOnce({
//     sort: jest.fn().mockReturnValueOnce({
//       select: jest.fn().mockReturnValueOnce({
//         lean: jest.fn().mockResolvedValueOnce([followConnection]),
//       }),
//     }),
//   });

//   profileModel.findById.mockReturnValueOnce({
//     select: jest.fn().mockReturnValueOnce({
//       lean: jest.fn().mockResolvedValueOnce(mockProfiles[0]),
//     }),
//   });

//   const result = await service.getFollowing(userId);
//   expect(result).toHaveLength(1);
//   expect(result[0].userId?.toString()).toEqual(
//     mockProfiles[0]._id.toString(),
//   );
// });
