import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  UserConnection,
  UserConnectionDocument,
} from './infrastructure/database/schemas/user-connection.schema';
import {
  Profile,
  ProfileDocument,
} from '../profiles/infrastructure/database/schemas/profile.schema';
import { ConnectionStatus } from './enums/connection-status.enum';
import { toGetUserDto } from '../common/mappers/user.mapper';
import { GetUserDto } from '../common/dtos/get-user.dto';
import { CreateRequestDto } from './dtos/create-request.dto';
import { UpdateRequestDto } from './dtos/update-request.dto';
import { handleError } from '../common/utils/exception-handler';
import {
  getConnection,
  getFollow,
  getPending,
} from './helpers/connection-helpers';
import { AddEndoresementDto } from './dtos/add-endorsement.dto';

@Injectable()
export class ConnectionsService {
  constructor(
    @InjectModel(UserConnection.name)
    private readonly userConnectionModel: Model<UserConnectionDocument>,
    @InjectModel(Profile.name)
    private readonly profileModel: Model<ProfileDocument>,
  ) {}

  async searchUsers(name?: string, company?: string, page?: number, limit?: number): Promise<GetUserDto[]> {
    try {
      const filter: any = {};
      if (name) {
        filter.name = { $regex: name, $options: 'i' };
      }
      // if (company) {
      //   filter.industry = { $regex: company, $options: 'i' };
      // }
      const users = await this.profileModel
        .find(filter)
        .select('_id name profile_picture headline')
        .lean();
      return users.map(toGetUserDto);
    } catch (error) {
      handleError(error, 'Failed to retrieve list of users.');
    }
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
      const request1 = await getPending(
        this.userConnectionModel,
        sendingParty,
        receivingParty,
      );
      const request2 = await getPending(
        this.userConnectionModel,
        receivingParty,
        sendingParty,
      );
      if (request1 || request2) {
        throw new ConflictException(
          'Connection request already estbalished between users.',
        );
      }
      const connection1 = await getConnection(
        this.userConnectionModel,
        sendingParty,
        receivingParty,
      );
      const connection2 = await getConnection(
        this.userConnectionModel,
        receivingParty,
        sendingParty,
      );
      if (connection1 || connection2) {
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
      handleError(error, 'Failed to request connection.');
    }
  }

