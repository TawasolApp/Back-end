import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ConnectionsService } from './connections.service';
import { UserConnection } from './infrastructure/database/user-connection.schema';
import { Profile } from '../profiles/infrastructure/database/profile.schema';
import { mockProfiles, mockConnections } from './mock.data';
import { CreateRequestDto } from './dtos/create-request.dto';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { ConnectionStatus } from './infrastructure/connection-status.enum';
import { UpdateRequestDto } from './dtos/update-request.dto';

describe('ConnectionsService', () => {
  let service: ConnectionsService;
  // used to hold mock model instances
  let userConnectionModel: any;
  let profileModel: any;

  // mock models to replace Mongoose models
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
          provide: getModelToken(UserConnection.name), // inject mock when UserConnection is requested
          useValue: mockUserConnectionModel,
        },
        {
          provide: getModelToken(Profile.name), // inject mock when Profile is requested
          useValue: mockProfileModel,
        },
      ],
    }).compile();
    service = module.get<ConnectionsService>(ConnectionsService);
    userConnectionModel = module.get(getModelToken(UserConnection.name));
    profileModel = module.get(getModelToken(Profile.name));
    jest.clearAllMocks();
  });

  // verify service istantiation
  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return the connection ID when a match is found (id3 → id4)', async () => {
    const sendingParty = mockProfiles[2]._id.toString();
    const receivingParty = mockProfiles[4]._id.toString();

    const expectedConnection = mockConnections.find(
      (conn) =>
        conn.sending_party.equals(sendingParty) &&
        conn.receiving_party.equals(receivingParty),
    );

    userConnectionModel.findOne.mockReturnValueOnce({
      lean: jest.fn().mockResolvedValueOnce(expectedConnection),
    });

    const result = await service.getConnectionId(sendingParty, receivingParty);
    expect(result?.toString()).toEqual(expectedConnection?._id.toString());
    expect(userConnectionModel.findOne).toHaveBeenCalledWith({
      sending_party: expect.any(Types.ObjectId),
      receiving_party: expect.any(Types.ObjectId),
    });
  });

  it('should return null when no connection is found (id2 → id5)', async () => {
    const sendingParty = mockProfiles[1]._id.toString();
    const receivingParty = mockProfiles[4]._id.toString();

    userConnectionModel.findOne.mockReturnValueOnce({
      lean: jest.fn().mockResolvedValueOnce(null),
    });

    const result = await service.getConnectionId(sendingParty, receivingParty);
    expect(result).toBeNull();
    expect(userConnectionModel.findOne).toHaveBeenCalledWith({
      sending_party: expect.any(Types.ObjectId),
      receiving_party: expect.any(Types.ObjectId),
    });
  });

  it('should return all 5 profiles when filtering by name = "test"', async () => {
    profileModel.find.mockReturnValueOnce({
      select: jest.fn().mockReturnValueOnce({
        lean: jest.fn().mockResolvedValueOnce(mockProfiles),
      }),
    });

    const result = await service.searchUsers('test');
    expect(result).toHaveLength(5);
    expect(result.map((r) => r.username)).toEqual([
      'Testing User1',
      'Testing User2',
      'Test User3',
      'Test User4',
      'Test User5',
    ]);
    expect(profileModel.find).toHaveBeenCalledWith({
      name: { $regex: 'test', $options: 'i' },
    });
  });

  it('should return only 2 profiles when filtering by name = "testing"', async () => {
    const filtered = mockProfiles.filter((p) =>
      p.name.toLowerCase().includes('testing'),
    );

    profileModel.find.mockReturnValueOnce({
      select: jest.fn().mockReturnValueOnce({
        lean: jest.fn().mockResolvedValueOnce(filtered),
      }),
    });

    const result = await service.searchUsers('testing');
    expect(result).toHaveLength(2);
    expect(result.map((r) => r.username)).toEqual([
      'Testing User1',
      'Testing User2',
    ]);
    expect(profileModel.find).toHaveBeenCalledWith({
      name: { $regex: 'testing', $options: 'i' },
    });
  });

  it('should throw ConflictException if connection already exists (id2 → id3)', async () => {
    const sendingParty = mockProfiles[1]._id.toString();
    const createRequestDto: CreateRequestDto = {
      userId: mockProfiles[2]._id.toString(),
    };

    profileModel.findById.mockReturnValueOnce({
      lean: jest.fn().mockResolvedValue(mockProfiles[2]),
    });

    jest
      .spyOn(service, 'getConnectionId')
      .mockResolvedValueOnce(new Types.ObjectId())
      .mockResolvedValueOnce(null);

    await expect(
      service.requestConnection(sendingParty, createRequestDto),
    ).rejects.toThrow(ConflictException);
  });

  it('should throw BadRequestException if user tries to connect with themselves (id1 → id1)', async () => {
    const sendingParty = mockProfiles[0]._id.toString();
    const createRequestDto: CreateRequestDto = {
      userId: mockProfiles[0]._id.toString(),
    };
    profileModel.findById.mockReturnValueOnce({
      lean: jest.fn().mockResolvedValue(mockProfiles[0]),
    });

    await expect(
      service.requestConnection(sendingParty, createRequestDto),
    ).rejects.toThrow(BadRequestException);
  });

  it('should throw NotFoundException if target user not found (id1 → newId)', async () => {
    const sendingParty = mockProfiles[0]._id.toString();
    const fakeId = new Types.ObjectId().toString();
    const createRequestDto: CreateRequestDto = {
      userId: fakeId,
    };

    profileModel.findById.mockReturnValueOnce({
      lean: jest.fn().mockResolvedValue(null),
    });

    await expect(
      service.requestConnection(sendingParty, createRequestDto),
    ).rejects.toThrow(NotFoundException);
  });

  it('should create a new pending connection if no conflict (id1 → id5)', async () => {
    const sendingParty = mockProfiles[0]._id.toString();
    const createRequestDto: CreateRequestDto = {
      userId: mockProfiles[4]._id.toString(),
    };

    profileModel.findById.mockReturnValueOnce({
      lean: jest.fn().mockResolvedValue(mockProfiles[4]),
    });

    jest
      .spyOn(service, 'getConnectionId')
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);
    const mockSave = jest.fn();
    const mockConstructor = jest.fn().mockImplementation(() => ({
      save: mockSave,
    }));

    (service as any).userConnectionModel = mockConstructor;

    await expect(
      service.requestConnection(sendingParty, createRequestDto),
    ).resolves.not.toThrow();

    expect(mockSave).toHaveBeenCalled();
  });

  it('should update connection to Connected if isAccept is true (id1 → id2)', async () => {
    const sendingParty = mockProfiles[0]._id.toString();
    const receivingParty = mockProfiles[1]._id.toString();
    const updateRequestDto: UpdateRequestDto = { isAccept: true };
    profileModel.findById.mockReturnValueOnce({
      lean: jest.fn().mockResolvedValue(mockProfiles[0]),
    });

    jest
      .spyOn(service, 'getConnectionId')
      .mockResolvedValue(new Types.ObjectId());

    userConnectionModel.findById.mockReturnValueOnce({
      lean: jest.fn().mockResolvedValue({
        _id: new Types.ObjectId(),
        status: ConnectionStatus.Pending,
        sending_party: mockProfiles[0]._id,
        receiving_party: mockProfiles[1]._id,
      }),
    });

    userConnectionModel.findByIdAndUpdate.mockResolvedValueOnce({
      sending_party: mockProfiles[0]._id,
      receiving_party: mockProfiles[1]._id,
    });

    profileModel.findByIdAndUpdate.mockResolvedValue({});

    jest.spyOn(service, 'getPendingRequests').mockResolvedValue([]);

    const result = await service.updateConnection(
      sendingParty,
      receivingParty,
      updateRequestDto,
    );

    expect(result).toEqual([]);
    expect(profileModel.findByIdAndUpdate).toHaveBeenCalledTimes(2);
  });

  it('should update connection to Ignored if isAccept is false (id3 → id2)', async () => {
    const sendingParty = mockProfiles[2]._id.toString();
    const receivingParty = mockProfiles[1]._id.toString();
    const updateRequestDto: UpdateRequestDto = { isAccept: false };

    profileModel.findById.mockReturnValueOnce({
      lean: jest.fn().mockResolvedValue(mockProfiles[2]),
    });

    jest
      .spyOn(service, 'getConnectionId')
      .mockResolvedValue(new Types.ObjectId());

    userConnectionModel.findById.mockReturnValueOnce({
      lean: jest.fn().mockResolvedValue({
        _id: new Types.ObjectId(),
        status: ConnectionStatus.Pending,
      }),
    });

    userConnectionModel.findByIdAndUpdate.mockResolvedValueOnce({
      sending_party: mockProfiles[2]._id,
      receiving_party: mockProfiles[1]._id,
    });

    jest.spyOn(service, 'getPendingRequests').mockResolvedValue([]);

    const result = await service.updateConnection(
      sendingParty,
      receivingParty,
      updateRequestDto,
    );

    expect(result).toEqual([]);
    expect(profileModel.findByIdAndUpdate).not.toHaveBeenCalled();
  });

  it('should throw NotFoundException if sending party does not exist', async () => {
    const sendingParty = new Types.ObjectId().toString();
    const receivingParty = mockProfiles[1]._id.toString();
    const updateRequestDto = { isAccept: true };

    profileModel.findById.mockReturnValueOnce({
      lean: jest.fn().mockResolvedValueOnce(null),
    });

    await expect(
      service.updateConnection(sendingParty, receivingParty, updateRequestDto),
    ).rejects.toThrow(NotFoundException);

    expect(profileModel.findById).toHaveBeenCalledWith(
      new Types.ObjectId(sendingParty),
    );
  });

  it('should throw NotFoundException if no connection request exists (id4 → id5)', async () => {
    const sendingParty = mockProfiles[3]._id.toString();
    const receivingParty = mockProfiles[4]._id.toString();
    const updateRequestDto: UpdateRequestDto = { isAccept: true };

    profileModel.findById.mockReturnValueOnce({
      lean: jest.fn().mockResolvedValue(mockProfiles[3]),
    });

    jest.spyOn(service, 'getConnectionId').mockResolvedValue(null);

    await expect(
      service.updateConnection(sendingParty, receivingParty, updateRequestDto),
    ).rejects.toThrow(NotFoundException);
  });

  it('should throw BadRequestException if connection status is not Pending (id4 → id1)', async () => {
    const sendingParty = mockProfiles[3]._id.toString();
    const receivingParty = mockProfiles[0]._id.toString();
    const updateRequestDto: UpdateRequestDto = { isAccept: true };

    profileModel.findById.mockReturnValueOnce({
      lean: jest.fn().mockResolvedValue(mockProfiles[3]),
    });

    jest
      .spyOn(service, 'getConnectionId')
      .mockResolvedValue(new Types.ObjectId());

    userConnectionModel.findById.mockReturnValueOnce({
      lean: jest.fn().mockResolvedValue({
        _id: new Types.ObjectId(),
        status: ConnectionStatus.Following,
      }),
    });

    await expect(
      service.updateConnection(sendingParty, receivingParty, updateRequestDto),
    ).rejects.toThrow(BadRequestException);
  });

  it('should throw BadRequestException if users are not connected (id3 → id4)', async () => {
    const sendingParty = mockProfiles[2]._id.toString();
    const receivingParty = mockProfiles[3]._id.toString();

    profileModel.findById.mockReturnValueOnce({
      lean: jest.fn().mockResolvedValue(mockProfiles[3]),
    });

    jest
      .spyOn(service, 'getConnectionId')
      .mockResolvedValueOnce(mockConnections[4]._id)
      .mockResolvedValueOnce(null);

    userConnectionModel.findById = jest.fn().mockResolvedValue({
      status: ConnectionStatus.Following,
    });

    await expect(
      service.removeConnection(sendingParty, receivingParty),
    ).rejects.toThrow(BadRequestException);
  });

  it('should throw BadRequestException if users are not connected (id4 → id3)', async () => {
    const sendingParty = mockProfiles[3]._id.toString();
    const receivingParty = mockProfiles[2]._id.toString();

    profileModel.findById.mockReturnValueOnce({
      lean: jest.fn().mockResolvedValue(mockProfiles[2]),
    });

    jest
      .spyOn(service, 'getConnectionId')
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(mockConnections[4]._id);

    userConnectionModel.findById = jest.fn().mockResolvedValue({
      status: ConnectionStatus.Following,
    });

    await expect(
      service.removeConnection(sendingParty, receivingParty),
    ).rejects.toThrow(BadRequestException);
  });

  it('should throw NotFoundException if receving party does not exist', async () => {
    const receivingParty = new Types.ObjectId().toString();
    const sendingParty = mockProfiles[1]._id.toString();
    const updateRequestDto = { isAccept: true };

    profileModel.findById.mockReturnValueOnce({
      lean: jest.fn().mockResolvedValueOnce(null),
    });

    await expect(
      service.removeConnection(sendingParty, receivingParty),
    ).rejects.toThrow(NotFoundException);

    expect(profileModel.findById).toHaveBeenCalledWith(
      new Types.ObjectId(receivingParty),
    );
  });

  it('should remove connection if connected (id2 → id4)', async () => {
    const sendingParty = mockProfiles[1]._id.toString();
    const receivingParty = mockProfiles[3]._id.toString();

    profileModel.findById.mockReturnValueOnce({
      lean: jest.fn().mockResolvedValue(mockProfiles[3]),
    });

    jest
      .spyOn(service, 'getConnectionId')
      .mockResolvedValueOnce(mockConnections[3]._id)
      .mockResolvedValueOnce(null);

    const deletedConnection = {
      _id: mockConnections[3]._id,
      sending_party: mockProfiles[1]._id,
      receiving_party: mockProfiles[3]._id,
      status: ConnectionStatus.Connected,
    };

    userConnectionModel.findById = jest
      .fn()
      .mockResolvedValue(deletedConnection);
    userConnectionModel.findByIdAndDelete = jest
      .fn()
      .mockResolvedValue(deletedConnection);
    profileModel.findByIdAndUpdate = jest.fn();

    await expect(
      service.removeConnection(sendingParty, receivingParty),
    ).resolves.not.toThrow();

    expect(userConnectionModel.findByIdAndDelete).toHaveBeenCalledWith(
      mockConnections[3]._id,
    );
    expect(profileModel.findByIdAndUpdate).toHaveBeenCalledTimes(2);
  });

  it('should remove a connection through connectionId2 path (id4 → id2)', async () => {
    const sendingParty = mockProfiles[3]._id.toString();
    const receivingParty = mockProfiles[1]._id.toString();

    const connection = mockConnections.find(
      (conn) =>
        conn.sending_party.equals(receivingParty) &&
        conn.receiving_party.equals(sendingParty) &&
        conn.status === ConnectionStatus.Connected,
    );

    profileModel.findById.mockReturnValueOnce({
      lean: jest.fn().mockResolvedValueOnce(mockProfiles[1]),
    });
    jest
      .spyOn(service, 'getConnectionId')
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(connection?._id!);

    userConnectionModel.findById.mockResolvedValueOnce(connection);

    userConnectionModel.findByIdAndDelete.mockResolvedValueOnce(connection);

    profileModel.findByIdAndUpdate.mockResolvedValueOnce({});

    await expect(
      service.removeConnection(sendingParty, receivingParty),
    ).resolves.not.toThrow();

    expect(userConnectionModel.findByIdAndDelete).toHaveBeenCalledWith(
      connection?._id,
    );
  });

  it('should throw NotFoundException if no connection exists (id3 → id5)', async () => {
    const sendingParty = mockProfiles[2]._id.toString();
    const receivingParty = mockProfiles[4]._id.toString();

    profileModel.findById.mockReturnValueOnce({
      lean: jest.fn().mockResolvedValue(mockProfiles[4]),
    });

    jest
      .spyOn(service, 'getConnectionId')
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);

    await expect(
      service.removeConnection(sendingParty, receivingParty),
    ).rejects.toThrow(NotFoundException);
  });

  it('should throw ConflictException if connection already exists (id1 → id2)', async () => {
    const sendingParty = mockProfiles[0]._id.toString();
    const createRequestDto: CreateRequestDto = {
      userId: mockProfiles[1]._id.toString(),
    };

    profileModel.findById.mockReturnValueOnce({
      lean: jest.fn().mockResolvedValue(mockProfiles[1]),
    });

    jest
      .spyOn(service, 'getConnectionId')
      .mockResolvedValueOnce(new Types.ObjectId());

    await expect(
      service.follow(sendingParty, createRequestDto),
    ).rejects.toThrow(ConflictException);
  });

  it('should throw BadRequestException if trying to follow yourself (id3 → id3)', async () => {
    const sendingParty = mockProfiles[2]._id.toString();
    const createRequestDto: CreateRequestDto = {
      userId: mockProfiles[2]._id.toString(),
    };

    profileModel.findById.mockReturnValueOnce({
      lean: jest.fn().mockResolvedValue(mockProfiles[2]),
    });

    await expect(
      service.follow(sendingParty, createRequestDto),
    ).rejects.toThrow(BadRequestException);
  });

  it('should throw NotFoundException if target user not found (id1 → newId)', async () => {
    const sendingParty = mockProfiles[0]._id.toString();
    const fakeId = new Types.ObjectId().toString();
    const createRequestDto: CreateRequestDto = {
      userId: fakeId,
    };

    profileModel.findById.mockReturnValueOnce({
      lean: jest.fn().mockResolvedValue(null),
    });

    await expect(
      service.follow(sendingParty, createRequestDto),
    ).rejects.toThrow(NotFoundException);
  });

  it('should create a follow connection if no existing connection (id2 → id5)', async () => {
    const sendingParty = mockProfiles[1]._id.toString();
    const createRequestDto: CreateRequestDto = {
      userId: mockProfiles[4]._id.toString(),
    };

    profileModel.findById.mockReturnValueOnce({
      lean: jest.fn().mockResolvedValue(mockProfiles[4]),
    });

    jest.spyOn(service, 'getConnectionId').mockResolvedValueOnce(null);

    const mockSave = jest.fn();
    const mockConstructor = jest.fn().mockImplementation(() => ({
      save: mockSave,
    }));
    (service as any).userConnectionModel = mockConstructor;

    await expect(
      service.follow(sendingParty, createRequestDto),
    ).resolves.not.toThrow();

    expect(mockSave).toHaveBeenCalled();
  });

  it('should create a follow connection in opposite direction (id2 → id1)', async () => {
    const sendingParty = mockProfiles[1]._id.toString();
    const createRequestDto: CreateRequestDto = {
      userId: mockProfiles[0]._id.toString(),
    };

    profileModel.findById.mockReturnValueOnce({
      lean: jest.fn().mockResolvedValue(mockProfiles[0]),
    });

    jest.spyOn(service, 'getConnectionId').mockResolvedValueOnce(null);

    const mockSave = jest.fn();
    const mockConstructor = jest.fn().mockImplementation(() => ({
      save: mockSave,
    }));
    (service as any).userConnectionModel = mockConstructor;

    await expect(
      service.follow(sendingParty, createRequestDto),
    ).resolves.not.toThrow();

    expect(mockSave).toHaveBeenCalled();
  });

  it('should throw BadRequestException if connection is not following (id1 → id2)', async () => {
    const sendingParty = mockProfiles[0]._id.toString();
    const receivingParty = mockProfiles[1]._id.toString();

    profileModel.findById.mockReturnValueOnce({
      lean: jest.fn().mockResolvedValue(mockProfiles[1]),
    });

    jest
      .spyOn(service, 'getConnectionId')
      .mockResolvedValueOnce(mockConnections[0]._id);

    userConnectionModel.findById.mockResolvedValueOnce({
      ...mockConnections[0],
      status: ConnectionStatus.Connected,
    });

    await expect(
      service.unfollow(sendingParty, receivingParty),
    ).rejects.toThrow(BadRequestException);
  });

  it('should successfully unfollow a user if connection is following (id4 → id1)', async () => {
    const sendingParty = mockProfiles[3]._id.toString();
    const receivingParty = mockProfiles[0]._id.toString();

    profileModel.findById.mockReturnValueOnce({
      lean: jest.fn().mockResolvedValue(mockProfiles[0]),
    });

    jest
      .spyOn(service, 'getConnectionId')
      .mockResolvedValueOnce(mockConnections[5]._id);

    userConnectionModel.findById.mockResolvedValueOnce({
      ...mockConnections[5],
      status: ConnectionStatus.Following,
    });

    userConnectionModel.findByIdAndDelete.mockResolvedValueOnce(
      mockConnections[5],
    );

    await expect(
      service.unfollow(sendingParty, receivingParty),
    ).resolves.not.toThrow();

    expect(userConnectionModel.findByIdAndDelete).toHaveBeenCalledWith(
      mockConnections[5]._id,
    );
  });

  it('should throw NotFoundException if receiving user does not exist (id3 → newId)', async () => {
    const sendingParty = mockProfiles[2]._id.toString();
    const receivingParty = new Types.ObjectId().toString();

    profileModel.findById.mockReturnValueOnce({
      lean: jest.fn().mockResolvedValue(null),
    });

    await expect(
      service.unfollow(sendingParty, receivingParty),
    ).rejects.toThrow(NotFoundException);
  });

  it('should throw NotFoundException if follow connection does not exist (id3 → id5)', async () => {
    const sendingParty = mockProfiles[2]._id.toString();
    const receivingParty = mockProfiles[4]._id.toString();

    profileModel.findById.mockReturnValueOnce({
      lean: jest.fn().mockResolvedValue(mockProfiles[4]),
    });

    jest.spyOn(service, 'getConnectionId').mockResolvedValueOnce(null);

    await expect(
      service.unfollow(sendingParty, receivingParty),
    ).rejects.toThrow(NotFoundException);
  });

  it('should return 2 connected profiles for user id2 (id3 and id4)', async () => {
    const userId = mockProfiles[1]._id.toString();

    userConnectionModel.find.mockReturnValueOnce({
      sort: jest.fn().mockReturnValueOnce({
        select: jest.fn().mockReturnValueOnce({
          lean: jest.fn().mockResolvedValueOnce([
            {
              sending_party: mockProfiles[1]._id,
              receiving_party: mockProfiles[2]._id,
              created_at: new Date().toISOString(),
            },
            {
              sending_party: mockProfiles[1]._id,
              receiving_party: mockProfiles[3]._id,
              created_at: new Date().toISOString(),
            },
          ]),
        }),
      }),
    });

    profileModel.findById
      .mockReturnValueOnce({
        select: jest.fn().mockReturnValueOnce({
          lean: jest.fn().mockResolvedValueOnce(mockProfiles[2]),
        }),
      })
      .mockReturnValueOnce({
        select: jest.fn().mockReturnValueOnce({
          lean: jest.fn().mockResolvedValueOnce(mockProfiles[3]),
        }),
      });

    const result = await service.getConnections(userId);

    expect(result).toHaveLength(2);
    expect(result.map((r) => r.userId?.toString())).toEqual([
      mockProfiles[2]._id.toString(),
      mockProfiles[3]._id.toString(),
    ]);
  });

  it('should return an empty array if user id1 has no connections', async () => {
    const userId = mockProfiles[0]._id.toString();

    userConnectionModel.find.mockReturnValueOnce({
      sort: jest.fn().mockReturnValueOnce({
        select: jest.fn().mockReturnValueOnce({
          lean: jest.fn().mockResolvedValueOnce([]),
        }),
      }),
    });

    const result = await service.getConnections(userId);

    expect(result).toEqual([]);
  });

  it('should return an empty array if user id1 has no pending requests', async () => {
    const userId = mockProfiles[0]._id.toString();

    userConnectionModel.find.mockReturnValueOnce({
      sort: jest.fn().mockReturnValueOnce({
        select: jest.fn().mockReturnValueOnce({
          lean: jest.fn().mockResolvedValueOnce([]),
        }),
      }),
    });

    const result = await service.getPendingRequests(userId);
    expect(result).toEqual([]);
  });

  it('should return profile1 as sender if user id2 has one pending request', async () => {
    const userId = mockProfiles[1]._id.toString();

    const pendingConnection = {
      sending_party: mockProfiles[0]._id,
      receiving_party: mockProfiles[1]._id,
      created_at: new Date().toISOString(),
    };

    userConnectionModel.find.mockReturnValueOnce({
      sort: jest.fn().mockReturnValueOnce({
        select: jest.fn().mockReturnValueOnce({
          lean: jest.fn().mockResolvedValueOnce([pendingConnection]),
        }),
      }),
    });

    profileModel.findById.mockReturnValueOnce({
      select: jest.fn().mockReturnValueOnce({
        lean: jest.fn().mockResolvedValueOnce(mockProfiles[0]),
      }),
    });

    const result = await service.getPendingRequests(userId);
    expect(result).toHaveLength(1);
    expect(result[0].userId?.toString()).toEqual(
      mockProfiles[0]._id.toString(),
    );
  });

  it('should return an empty array if user id2 has no sent requests', async () => {
    const userId = mockProfiles[1]._id.toString();

    userConnectionModel.find.mockReturnValueOnce({
      sort: jest.fn().mockReturnValueOnce({
        select: jest.fn().mockReturnValueOnce({
          lean: jest.fn().mockResolvedValueOnce([]),
        }),
      }),
    });

    const result = await service.getSentRequests(userId);
    expect(result).toEqual([]);
  });

  it('should return profile1 as receiver if user id3 has one sent request', async () => {
    const userId = mockProfiles[2]._id.toString();

    const pendingConnection = {
      sending_party: mockProfiles[2]._id,
      receiving_party: mockProfiles[0]._id,
      created_at: new Date().toISOString(),
    };

    userConnectionModel.find.mockReturnValueOnce({
      sort: jest.fn().mockReturnValueOnce({
        select: jest.fn().mockReturnValueOnce({
          lean: jest.fn().mockResolvedValueOnce([pendingConnection]),
        }),
      }),
    });

    profileModel.findById.mockReturnValueOnce({
      select: jest.fn().mockReturnValueOnce({
        lean: jest.fn().mockResolvedValueOnce(mockProfiles[0]),
      }),
    });

    const result = await service.getSentRequests(userId);
    expect(result).toHaveLength(1);
    expect(result[0].userId?.toString()).toEqual(
      mockProfiles[0]._id.toString(),
    );
  });

  it('should return an empty array if user id3 has no followers', async () => {
    const userId = mockProfiles[2]._id.toString();

    userConnectionModel.find.mockReturnValueOnce({
      sort: jest.fn().mockReturnValueOnce({
        select: jest.fn().mockReturnValueOnce({
          lean: jest.fn().mockResolvedValueOnce([]),
        }),
      }),
    });

    const result = await service.getFollowers(userId);
    expect(result).toEqual([]);
  });

  it('should return profile3 as follower if user id4 has one follower', async () => {
    const userId = mockProfiles[3]._id.toString();

    const followConnection = {
      sending_party: mockProfiles[2]._id,
      receiving_party: mockProfiles[3]._id,
      created_at: new Date().toISOString(),
    };

    userConnectionModel.find.mockReturnValueOnce({
      sort: jest.fn().mockReturnValueOnce({
        select: jest.fn().mockReturnValueOnce({
          lean: jest.fn().mockResolvedValueOnce([followConnection]),
        }),
      }),
    });

    profileModel.findById.mockReturnValueOnce({
      select: jest.fn().mockReturnValueOnce({
        lean: jest.fn().mockResolvedValueOnce(mockProfiles[2]),
      }),
    });

    const result = await service.getFollowers(userId);
    expect(result).toHaveLength(1);
    expect(result[0].userId?.toString()).toEqual(
      mockProfiles[2]._id.toString(),
    );
  });

  it('should return an empty array if user id1 does not follow any user', async () => {
    const userId = mockProfiles[0]._id.toString();

    userConnectionModel.find.mockReturnValueOnce({
      sort: jest.fn().mockReturnValueOnce({
        select: jest.fn().mockReturnValueOnce({
          lean: jest.fn().mockResolvedValueOnce([]),
        }),
      }),
    });

    const result = await service.getFollowing(userId);
    expect(result).toEqual([]);
  });

  it('should return profile1 as a followed user if user id4 follows one user', async () => {
    const userId = mockProfiles[3]._id.toString();

    const followConnection = {
      sending_party: mockProfiles[3]._id,
      receiving_party: mockProfiles[0]._id,
      created_at: new Date().toISOString(),
    };

    userConnectionModel.find.mockReturnValueOnce({
      sort: jest.fn().mockReturnValueOnce({
        select: jest.fn().mockReturnValueOnce({
          lean: jest.fn().mockResolvedValueOnce([followConnection]),
        }),
      }),
    });

    profileModel.findById.mockReturnValueOnce({
      select: jest.fn().mockReturnValueOnce({
        lean: jest.fn().mockResolvedValueOnce(mockProfiles[0]),
      }),
    });

    const result = await service.getFollowing(userId);
    expect(result).toHaveLength(1);
    expect(result[0].userId?.toString()).toEqual(
      mockProfiles[0]._id.toString(),
    );
  });
});
