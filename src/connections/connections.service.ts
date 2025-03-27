import {
  BadRequestException,
  ConflictException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  UserConnection,
  UserConnectionDocument,
} from './infrastructure/database/user-connection.schema';
import {
  Profile,
  ProfileDocument,
} from '../profiles/infrastructure/database/profile.schema';
import { ConnectionStatus } from './infrastructure/connection-status.enum';
import { toGetUserDto } from './dtos/user.mapper';
import { CreateRequestDto } from './dtos/create-request.dto';
import { UpdateRequestDto } from './dtos/update-request.dto';

@Injectable()
export class ConnectionsService {
  constructor(
    @InjectModel(UserConnection.name)
    private readonly userConnectionModel: Model<UserConnectionDocument>,
    @InjectModel(Profile.name)
    private readonly profileModel: Model<ProfileDocument>,
  ) {}

  async getConnectionId(sendingParty: string, receivingParty: string) {
    const connectionRecord = await this.userConnectionModel
      .findOne({
        sending_party: new Types.ObjectId(sendingParty),
        receiving_party: new Types.ObjectId(receivingParty),
      })
      .lean<{ _id: Types.ObjectId }>();

    return connectionRecord?._id || null;
  }

  async searchUsers(name?: string, company?: string, industry?: string) {
    const filter: any = {};
    if (name) {
      filter.name = { $regex: name, $options: 'i' };
    }
    if (company) {
      filter.industry = { $regex: company, $options: 'i' };
    }
    if (industry) {
      filter.industry = { $regex: industry, $options: 'i' };
    }
    const users = await this.profileModel
      .find(filter)
      .select('_id name profile_picture headline')
      .lean();
    return users.map(toGetUserDto);
  }

  async requestConnection(
    sendingParty: string,
    createRequestDto: CreateRequestDto,
  ) {
    try {
      const { userId } = createRequestDto;
      const receivingParty = userId;
      const exisitngUser = await this.profileModel
        .findById(new Types.ObjectId(receivingParty))
        .lean();
      if (!exisitngUser) {
        throw new NotFoundException('User not found.');
      }
      if (sendingParty === receivingParty) {
        throw new BadRequestException(
          'Cannot request a connection with yourself.',
        );
      }
      const record1 = await this.getConnectionId(sendingParty, receivingParty);
      const record2 = await this.getConnectionId(receivingParty, sendingParty);
      if (record1 || record2) {
        throw new ConflictException(
          'Connection instance already estbalished between users.',
        );
      }
      const newConnection = new this.userConnectionModel({
        _id: new Types.ObjectId(),
        sending_party: new Types.ObjectId(sendingParty),
        receiving_party: new Types.ObjectId(receivingParty),
        status: ConnectionStatus.Pending,
      });
      await newConnection.save();
    } catch (error) {
      throw error;
    }
  }

  async updateConnection(
    sendingParty: string,
    receivingParty: string,
    updateRequestDto: UpdateRequestDto,
  ) {
    try {
      const exisitngUser = await this.profileModel
        .findById(new Types.ObjectId(sendingParty))
        .lean();
      if (!exisitngUser) {
        throw new NotFoundException('User not found.');
      }
      const connectionId = await this.getConnectionId(
        sendingParty,
        receivingParty,
      );
      if (!connectionId) {
        throw new NotFoundException('Connection request was not found.');
      }
      const existingConnection = await this.userConnectionModel
        .findById(new Types.ObjectId(connectionId))
        .lean();
      if (existingConnection?.status !== ConnectionStatus.Pending) {
        throw new BadRequestException(
          'Only pending connections can be accepted/ignored.',
        );
      }
      const { isAccept } = updateRequestDto;
      const status = isAccept
        ? ConnectionStatus.Connected
        : ConnectionStatus.Ignored;
      const updatedConnection =
        await this.userConnectionModel.findByIdAndUpdate(
          new Types.ObjectId(connectionId),
          { status: status, created_at: new Date().toISOString() },
          { new: true },
        );
      if (status === ConnectionStatus.Connected) {
        await this.profileModel.findByIdAndUpdate(
          updatedConnection?.sending_party,
          { $inc: { connection_count: 1 } },
          { new: true },
        );
        await this.profileModel.findByIdAndUpdate(
          updatedConnection?.receiving_party,
          { $inc: { connection_count: 1 } },
          { new: true },
        );
      }
      return this.getPendingRequests(sendingParty);
    } catch (error) {
      throw error;
    }
  }