  async removeRequest(
    sendingParty: string,
    receivingParty: string,
  ): Promise<GetUserDto[]> {
    try {
      const exisitngUser = await this.profileModel
        .findById(new Types.ObjectId(receivingParty))
        .lean();
      if (!exisitngUser) {
        throw new NotFoundException('User not found.');
      }
      const existingRequest = await getPending(
        this.userConnectionModel,
        sendingParty,
        receivingParty,
      );
      if (!existingRequest) {
        throw new NotFoundException(
          'Pending connection request was not found.',
        );
      }
      await this.userConnectionModel.findByIdAndDelete(existingRequest._id);
      return this.getPendingRequests(sendingParty);
    } catch (error) {
      handleError(error, 'Failed to remove pending request.');
    }
  }
  async updateConnection(
    sendingParty: string,
    receivingParty: string,
    updateRequestDto: UpdateRequestDto,
  ): Promise<GetUserDto[]> {
    try {
      const exisitngUser = await this.profileModel
        .findById(new Types.ObjectId(sendingParty))
        .lean();
      if (!exisitngUser) {
        throw new NotFoundException('User not found.');
      }
      const existingRequest = await getPending(
        this.userConnectionModel,
        sendingParty,
        receivingParty,
      );
      if (!existingRequest) {
        throw new NotFoundException('Connection request was not found.');
      }
      const { isAccept } = updateRequestDto;
      const status = isAccept
        ? ConnectionStatus.Connected
        : ConnectionStatus.Ignored;
      const updatedConnection =
        await this.userConnectionModel.findByIdAndUpdate(
          existingRequest._id,
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
        const newFollow = new this.userConnectionModel({
          _id: new Types.ObjectId(),
          sending_party: new Types.ObjectId(sendingParty),
          receiving_party: new Types.ObjectId(receivingParty),
          status: ConnectionStatus.Following,
        });
        await newFollow.save();
      }
      return this.getPendingRequests(receivingParty);
    } catch (error) {
      handleError(error, 'Failed to update connection request status.');
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
      const connection1 = await getConnection(
        this.userConnectionModel,
        sendingParty,
        receivingParty,
      );
      const connection2 = await getConnection(
        this.userConnectionModel,
        receivingParty,
        sendingParty,
      );
      const follow = await getFollow(
        this.userConnectionModel,
        sendingParty,
        receivingParty,
      );
      let deletedConnection;
      if (!connection1 && !connection2) {
        throw new NotFoundException('Connection instance not found.');
      } else {
        await this.userConnectionModel.findByIdAndDelete(follow?._id);
        if (connection1) {
          deletedConnection = await this.userConnectionModel.findByIdAndDelete(
            connection1._id,
          );
        } else if (connection2) {
          deletedConnection = await this.userConnectionModel.findByIdAndDelete(
            connection2._id,
          );
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
      handleError(error, 'Failed to remove connection.');
    }
  }

  async getConnections(userId: string, page?: number, limit?: number): Promise<GetUserDto[]> {
    try {
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
      const usersDto = await Promise.all(
        connections.map(async (connection) => {
          const otherUserId = connection.sending_party.equals(
            new Types.ObjectId(userId),
          )
            ? connection.receiving_party
            : connection.sending_party;
          const profile = await this.profileModel
            .findById(otherUserId)
            .select('_id name profile_picture headline')
            .lean();
          const userDto = toGetUserDto(profile!);
          userDto.createdAt = connection.created_at;
          return userDto;
        }),
      );
      return usersDto;
    } catch (error) {
      handleError(error, 'Failed to retrieve list of connections.');
    }
  }

  async getPendingRequests(userId: string, page?: number, limit?: number): Promise<GetUserDto[]> {
    try {
      const pendingRequests = await this.userConnectionModel
        .find({
          receiving_party: new Types.ObjectId(userId),
          status: ConnectionStatus.Pending,
        })
        .sort({ created_at: -1 })
        .select('sending_party receiving_party created_at')
        .lean();

      const usersDto = await Promise.all(
        pendingRequests.map(async (connection) => {
          const senderUserId = connection.sending_party;

          const profile = await this.profileModel
            .findById(senderUserId)
            .select('_id name profile_picture headline')
            .lean();
          const userDto = toGetUserDto(profile!);
          userDto.createdAt = connection.created_at;
          return userDto;
        }),
      );
      return usersDto;
    } catch (error) {
      handleError(
        error,
        'Failed to retrieve list of pending connection requests.',
      );
    }
  }

  async getSentRequests(userId: string, page?: number, limit?: number): Promise<GetUserDto[]> {
    try {
      const sentRequests = await this.userConnectionModel
        .find({
          sending_party: new Types.ObjectId(userId),
          status: ConnectionStatus.Pending,
        })
        .sort({ created_at: -1 })
        .select('sending_party receiving_party created_at')
        .lean();

      const usersDto = await Promise.all(
        sentRequests.map(async (connection) => {
          const receiverUserId = connection.receiving_party;

          const profile = await this.profileModel
            .findById(receiverUserId)
            .select('name profile_picture headline')
            .lean();
          const userDto = toGetUserDto(profile!);
          userDto.createdAt = connection.created_at;
          return userDto;
        }),
      );
      return usersDto;
    } catch (error) {
      handleError(
        error,
        'Failed to retrieve list of sent connection requests.',
      );
    }
  }

  async getRecommendedUsers(userId: string, page?: number, limit?: number): Promise<GetUserDto[]> {
    try {
      const connections = await this.userConnectionModel
        .find({
          $or: [
            {
              $and: [
                {
                  status: {
                    $in: [
                      ConnectionStatus.Connected,
                      ConnectionStatus.Following,
                    ],
                  },
                },
                {
                  $or: [
                    { sending_party: new Types.ObjectId(userId) },
                    { receiving_party: new Types.ObjectId(userId) },
                  ],
                },
              ],
            },
            {
              status: ConnectionStatus.Pending,
              sending_party: new Types.ObjectId(userId),
            },
          ],
        })
        .select('sending_party receiving_party')
        .lean();
      const excludedUserIds = new Set<string>();
      connections.forEach((connection) => {
        excludedUserIds.add(connection.sending_party.toString());
        excludedUserIds.add(connection.receiving_party.toString());
      });
      excludedUserIds.add(userId);
      const recommendedProfiles = await this.profileModel
        .find({
          _id: {
            $nin: Array.from(excludedUserIds).map(
              (id) => new Types.ObjectId(id),
            ),
          },
        })
        .select('_id name profile_picture headline')
        .lean();
      return recommendedProfiles.map(toGetUserDto);
    } catch (error) {
      handleError(error, 'Failed to retrieve people you may know.');
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
      const existingFollow = await getFollow(
        this.userConnectionModel,
        sendingParty,
        receivingParty,
      );
      if (existingFollow) {
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
      handleError(error, 'Failed to follow user.');
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
      const existingFollow = await getFollow(
        this.userConnectionModel,
        sendingParty,
        receivingParty,
      );
      let deletedConnection;
      if (!existingFollow) {
        throw new NotFoundException('Follow instance not found.');
      }
      deletedConnection = await this.userConnectionModel.findByIdAndDelete(
        existingFollow._id,
      );
    } catch (error) {
      handleError(error, 'Failed to unfollow user.');
    }
  }

  async getFollowers(userId: string, page?: number, limit?: number): Promise<GetUserDto[]> {
    try {
      const pendingRequests = await this.userConnectionModel
        .find({
          receiving_party: new Types.ObjectId(userId),
          status: ConnectionStatus.Following,
        })
        .sort({ created_at: -1 })
        .select('sending_party receiving_party created_at')
        .lean();

      const usersDto = await Promise.all(
        pendingRequests.map(async (connection) => {
          const senderUserId = connection.sending_party;

          const profile = await this.profileModel
            .findById(senderUserId)
            .select('name profile_picture headline')
            .lean();
          const userDto = toGetUserDto(profile!);
          userDto.createdAt = connection.created_at;
          return userDto;
        }),
      );
      return usersDto;
    } catch (error) {
      handleError(error, 'Failed to retrieve list of followers.');
    }
  }

  async getFollowing(userId: string, page?: number, limit?: number): Promise<GetUserDto[]> {
    try {
      const sentRequests = await this.userConnectionModel
        .find({
          sending_party: new Types.ObjectId(userId),
          status: ConnectionStatus.Following,
        })
        .sort({ created_at: -1 })
        .select('sending_party receiving_party created_at')
        .lean();

      const usersDto = await Promise.all(
        sentRequests.map(async (connection) => {
          const receiverUserId = connection.receiving_party;

          const profile = await this.profileModel
            .findById(receiverUserId)
            .select('name profile_picture headline')
            .lean();
          const userDto = toGetUserDto(profile!);
          userDto.createdAt = connection.created_at;
          return userDto;
        }),
      );
      return usersDto;
    } catch (error) {
      handleError(error, 'Failed to retrieve list followed users.');
    }
  }

  async endorseSkill(
    endorserId: string,
    userId: string,
    addEndorsementDto: AddEndoresementDto,
  ): Promise<GetUserDto[]> {
    try {
      const exisitngUser = await this.profileModel.findById(
        new Types.ObjectId(userId),
      );
      if (!exisitngUser) {
        throw new NotFoundException('Endorsee profile not found.');
      }
      if (endorserId === userId) {
        throw new BadRequestException('User cannot endorse their own skill.');
      }
      const { skillName } = addEndorsementDto;
      const skill = exisitngUser.skills?.find(
        (s) => s.skill_name === skillName,
      );
      if (!skill) {
        throw new NotFoundException('Skill not found in endorsee profile.');
      }
      if (
        skill.endorsements?.some((id) =>
          id.equals(new Types.ObjectId(endorserId)),
        )
      ) {
        throw new ConflictException(
          'Endorser has already endorsed this skill.',
        );
      }
      skill.endorsements.push(new Types.ObjectId(endorserId));
      await exisitngUser.save();
      const endorsers = await this.profileModel
        .find({ _id: { $in: skill.endorsements } })
        .select('_id name profile_picture')
        .lean();
      const endorsersDto = endorsers.map(toGetUserDto);
      return endorsersDto;
    } catch (error) {
      handleError(error, 'Failed to endorse skill.');
    }
  }
}
