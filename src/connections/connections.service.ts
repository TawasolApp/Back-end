import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
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
import {
  Notification,
  NotificationDocument,
} from '../notifications/infrastructure/database/schemas/notification.schema';
import {
  User,
  UserDocument,
} from '../users/infrastructure/database/schemas/user.schema';
import {
  Company,
  CompanyDocument,
} from '../companies/infrastructure/database/schemas/company.schema';
import {
  CompanyManager,
  CompanyManagerDocument,
} from '../companies/infrastructure/database/schemas/company-manager.schema';
import { ConnectionStatus } from './enums/connection-status.enum';
import { toGetUserDto } from '../common/mappers/user.mapper';
import { GetUserDto } from '../common/dtos/get-user.dto';
import { CreateRequestDto } from './dtos/create-request.dto';
import { UpdateRequestDto } from './dtos/update-request.dto';
import { AddEndoresementDto } from './dtos/add-endorsement.dto';
import {
  getBlocked,
  getBlockedList,
  getConnection,
  getFollow,
  getIgnored,
  getPending,
} from './helpers/connection-helpers';
import { handleError } from '../common/utils/exception-handler';
import { getSortData } from './helpers/sort-helper';
import { NotificationGateway } from '../gateway/notification.gateway';
import {
  addNotification,
  deleteNotification,
} from '../notifications/helpers/notification.helper';

@Injectable()
export class ConnectionsService {
  constructor(
    @InjectModel(UserConnection.name)
    private readonly userConnectionModel: Model<UserConnectionDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(Profile.name)
    private readonly profileModel: Model<ProfileDocument>,
    @InjectModel(Company.name)
    private readonly companyModel: Model<CompanyDocument>,
    @InjectModel(CompanyManager.name)
    private readonly companyManagerModel: Model<CompanyManagerDocument>,
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<NotificationDocument>,
    private readonly notificationGateway: NotificationGateway,
  ) {}

  /**
   * searches for users in the database based on optional name and company filters.
   *
   * @param page - the page number for pagination.
   * @param limit - the maximum number of users to return per page.
   * @param name - (optional) name filter applied to both first and last names using case-insensitive partial match.
   * @param company - (optional) company filter applied to user's work experience history.
   * @returns GetUserDto[] - an array of user DTOs containing essential profile details.
   *
   * function flow:
   * 1. initialize an empty MongoDB filter object.
   * 2. if a name is provided, add a case-insensitive $or filter for first and last names.
   * 3. (optionally) support filtering by company/industry — currently commented out for future use.
   * 4. calculate pagination skip value using page and limit.
   * 5. query the `profileModel` using the constructed filter and applying skip and limit values.
   * 6. map the results to GetUserDto and return array of GetUserDtos.
   */
  async searchUsers(
    userId: string,
    page: number,
    limit: number,
    name?: string,
    company?: string,
  ): Promise<GetUserDto[]> {
    try {
      const filter: any = {};
      if (name) {
        filter.$expr = {
          $regexMatch: {
            input: { $concat: ['$first_name', ' ', '$last_name'] },
            regex: name,
            options: 'i',
          },
        };
      }
      if (company) {
        filter['work_experience.company'] = {
          $regex: company,
          $options: 'i',
        };
      }
      const skip = (page - 1) * limit;
      const users = await this.profileModel
        .find(filter)
        .select('_id first_name last_name profile_picture headline')
        .skip(skip)
        .limit(limit)
        .lean();
      const excludeObjectIds = await getBlockedList(
        this.userConnectionModel,
        userId,
      );
      const excludeIds = excludeObjectIds.map((id) => id.toString());
      const filteredUsers = excludeIds.length
        ? users.filter((user) => !excludeIds.includes(user._id.toString()))
        : users;

      return filteredUsers.map(toGetUserDto);
    } catch (error) {
      handleError(error, 'Failed to retrieve list of users.');
    }
  }