  async removeConnection(sendingParty: string, receivingParty: string) {
    try {
      const exisitngUser = await this.profileModel
        .findById(new Types.ObjectId(receivingParty))
        .lean();
      if (!exisitngUser) {
        throw new NotFoundException('User not found.');
      }
      const connectionId1 = await this.getConnectionId(
        sendingParty,
        receivingParty,
      );
      const connectionId2 = await this.getConnectionId(
        receivingParty,
        sendingParty,
      );
      let deletedConnection;
      if (!connectionId1 && !connectionId2) {
        throw new NotFoundException('Connection not found.');
      } else if (connectionId1) {
        const connection = await this.userConnectionModel.findById(
          new Types.ObjectId(connectionId1),
        );
        if (connection?.status === ConnectionStatus.Connected) {
          deletedConnection = await this.userConnectionModel.findByIdAndDelete(
            new Types.ObjectId(connectionId1),
          );
        } else {
          throw new BadRequestException('Cannot remove a non-connection.');
        }
      } else if (connectionId2) {
        const connection = await this.userConnectionModel.findById(
          new Types.ObjectId(connectionId2),
        );
        if (connection?.status === ConnectionStatus.Connected) {
          deletedConnection = await this.userConnectionModel.findByIdAndDelete(
            new Types.ObjectId(connectionId2),
          );
        } else {
          throw new BadRequestException('Cannot remove a non-connection.');
        }
      }
      await this.profileModel.findByIdAndUpdate(
        deletedConnection?.sending_party,
        { $inc: { connection_count: -1 } },
        { new: true },
      );
      await this.profileModel.findByIdAndUpdate(
        deletedConnection?.receiving_party,
        { $inc: { connection_count: -1 } },
        { new: true },
      );
    } catch (error) {
      throw error;
    }
  }

  async follow(sendingParty: string, createRequestDto: CreateRequestDto) {
    try {
      const { userId } = createRequestDto;
      const receivingParty = userId;
      const exisitngUser = await this.profileModel
        .findById(new Types.ObjectId(receivingParty))
        .lean();
      if (!exisitngUser) {
        throw new NotFoundException('User not found.');
      }
      if (sendingParty === receivingParty) {
        throw new BadRequestException('Cannot follow yourself.');
      }
      const record = await this.getConnectionId(sendingParty, receivingParty);
      if (record) {
        throw new ConflictException('Follow instance already exists.');
      }
      const newConnection = new this.userConnectionModel({
        _id: new Types.ObjectId(),
        sending_party: new Types.ObjectId(sendingParty),
        receiving_party: new Types.ObjectId(receivingParty),
        status: ConnectionStatus.Following,
      });
      await newConnection.save();
    } catch (error) {
      throw error;
    }
  }

  async unfollow(sendingParty: string, receivingParty: string) {
    try {
      const exisitngUser = await this.profileModel
        .findById(new Types.ObjectId(receivingParty))
        .lean();
      if (!exisitngUser) {
        throw new NotFoundException('User not found.');
      }
      const connectionId = await this.getConnectionId(
        sendingParty,
        receivingParty,
      );
      let deletedConnection;
      if (!connectionId) {
        throw new NotFoundException('Follow not found.');
      }
      const connection = await this.userConnectionModel.findById(
        new Types.ObjectId(connectionId),
      );
      if (connection?.status === ConnectionStatus.Following) {
        deletedConnection = await this.userConnectionModel.findByIdAndDelete(
          new Types.ObjectId(connectionId),
        );
      } else {
        throw new BadRequestException(
          'Cannot unfollow a user who is not followed.',
        );
      }
    } catch (error) {
      throw error;
    }
  }

