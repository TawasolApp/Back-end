import {
  BadRequestException,
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

@Injectable()
export class ConnectionsService {
  constructor(
    @InjectModel(UserConnection.name)
    private readonly userConnectionModel: Model<UserConnectionDocument>,
    @InjectModel(Profile.name)
    private readonly profileModel: Model<ProfileDocument>,
  ) {}

  async requestConnection(sendingParty: string, receivingParty: string) {
    try {
      if (sendingParty === receivingParty) {
        throw new BadRequestException(
          'Cannot request a connection with yourself.',
        );
      }
      // TODO: check if valid user id
      // TODO: check if connection exists and status is blocked
      if (
        !Types.ObjectId.isValid(sendingParty) ||
        !Types.ObjectId.isValid(receivingParty)
      ) {
        throw new BadRequestException('Invalid user ID format.');
      }
      const newConnection = new this.userConnectionModel({
        _id: new Types.ObjectId(),
        sending_party: new Types.ObjectId(sendingParty),
        receiving_party: new Types.ObjectId(receivingParty),
        status: ConnectionStatus.Pending,
      });
      await newConnection.save();
      return newConnection;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to save connection.');
    }
  }

  async updateConnection(connectionId: string, isAccept: boolean) {
    try {
      if (!Types.ObjectId.isValid(connectionId)) {
        throw new BadRequestException('Invalid connection ID format.');
      }
      const existingConnection = await this.userConnectionModel
        .findById(new Types.ObjectId(connectionId))
        .lean();
      if (!existingConnection) {
        throw new NotFoundException('Connection not found.');
      }
      if (existingConnection.status !== ConnectionStatus.Pending) {
        throw new BadRequestException(
          'Only pending connections can be accepted/ignored.',
        );
      }
      const status: ConnectionStatus = isAccept
        ? ConnectionStatus.Connected
        : ConnectionStatus.Ignored;
      const updatedConnection =
        await this.userConnectionModel.findByIdAndUpdate(
          new Types.ObjectId(connectionId),
          { status: status, created_at: new Date().toISOString() },
          { new: true },
        );
      return updatedConnection;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to update connection request status.',
      );
    }
  }

  async removeConnection(connectionId: string) {
    try {
      if (!Types.ObjectId.isValid(connectionId)) {
        throw new BadRequestException('Invalid connection ID format.');
      }
      const connection = this.userConnectionModel.findByIdAndDelete(
        new Types.ObjectId(connectionId),
      );
      if (!connection) {
        throw new NotFoundException('Connection not found.');
      }
      return connection;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to remove connection.');
    }
  }

  async follow(sendingParty: string, receivingParty: string) {
    try {
      if (sendingParty === receivingParty) {
        throw new BadRequestException('Cannot follow yourself.');
      }
      // TODO: check if valid user id
      // TODO: check if connection exists and status is blocked
      if (
        !Types.ObjectId.isValid(sendingParty) ||
        !Types.ObjectId.isValid(receivingParty)
      ) {
        throw new BadRequestException('Invalid user ID format.');
      }
      const newConnection = new this.userConnectionModel({
        _id: new Types.ObjectId(),
        sending_party: new Types.ObjectId(sendingParty),
        receiving_party: new Types.ObjectId(receivingParty),
        status: ConnectionStatus.Following,
      });
      await newConnection.save();
      return newConnection;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to save follow.');
    }
  }

  async getConnection(sendingParty: string, receivingParty: string) {
    const connection = this.userConnectionModel
      .findOne({
        sending_party: new Types.ObjectId(sendingParty),
        receiving_party: new Types.ObjectId(receivingParty),
      })
      .lean();
    if (!connection) {
      throw new NotFoundException('Connection not found.');
    }
    return connection;
  }

  // async getConnections(userId: string) {
  //   return this.userConnectionModel
  //     .find({
  //       $or: [
  //         { sending_party: new Types.ObjectId(userId) },
  //         { receiving_party: new Types.ObjectId(userId) },
  //       ],
  //       status: ConnectionStatus.Connected,
  //     })
  //     .sort({ created_at: -1 })
  //     .lean();
  // }

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

  // async getPendingRequests(userId: string) {
  //   return this.userConnectionModel
  //     .find({
  //       receiving_party: new Types.ObjectId(userId),
  //       status: ConnectionStatus.Pending,
  //     })
  //     .sort({ created_at: -1 })
  //     .lean();
  // }

  // async getSentRequests(userId: string) {
  //   return this.userConnectionModel
  //     .find({
  //       sending_party: new Types.ObjectId(userId),
  //       status: ConnectionStatus.Pending,
  //     })
  //     .sort({ created_at: -1 })
  //     .lean();
  // }

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
}
