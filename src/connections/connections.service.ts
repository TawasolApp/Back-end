import {
  BadRequestException,
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
      let status: ConnectionStatus;
      status = isAccept ? ConnectionStatus.Connected : ConnectionStatus.Ignored;
      return this.userConnectionModel.findByIdAndUpdate(
        connectionId,
        { status: status, created_at: new Date().toISOString() },
        { new: true },
      );
    } catch (error) {
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

// import {
//   BadRequestException,
//   Injectable,
//   InternalServerErrorException,
//   NotFoundException,
// } from '@nestjs/common';
// import { InjectModel } from '@nestjs/mongoose';
// import { Model } from 'mongoose';
// import {
//   UserConnection,
//   UserConnectionDocument,
// } from './infrastructure/database/user-connection.schema';
// import { ConnectionStatus } from './infrastructure/connection-status.enum';

// @Injectable()
// export class ConnectionsService {
//   constructor(
//     @InjectModel(UserConnection.name)
//     private readonly userConnectionModel: Model<UserConnectionDocument>,
//   ) {}

//   async requestConnection(sendingParty: string, receivingParty: string) {
//     try {
//       if (sendingParty === receivingParty) {
//         throw new BadRequestException('Cannot request a connection with yourself.');
//       }
//       const newConnection = new this.userConnectionModel({
//         _id: new Types.ObjectId,
//         sending_party: sendingParty,
//         receiving_party: receivingParty,
//         status: ConnectionStatus.Pending,
//       });

//       return await newConnection.save();
//     } catch (error) {
//       throw new InternalServerErrorException('Failed to save connection.');
//     }
//   }

//   async updateConnection(connectionId: string, isAccept: boolean) {
//     try {
//       const existingConnection = await this.userConnectionModel.findById(connectionId);

//       if (!existingConnection) {
//         throw new NotFoundException('Connection not found.');
//       }

//       if (existingConnection.status !== ConnectionStatus.Pending) {
//         throw new BadRequestException('Only pending connections can be accepted or ignored.');
//       }
//       const status: ConnectionStatus = isAccept
//         ? ConnectionStatus.Connected
//         : ConnectionStatus.Ignored;

//       return await this.userConnectionModel.findByIdAndUpdate(
//         connectionId,
//         { status },
//         { new: true },
//       );
//     } catch (error) {
//       throw new InternalServerErrorException('Failed to update connection status.');
//     }
//   }

//   async removeConnection(connectionId: string) {
//     try {
//       const deletedConnection = await this.userConnectionModel.findByIdAndDelete(connectionId);

//       if (!deletedConnection) {
//         throw new NotFoundException('Connection not found.');
//       }

//       return { message: 'Connection removed successfully' };
//     } catch (error) {
//       throw new InternalServerErrorException('Failed to remove connection.');
//     }
//   }

//   async follow(sendingParty: string, receivingParty: string) {
//     try {
//       if (sendingParty === receivingParty) {
//         throw new BadRequestException('Cannot follow yourself.');
//       }

//       const existingFollow = await this.userConnectionModel.exists({
//         sending_party: sendingParty,
//         receiving_party: receivingParty,
//         status: ConnectionStatus.Following,
//       });

//       if (existingFollow) {
//         throw new BadRequestException('You are already following this user.');
//       }

//       const newConnection = new this.userConnectionModel({
//         sending_party: sendingParty,
//         receiving_party: receivingParty,
//         status: ConnectionStatus.Following,
//       });

//       return await newConnection.save();
//     } catch (error) {
//       throw new InternalServerErrorException('Failed to save follow.');
//     }
//   }

//   async getConnection(sendingParty: string, receivingParty: string) {
//     const connection = await this.userConnectionModel.findOne({
//       sending_party: sendingParty,
//       receiving_party: receivingParty,
//     }).lean();

//     if (!connection) {
//       throw new NotFoundException('Connection not found.');
//     }

//     return connection;
//   }

//   async getConnections(userId: string) {
//     return await this.userConnectionModel
//       .find({
//         $or: [{ sending_party: userId }, { receiving_party: userId }],
//         status: ConnectionStatus.Connected,
//       })
//       .lean();
//   }

//   async getPendingRequests(userId: string) {
//     return await this.userConnectionModel
//       .find({
//         receiving_party: userId,
//         status: ConnectionStatus.Pending,
//       })
//       .lean();
//   }

//   async getSentRequests(userId: string) {
//     return await this.userConnectionModel
//       .find({
//         sending_party: userId,
//         status: ConnectionStatus.Pending,
//       })
//       .lean();
//   }
// }