  async getConnections(userId: string) {
    const connections = await this.userConnectionModel
      .find({
        $or: [
          { sending_party: new Types.ObjectId(userId) },
          { receiving_party: new Types.ObjectId(userId) },
        ],
        status: ConnectionStatus.Connected,
      })
      .sort({ created_at: -1 })
      .select('sending_party receiving_party created_at')
      .lean();
    const result = await Promise.all(
      connections.map(async (connection) => {
        const otherUserId = connection.sending_party.equals(
          new Types.ObjectId(userId),
        )
          ? connection.receiving_party
          : connection.sending_party;
        const profile = await this.profileModel
          .findById(otherUserId)
          .select('name profile_picture headline')
          .lean();
        return {
          userId: profile?._id,
          username: profile?.name,
          profilePicture: profile?.profile_picture,
          headline: profile?.headline,
          createdAt: connection.created_at,
        };
      }),
    );
    return result;
  }

  async getPendingRequests(userId: string) {
    const pendingRequests = await this.userConnectionModel
      .find({
        receiving_party: new Types.ObjectId(userId),
        status: ConnectionStatus.Pending,
      })
      .sort({ created_at: -1 })
      .select('sending_party receiving_party created_at')
      .lean();

    const result = await Promise.all(
      pendingRequests.map(async (connection) => {
        const senderUserId = connection.sending_party;

        const profile = await this.profileModel
          .findById(senderUserId)
          .select('name profile_picture headline')
          .lean();

        return {
          userId: profile?._id,
          username: profile?.name,
          profilePicture: profile?.profile_picture,
          headline: profile?.headline,
          createdAt: connection.created_at,
        };
      }),
    );
    return result;
  }

  async getSentRequests(userId: string) {
    const sentRequests = await this.userConnectionModel
      .find({
        sending_party: new Types.ObjectId(userId),
        status: ConnectionStatus.Pending,
      })
      .sort({ created_at: -1 })
      .select('sending_party receiving_party created_at')
      .lean();

    const result = await Promise.all(
      sentRequests.map(async (connection) => {
        const receiverUserId = connection.receiving_party;

        const profile = await this.profileModel
          .findById(receiverUserId)
          .select('name profile_picture headline')
          .lean();

        return {
          userId: profile?._id,
          username: profile?.name,
          profilePicture: profile?.profile_picture,
          headline: profile?.headline,
          createdAt: connection.created_at,
        };
      }),
    );
    return result;
  }

  async getFollowers(userId: string) {
    const pendingRequests = await this.userConnectionModel
      .find({
        receiving_party: new Types.ObjectId(userId),
        status: ConnectionStatus.Following,
      })
      .sort({ created_at: -1 })
      .select('sending_party receiving_party created_at')
      .lean();

    const result = await Promise.all(
      pendingRequests.map(async (connection) => {
        const senderUserId = connection.sending_party;

        const profile = await this.profileModel
          .findById(senderUserId)
          .select('name profile_picture headline')
          .lean();

        return {
          userId: profile?._id,
          username: profile?.name,
          profilePicture: profile?.profile_picture,
          headline: profile?.headline,
          createdAt: connection.created_at,
        };
      }),
    );
    return result;
  }

  async getFollowing(userId: string) {
    const sentRequests = await this.userConnectionModel
      .find({
        sending_party: new Types.ObjectId(userId),
        status: ConnectionStatus.Following,
      })
      .sort({ created_at: -1 })
      .select('sending_party receiving_party created_at')
      .lean();

    const result = await Promise.all(
      sentRequests.map(async (connection) => {
        const receiverUserId = connection.receiving_party;

        const profile = await this.profileModel
          .findById(receiverUserId)
          .select('name profile_picture headline')
          .lean();

        return {
          userId: profile?._id,
          username: profile?.name,
          profilePicture: profile?.profile_picture,
          headline: profile?.headline,
          createdAt: connection.created_at,
        };
      }),
    );
    return result;
  }
}