  /**
   * adds a connection request between logged in user and another specified user.
   *
   * @param sendingParty - string ID of the logged in user.
   * @param createRequestDto - contains receivingParty; the string ID of the other user.
   * @throws NotFoundException - if the receiving party user ID is not a valid one.
   * @throws BadRequestException - if sending and receiving user ID are the same.
   * @throws ConflictException - if both users already share a request between them or a connection instance.
   * @throws ForbiddenException - if one of the users is blocking the other.
   *
   * function flow:
   * 1. extracts receiving user ID and checks its availability in the database.
   * 2. checks that both IDs are distinct.
   * 3. if user is not on a premium plan, checks that user did not exceed connection limit.
   * 4. checks for any other exisiting instances between both users (pending or ignored requests, connection, block) to ensure no conflict.
   * 5. if no conflict, creates a new pending connection request between both users and saves it to the database.
   */
  async requestConnection(
    sendingParty: string,
    createRequestDto: CreateRequestDto,
  ) {
    try {
      const sendingUser = await this.profileModel
        .findById(new Types.ObjectId(sendingParty))
        .lean();
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
      if (!sendingUser!.is_premium && sendingUser!.connection_count >= 50) {
        throw new ForbiddenException(
          'User has exceeded his limit on connections.',
        );
      }
      const blocked1 = await getBlocked(
        this.userConnectionModel,
        sendingParty,
        receivingParty,
      );
      const blocked2 = await getBlocked(
        this.userConnectionModel,
        receivingParty,
        sendingParty,
      );
      if (blocked1 || blocked2) {
        throw new ForbiddenException(
          'Cannot place a connection request between blocked users.',
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
      const ignored1 = await getIgnored(
        this.userConnectionModel,
        sendingParty,
        receivingParty,
      );
      const ignored2 = await getIgnored(
        this.userConnectionModel,
        receivingParty,
        sendingParty,
      );
      if (request1 || request2 || ignored1 || ignored2) {
        throw new ConflictException(
          'Pending/ignored connection request already estbalished between users.',
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
      // send connection request notification
      addNotification(
        this.notificationModel,
        new Types.ObjectId(sendingParty),
        new Types.ObjectId(receivingParty),
        newConnection._id,
        newConnection._id,
        'UserConnection',
        'sent you a connection request',
        new Date(),
        this.notificationGateway,
        this.profileModel,
        this.companyModel,
        this.userModel,
        this.companyManagerModel,
      );
    } catch (error) {
      handleError(error, 'Failed to request connection.');
    }
  }

  /**
   * withdraws a pending connection request sent by logged in user to other specified user.
   *
   * @param sendingParty - string ID of the logged in user.
   * @param receivingParty - string ID of the other user.
   * @throws NotFoundException - if the receiving party user ID is not a valid one/if no connection request exists in the specified direction.
   *
   * function flow:
   * 1. checks availability of receiving party user ID in the database.
   * 2. checks availability of specified pending/ignored connection request instance.
   * 3. if found, removes instance from the database.
   */
  async removeRequest(sendingParty: string, receivingParty: string) {
    try {
      const exisitngUser = await this.profileModel
        .findById(new Types.ObjectId(receivingParty))
        .lean();
      if (!exisitngUser) {
        throw new NotFoundException('User not found.');
      }
      const existingPending = await getPending(
        this.userConnectionModel,
        sendingParty,
        receivingParty,
      );
      const existingIgnored = await getIgnored(
        this.userConnectionModel,
        sendingParty,
        receivingParty,
      );
      if (!existingPending && !existingIgnored) {
        throw new NotFoundException(
          'Pending connection request was not found.',
        );
      } else if (existingPending) {
        await this.userConnectionModel.findByIdAndDelete(existingPending._id);
        // remove pending connection request notification
        deleteNotification(this.notificationModel, existingPending._id);
      } else if (existingIgnored) {
        await this.userConnectionModel.findByIdAndDelete(existingIgnored._id);
      }
    } catch (error) {
      handleError(error, 'Failed to remove pending request.');
    }
  }

  /**
   * updates status of a pending connection request received by logged in user from other specified user.
   *
   * @param sendingParty - string ID of the other user.
   * @param receivingParty - string ID of the logged in user.
   * @param updateRequestDto - DTO containing boolean; if true accept, if false ignore.
   * @throws NotFoundException - if the sending party user ID is not a valid one/if no connection request exists in the specified direction.
   *
   * function flow:
   * 1. checks availability of sending party user ID in the database.
   * 2. checks availability of specified pending connection request instance.
   * 3. if found, update request's status based on isAccept boolean.
   * 4. increment connection counts for both users by 1.
   * 5. adds a follow instance in specified direction if it doesn't already exist.
   */
  async updateConnection(
    sendingParty: string,
    receivingParty: string,
    updateRequestDto: UpdateRequestDto,
  ) {
    try {
      const receivingUser = await this.profileModel
        .findById(new Types.ObjectId(receivingParty))
        .lean();
      const existingUser = await this.profileModel
        .findById(new Types.ObjectId(sendingParty))
        .lean();
      if (!existingUser) {
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
      if (isAccept) {
        if (
          !receivingUser!.is_premium &&
          receivingUser!.connection_count >= 50
        ) {
          throw new ForbiddenException(
            'User has exceeded his limit on connections.',
          );
        }
      }
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
        // send request acceptance notification
        addNotification(
          this.notificationModel,
          new Types.ObjectId(receivingParty),
          new Types.ObjectId(sendingParty),
          updatedConnection!._id,
          updatedConnection!._id,
          'UserConnection',
          'accepted your connection request',
          new Date(),
          this.notificationGateway,
          this.profileModel,
          this.companyModel,
          this.userModel,
          this.companyManagerModel,
        );
        await this.profileModel.findByIdAndUpdate(
          updatedConnection!.sending_party,
          { $inc: { connection_count: 1 } },
          { new: true },
        );
        await this.profileModel.findByIdAndUpdate(
          updatedConnection!.receiving_party,
          { $inc: { connection_count: 1 } },
          { new: true },
        );
        const exisitingFollow = await getFollow(
          this.userConnectionModel,
          sendingParty,
          receivingParty,
        );
        if (!exisitingFollow) {
          const newFollow = new this.userConnectionModel({
            _id: new Types.ObjectId(),
            sending_party: new Types.ObjectId(sendingParty),
            receiving_party: new Types.ObjectId(receivingParty),
            status: ConnectionStatus.Following,
          });
          await newFollow.save();
          // send follow notification
          addNotification(
            this.notificationModel,
            new Types.ObjectId(sendingParty),
            new Types.ObjectId(receivingParty),
            newFollow._id,
            newFollow._id,
            'UserConnection',
            'followed you',
            new Date(),
            this.notificationGateway,
            this.profileModel,
            this.companyModel,
            this.userModel,
            this.companyManagerModel,
          );
        }
      } else {
        // remove pending connection request notification
        deleteNotification(this.notificationModel, updatedConnection!._id);
      }
    } catch (error) {
      handleError(error, 'Failed to update connection request status.');
    }
  }

  /**
   * remove a connection instance between logged in user and other specified user.
   *
   * @param sendingParty - string ID of the logged in user.
   * @param receivingParty - string ID of the other user.
   * @throws NotFoundException - if the receiving party user ID is not a valid one/if no connection instance exists between users.
   *
   * function flow:
   * 1. checks availability of receiving party user ID in the database.
   * 2. checks availability of connection instance between users.
   * 3. if found, removes instance from the database.
   * 4. allows sending party to unfollow receiving party if a follow instance exists.
   * 5. decrement connection count for both users by 1.
   */
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

  /**
   * retrieve list of connections for specified user.
   *
   * @param subId - string ID of the logged in user.
   * @param userId - string ID of the specified user.
   * @param page - the page number for pagination.
   * @param limit - the maximum number of users to return per page.
   * @param by - the field which data will be sorted by (1 for date, 2 for first name, 3 for last name).
   * @param direction - the direction for which data will be sorted (1 for ascending, 2 for descending).
   * @param name - (optional) name filter applied to both first and last names using case-insensitive partial match.
   * @returns GetUserDto[] - an array of user DTOs containing essential profile details.
   *
   * function flow:
   * 1. calculate pagination skip value using page and limit.
   * 2. construct a sort object based on by and direction parameters.
   * 3. initialize an empty MongoDB filter object.
   * 4. if a name is provided, add a case-insensitive $or filter for first and last names.
   * 5. join the 'profileModel' and 'userConnectionModel'.
   * 6. query the joined model using the constructed filter, searching for connection instances for specified user in both directions and applying skip and limit values.
   * 7. retrieves list of connections for logged in user and checks which users are in the connections set (to set isConnected flag).
   * 7. map the results to GetUserDto and return array of GetUserDtos.
   */
  async getConnections(
    subId: string,
    userId: string,
    page: number,
    limit: number,
    by: number,
    direction: number,
    name?: string,
  ): Promise<GetUserDto[]> {
    try {
      const skip = (page - 1) * limit;
      const params = getSortData(by, direction);
      const field = Object.keys(params)[0];
      const dir = params[field];

      let sort: Record<string, 1 | -1> = {};
      if (field === 'created_at') {
        sort['created_at'] = dir;
      } else {
        sort[`profile.${field}`] = dir;
      }

      const filter: any = {};
      if (name) {
        filter.$or = [
          { 'profile.first_name': { $regex: name, $options: 'i' } },
          { 'profile.last_name': { $regex: name, $options: 'i' } },
        ];
      }

      const connections = await this.userConnectionModel.aggregate([
        {
          $match: {
            $or: [
              { sending_party: new Types.ObjectId(userId) },
              { receiving_party: new Types.ObjectId(userId) },
            ],
            status: ConnectionStatus.Connected,
          },
        },
        {
          $addFields: {
            other_user: {
              $cond: [
                { $eq: ['$sending_party', new Types.ObjectId(userId)] },
                '$receiving_party',
                '$sending_party',
              ],
            },
          },
        },
        {
          $lookup: {
            from: 'Profiles',
            localField: 'other_user',
            foreignField: '_id',
            as: 'profile',
          },
        },
        {
          $unwind: '$profile',
        },
        {
          $match: filter,
        },
        {
          $sort: sort,
        },
        {
          $skip: skip,
        },
        {
          $limit: limit,
        },
        {
          $project: {
            _id: '$profile._id',
            first_name: '$profile.first_name',
            last_name: '$profile.last_name',
            profile_picture: '$profile.profile_picture',
            headline: '$profile.headline',
            created_at: '$created_at',
          },
        },
      ]);
      // return connections.map((profile: any) => {
      //   const dto = toGetUserDto(profile);
      //   dto.createdAt = profile.created_at;
      //   return dto;
      // });
      const userIds = connections.map((profile: any) => profile._id);
      const existingConnections = await this.userConnectionModel.find({
        $or: [
          {
            sending_party: new Types.ObjectId(subId),
            receiving_party: {
              $in: userIds.map((id: string) => new Types.ObjectId(id)),
            },
          },
          {
            receiving_party: new Types.ObjectId(subId),
            sending_party: {
              $in: userIds.map((id: string) => new Types.ObjectId(id)),
            },
          },
        ],
        status: ConnectionStatus.Connected,
      });
      const connectedUserIds = new Set<string>();
      for (const existingConnection of existingConnections) {
        const otherId =
          existingConnection.sending_party.toString() === subId
            ? existingConnection.receiving_party.toString()
            : existingConnection.sending_party.toString();
        connectedUserIds.add(otherId);
      }
      return connections.map((profile: any) => {
        const dto = toGetUserDto(profile);
        dto.createdAt = profile.created_at;
        dto.isConnected = connectedUserIds.has(profile._id.toString());
        return dto;
      });
    } catch (error) {
      handleError(error, 'Failed to retrieve list of connections.');
    }
  }

  /**
   * retrieve list of pending connection requests for logged in user.
   *
   * @param userId - string ID of the logged in user.
   * @param page - the page number for pagination.
   * @param limit - the maximum number of users to return per page.
   * @returns GetUserDto[] - an array of user DTOs containing essential profile details.
   *
   * function flow:
   * 1. calculate pagination skip value using page and limit.
   * 2. join the 'profileModel' and 'userConnectionModel'.
   * 3. query the joined model, searching for pending request instances where receiving party is logged in user and applying skip and limit values.
   * 4. map the results to GetUserDto and return array of GetUserDtos.
   */
  async getPendingRequests(
    userId: string,
    page: number,
    limit: number,
  ): Promise<GetUserDto[]> {
    try {
      const skip = (page - 1) * limit;
      const pending = await this.userConnectionModel.aggregate([
        {
          $match: {
            receiving_party: new Types.ObjectId(userId),
            status: ConnectionStatus.Pending,
          },
        },
        {
          $lookup: {
            from: 'Profiles',
            localField: 'sending_party',
            foreignField: '_id',
            as: 'profile',
          },
        },
        { $unwind: '$profile' },
        { $sort: { created_at: -1, _id: -1 } },
        { $skip: skip },
        { $limit: limit },
        {
          $project: {
            _id: '$profile._id',
            first_name: '$profile.first_name',
            last_name: '$profile.last_name',
            profile_picture: '$profile.profile_picture',
            headline: '$profile.headline',
            created_at: '$created_at',
          },
        },
      ]);
      // return pending.map(toGetUserDto);
      return pending.map((profile: any) => {
        const dto = toGetUserDto(profile);
        dto.createdAt = profile.created_at;
        return dto;
      });
    } catch (error) {
      handleError(
        error,
        'Failed to retrieve list of pending connection requests.',
      );
    }
  }

  /**
   * retrieve list of sent connection requests for logged in user.
   *
   * @param userId - string ID of the logged in user.
   * @param page - the page number for pagination.
   * @param limit - the maximum number of users to return per page.
   * @returns GetUserDto[] - an array of user DTOs containing essential profile details.
   *
   * function flow:
   * 1. calculate pagination skip value using page and limit.
   * 2. join the 'profileModel' and 'userConnectionModel'.
   * 3. query the joined model, searching for pending request instances where sending party is logged in user and applying skip and limit values.
   * 4. map the results to GetUserDto and return array of GetUserDtos.
   */
  async getSentRequests(
    userId: string,
    page: number,
    limit: number,
  ): Promise<GetUserDto[]> {
    try {
      const skip = (page - 1) * limit;
      const sent = await this.userConnectionModel.aggregate([
        {
          $match: {
            sending_party: new Types.ObjectId(userId),
            status: ConnectionStatus.Pending,
          },
        },
        {
          $lookup: {
            from: 'Profiles',
            localField: 'receiving_party',
            foreignField: '_id',
            as: 'profile',
          },
        },
        { $unwind: '$profile' },
        { $sort: { created_at: -1, _id: -1 } },
        { $skip: skip },
        { $limit: limit },
        {
          $project: {
            _id: '$profile._id',
            first_name: '$profile.first_name',
            last_name: '$profile.last_name',
            profile_picture: '$profile.profile_picture',
            headline: '$profile.headline',
            created_at: '$created_at',
          },
        },
      ]);
      // return sent.map(toGetUserDto);
      return sent.map((profile: any) => {
        const dto = toGetUserDto(profile);
        dto.createdAt = profile.created_at;
        return dto;
      });
    } catch (error) {
      handleError(
        error,
        'Failed to retrieve list of sent connection requests.',
      );
    }
  }

  /**
   * retrieve list of recommended users (people you may know) for logged in user.
   *
   * @param userId - string ID of the logged in user.
   * @param page - the page number for pagination.
   * @param limit - the maximum number of users to return per page.
   * @returns GetUserDto[] - an array of user DTOs containing essential profile details.
   *
   * function flow:
   * 1. calculate pagination skip value using page and limit.
   * 2. query the 'userConnectionModel', retrieving users to exlcude (any instance related to logged in user that exists).
   * 5. construct a set of connections IDs to exclude; excludedUserIds.
   * 5. query the 'profileModel' model, searching for users whose ID does not belong in excludedUserIds set and applying skip and limit values.
   * 6. map the results to GetUserDto and return array of GetUserDtos.
   */
  async getRecommendedUsers(
    userId: string,
    page: number,
    limit: number,
  ): Promise<GetUserDto[]> {
    try {
      const skip = (page - 1) * limit;
      const connections = await this.userConnectionModel
        .find({
          $or: [
            { sending_party: new Types.ObjectId(userId) },
            { receiving_party: new Types.ObjectId(userId) },
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
        .select('_id first_name last_name profile_picture cover_photo headline')
        .sort({ _id: 1 })
        .skip(skip)
        .limit(limit)
        .lean();
      return recommendedProfiles.map(toGetUserDto);
    } catch (error) {
      handleError(error, 'Failed to retrieve people you may know.');
    }
  }

  /**
   * adds a follow instance between logged in user and another specified user.
   *
   * @param sendingParty - string ID of the logged in user.
   * @param createRequestDto - contains receivingParty; the string ID of the other user.
   * @throws NotFoundException - if the receiving party user ID is not a valid one.
   * @throws BadRequestException - if sending and receving user ID are the same.
   * @throws ConflictException - if follow instance already exists in the specified direction.
   * @throws ForbiddenException - if one of the users is blocking the other.
   *
   * function flow:
   * 1. extracts receiving user ID and checks its availability in the database.
   * 2. checks that both IDs are distinct.
   * 3. checks for any other exisiting instances between both users (follow or block) to ensure no conflict
   * 4. if no conflict, creates a new follow instance between both users and saves it to the database.
   */
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
      const blocked1 = await getBlocked(
        this.userConnectionModel,
        sendingParty,
        receivingParty,
      );
      const blocked2 = await getBlocked(
        this.userConnectionModel,
        receivingParty,
        sendingParty,
      );
      if (blocked1 || blocked2) {
        throw new ForbiddenException(
          'Cannot place a follow instance between blocked users.',
        );
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
      // send follow notification
      addNotification(
        this.notificationModel,
        new Types.ObjectId(sendingParty),
        new Types.ObjectId(receivingParty),
        newConnection._id,
        newConnection._id,
        'UserConnection',
        'followed you',
        new Date(),
        this.notificationGateway,
        this.profileModel,
        this.companyModel,
        this.userModel,
        this.companyManagerModel,
      );
    } catch (error) {
      handleError(error, 'Failed to follow user.');
    }
  }

  /**
   * allow the logged in user to unfollow and other specified user.
   *
   * @param sendingParty - string ID of the logged in user.
   * @param receivingParty - string ID of the other user.
   * @throws NotFoundException - if the receiving party user ID is not a valid one/if no follow instance exists between users in specified direction.
   *
   * function flow:
   * 1. checks availability of receiving party user ID in the database.
   * 2. checks availability of follow instance between users.
   * 3. if found, removes instance from the database.
   */
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
      if (!existingFollow) {
        throw new NotFoundException('Follow instance not found.');
      }
      await this.userConnectionModel.findByIdAndDelete(existingFollow._id);
      // remove follow notification
      deleteNotification(this.notificationModel, existingFollow._id);
    } catch (error) {
      handleError(error, 'Failed to unfollow user.');
    }
  }

  /**
   * retrieve list of users following the logged in user.
   *
   * @param userId - string ID of the logged in user.
   * @param page - the page number for pagination.
   * @param limit - the maximum number of users to return per page.
   * @returns GetUserDto[] - an array of user DTOs containing essential profile details.
   *
   * function flow:
   * 1. calculate pagination skip value using page and limit.
   * 2. join the 'profileModel' and 'userConnectionModel'.
   * 3. query the joined model, searching for follow instances where receiving party is logged in user and applying skip and limit values.
   * 4. map the results to GetUserDto and return array of GetUserDtos.
   */
  async getFollowers(
    userId: string,
    page: number,
    limit: number,
  ): Promise<GetUserDto[]> {
    try {
      const skip = (page - 1) * limit;
      const followers = await this.userConnectionModel.aggregate([
        {
          $match: {
            receiving_party: new Types.ObjectId(userId),
            status: ConnectionStatus.Following,
          },
        },
        {
          $lookup: {
            from: 'Profiles',
            localField: 'sending_party',
            foreignField: '_id',
            as: 'profile',
          },
        },
        { $unwind: '$profile' },
        { $sort: { created_at: -1, _id: -1 } },
        { $skip: skip },
        { $limit: limit },
        {
          $project: {
            _id: '$profile._id',
            first_name: '$profile.first_name',
            last_name: '$profile.last_name',
            profile_picture: '$profile.profile_picture',
            headline: '$profile.headline',
            created_at: '$created_at',
          },
        },
      ]);
      // return followers.map(toGetUserDto);
      return followers.map((profile: any) => {
        const dto = toGetUserDto(profile);
        dto.createdAt = profile.created_at;
        return dto;
      });
    } catch (error) {
      handleError(error, 'Failed to retrieve list of followers.');
    }
  }

  /**
   * retrieve list of users followed by the logged in user.
   *
   * @param userId - string ID of the logged in user.
   * @param page - the page number for pagination.
   * @param limit - the maximum number of users to return per page.
   * @returns GetUserDto[] - an array of user DTOs containing essential profile details.
   *
   * function flow:
   * 1. calculate pagination skip value using page and limit.
   * 2. join the 'profileModel' and 'userConnectionModel'.
   * 3. query the joined model, searching for follow instances where sending party is logged in user and applying skip and limit values.
   * 4. map the results to GetUserDto and return array of GetUserDtos.
   */
  async getFollowing(
    userId: string,
    page: number,
    limit: number,
  ): Promise<GetUserDto[]> {
    try {
      const skip = (page - 1) * limit;
      const following = await this.userConnectionModel.aggregate([
        {
          $match: {
            sending_party: new Types.ObjectId(userId),
            status: ConnectionStatus.Following,
          },
        },
        {
          $lookup: {
            from: 'Profiles',
            localField: 'receiving_party',
            foreignField: '_id',
            as: 'profile',
          },
        },
        { $unwind: '$profile' },
        { $sort: { created_at: -1, _id: -1 } },
        { $skip: skip },
        { $limit: limit },
        {
          $project: {
            _id: '$profile._id',
            first_name: '$profile.first_name',
            last_name: '$profile.last_name',
            profile_picture: '$profile.profile_picture',
            headline: '$profile.headline',
            created_at: '$created_at',
          },
        },
      ]);
      // return following.map(toGetUserDto);
      return following.map((profile: any) => {
        const dto = toGetUserDto(profile);
        dto.createdAt = profile.created_at;
        return dto;
      });
    } catch (error) {
      handleError(error, 'Failed to retrieve list of followed users.');
    }
  }

  /**
   * retrieve count of users following the logged in user.
   *
   * @param userId - string ID of the logged in user.
   * @returns count
   *
   * function flow:
   * 1. finds all UserConnection documents where receiving party is userId and status is Following
   * 2. counts all found documents and returns the count
   */
  async getFollowerCount(userId: string): Promise<{ count: number }> {
    try {
      const count = await this.userConnectionModel.countDocuments({
        receiving_party: new Types.ObjectId(userId),
        status: ConnectionStatus.Following,
      });
      return { count };
    } catch (error) {
      handleError(error, 'Failed to get follower count.');
    }
  }

  /**
   * retrieve count of users followed by the logged in user.
   *
   * @param userId - string ID of the logged in user.
   * @returns count
   *
   * function flow:
   * 1. finds all UserConnection documents where sending party is userId and status is Following
   * 2. counts all found documents and returns the count
   */
  async getFollowingCount(userId: string): Promise<{ count: number }> {
    try {
      const count = await this.userConnectionModel.countDocuments({
        sending_party: new Types.ObjectId(userId),
        status: ConnectionStatus.Following,
      });
      return { count };
    } catch (error) {
      handleError(error, 'Failed to get following count.');
    }
  }

  /**
   * retrieve count of pending connection requests for logged in user.
   *
   * @param userId - string ID of the logged in user.
   * @returns count
   *
   * function flow:
   * 1. finds all UserConnection documents where receiving party is userId and status is Pending
   * 2. counts all found documents and returns the count
   */
  async getPendingCount(userId: string): Promise<{ count: number }> {
    try {
      const count = await this.userConnectionModel.countDocuments({
        receiving_party: new Types.ObjectId(userId),
        status: ConnectionStatus.Pending,
      });
      return { count };
    } catch (error) {
      handleError(error, 'Failed to get pending requests count.');
    }
  }

  /**
   * add a new endorsement from logged in user to specified skill on another user's profile.
   *
   * @param endorserId - string ID of the logged in user.
   * @param userId - string ID of the user with a skill to be endorsed.
   * @param addEndorsementDto - DTO which contains the name of the skill to be endorsed.
   * @throws NotFoundException - if endorsee ID is not found/if skill name is not found.
   * @throws BadRequestException - if endorsedId and userId are the same.
   * @throws ConflictException - if logged in user has already endorsed this skill.
   * @throws ForbiddenException - if logged in user and endorsee are not connected.
   *
   * function flow:
   * 1. checks availability of endorsee user and specified skill on endorsee's profile.
   * 2. checks if both users are connected and logged in user has not yet endorsed the skill to avoid conflict.
   * 3. if yes, add logged in user ID to specified skill's associated endorsements array and saves the update to the database.
   */
  async endorseSkill(
    endorserId: string,
    userId: string,
    addEndorsementDto: AddEndoresementDto,
  ) {
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
      const connection1 = await getConnection(
        this.userConnectionModel,
        endorserId,
        userId,
      );
      const connection2 = await getConnection(
        this.userConnectionModel,
        userId,
        endorserId,
      );
      if (!connection1 && !connection2) {
        throw new ForbiddenException(
          "User cannot endorse a non-connection's skill.",
        );
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
      // const endorsers = await this.profileModel
      //   .find({ _id: { $in: skill.endorsements } })
      //   .select('_id first_name last_name profile_picture')
      //   .lean();
      // const endorsersDto = endorsers.map(toGetUserDto);
      // return endorsersDto;
    } catch (error) {
      handleError(error, 'Failed to endorse skill.');
    }
  }

  /**
   * removes endorsement done by logged in user to specified skill on another user's profile.
   *
   * @param endorserId - string ID of the logged in user.
   * @param userId - string ID of the user with a skill to be endorsed.
   * @param skillName - name of the skill for which endorsement will be removed.
   * @throws NotFoundException - if endorsee ID is not found/if skill name is not found.
   * @throws BadRequestException - if endorser has not endorsed this skill.
   *
   * function flow:
   * 1. checks availability of endorsee user and specified skill on endorsee's profile.
   * 2. checks if logged in user has an endorsement to the specified skill to avoid conflict.
   * 3. if yes, remove logged in user ID from specified skill's associated endorsements array and save the update to the database.
   */
  async removeEndorsement(
    endorserId: string,
    userId: string,
    skillName: string,
  ) {
    try {
      const existingUser = await this.profileModel.findById(
        new Types.ObjectId(userId),
      );
      if (!existingUser) {
        throw new NotFoundException('User profile not found.');
      }
      const skill = existingUser.skills?.find(
        (s) => s.skill_name === skillName,
      );
      if (!skill) {
        throw new NotFoundException("Skill not found in user's profile.");
      }
      const endorserObjectId = new Types.ObjectId(endorserId);
      if (!skill.endorsements?.some((id) => id.equals(endorserObjectId))) {
        throw new BadRequestException(
          'Logged in user has not endorsed this skill.',
        );
      }
      skill.endorsements = skill.endorsements.filter(
        (id) => !id.equals(endorserObjectId),
      );
      await existingUser.save();
      // const endorsers = await this.profileModel
      //   .find({ _id: { $in: skill.endorsements } })
      //   .select('_id first_name last_name profile_picture')
      //   .lean();
      // const endorsersDto = endorsers.map(toGetUserDto);
      // return endorsersDto;
    } catch (error) {
      handleError(error, 'Failed to remove endorsement.');
    }
  }

  /**
   * adds a block instance between logged in user and another specified user.
   *
   * @param sendingParty - string ID of the logged in user.
   * @param receivingParty - string ID of the other user.
   * @throws NotFoundException - if the receiving party user ID is not a valid one.
   * @throws BadRequestException - if sending and receving user ID are the same.
   * @throws ConflictException - if block instance already exists in the specified direction.
   *
   * function flow:
   * 1. checks availablity of other user in the database.
   * 2. checks that both IDs are distinct.
   * 3. checks for any other exisiting block instances between both users to ensure no conflict
   * 4. if no conflict, creates a new block instance between both users and saves it to the database.
   * 5. deletes any other instances between the 2 users (connection request/follow/connection)
   */
  async block(sendingParty: string, receivingParty: string) {
    try {
      const exisitngUser = await this.profileModel
        .findById(new Types.ObjectId(receivingParty))
        .lean();
      if (!exisitngUser) {
        throw new NotFoundException('User not found.');
      }
      if (sendingParty === receivingParty) {
        throw new BadRequestException('Cannot block yourself.');
      }
      const blocked1 = await getBlocked(
        this.userConnectionModel,
        sendingParty,
        receivingParty,
      );
      const blocked2 = await getBlocked(
        this.userConnectionModel,
        receivingParty,
        sendingParty,
      );
      if (blocked1 || blocked2) {
        throw new ConflictException('Block instance already exists.');
      }
      await this.userConnectionModel.deleteMany({
        $or: [
          {
            sending_party: new Types.ObjectId(sendingParty),
            receiving_party: new Types.ObjectId(receivingParty),
          },
          {
            sending_party: new Types.ObjectId(receivingParty),
            receiving_party: new Types.ObjectId(sendingParty),
          },
        ],
      });
      const newBlock = new this.userConnectionModel({
        _id: new Types.ObjectId(),
        sending_party: new Types.ObjectId(sendingParty),
        receiving_party: new Types.ObjectId(receivingParty),
        status: ConnectionStatus.Blocked,
      });
      await newBlock.save();
    } catch (error) {
      handleError(error, 'Failed to block user.');
    }
  }

  /**
   * allows logged in user to unblock a previously blocked user.
   *
   * @param sendingParty - string ID of the logged in user.
   * @param receivingParty - string ID of the other user.
   * @throws NotFoundException - if the receiving party user ID is not a valid one / if no block instance exists.
   * @throws BadRequestException - if sending and receving user ID are the same.
   * @throws ConflictException - if block instance already exists in the specified direction.
   *
   * function flow:
   * 1. checks availablity of other user in the database.
   * 2. ensures a block instance already exists.
   * 3. if it does, removes the block instance.
   */
  async unblock(sendingParty: string, receivingParty: string) {
    try {
      const exisitngUser = await this.profileModel
        .findById(new Types.ObjectId(receivingParty))
        .lean();
      if (!exisitngUser) {
        throw new NotFoundException('User not found.');
      }
      const existingBlock = await getBlocked(
        this.userConnectionModel,
        sendingParty,
        receivingParty,
      );
      if (!existingBlock) {
        throw new NotFoundException('Block instance not found.');
      }
      await this.userConnectionModel.findByIdAndDelete(existingBlock._id);
    } catch (error) {
      handleError(error, 'Failed to unblock user.');
    }
  }

  /**
   * retrieve list of users blocked by the logged in user.
   *
   * @param userId - string ID of the logged in user.
   * @param page - the page number for pagination.
   * @param limit - the maximum number of users to return per page.
   * @returns GetUserDto[] - an array of user DTOs containing essential profile details.
   *
   * function flow:
   * 1. calculate pagination skip value using page and limit.
   * 2. join the 'profileModel' and 'userConnectionModel'.
   * 3. query the joined model, searching for block instances where sending party is logged in user and applying skip and limit values.
   * 4. map the results to GetUserDto and return array of GetUserDtos.
   */
  async getBlocked(
    userId: string,
    page: number,
    limit: number,
  ): Promise<GetUserDto[]> {
    try {
      const skip = (page - 1) * limit;
      const followers = await this.userConnectionModel.aggregate([
        {
          $match: {
            sending_party: new Types.ObjectId(userId),
            status: ConnectionStatus.Blocked,
          },
        },
        {
          $lookup: {
            from: 'Profiles',
            localField: 'receiving_party',
            foreignField: '_id',
            as: 'profile',
          },
        },
        { $unwind: '$profile' },
        { $sort: { created_at: -1, _id: -1 } },
        { $skip: skip },
        { $limit: limit },
        {
          $project: {
            userId: '$profile._id',
            first_name: '$profile.first_name',
            last_name: '$profile.last_name',
            profile_picture: '$profile.profile_picture',
          },
        },
      ]);
      // return followers.map(toGetUserDto);
      return followers.map((profile: any) => {
        const dto = toGetUserDto(profile);
        dto.createdAt = profile.created_at;
        return dto;
      });
    } catch (error) {
      handleError(error, 'Failed to retrieve list of blocked users.');
    }
  }
}
