import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Notification,
  NotificationDocument,
} from './infrastructure/database/schemas/notification.schema';
import { GetNotificationsDto } from './dto/get-notifications.dto';
import { addNotification } from './helpers/notification.helper';
import { mapToGetNotificationsDto } from './mappers/notification.mapper';
import { Profile } from '../profiles/infrastructure/database/schemas/profile.schema';
import {
  Company,
  CompanyDocument,
} from '../companies/infrastructure/database/schemas/company.schema';
import { Types } from 'mongoose';
import { getUserAccessed } from '../posts/helpers/posts.helpers';
import { CompanyManager } from '../companies/infrastructure/database/schemas/company-manager.schema';
import {
  User,
  UserDocument,
} from '../users/infrastructure/database/schemas/user.schema';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<NotificationDocument>,
    @InjectModel(Profile.name)
    private readonly profileModel: Model<any>,
    @InjectModel(CompanyManager.name)
    private readonly companyManagerModel: Model<any>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>, // Inject User model
    @InjectModel(Company.name)
    private readonly companyModel: Model<CompanyDocument>, // Inject Company model
    //
  ) {}

  async getNotifications(
    userId: string,
    companyId: string,
    page: number,
    limit: number,
  ): Promise<GetNotificationsDto[]> {
    try {
      const authorId = await getUserAccessed(
        userId,
        companyId,
        this.companyManagerModel,
      );

      const skip = (page - 1) * limit;

      const notifications = await this.notificationModel
        .find({
          receiver_id: new Types.ObjectId(authorId),
          type: { $ne: 'Message' }, // Exclude notifications of type 'Message'
        })
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      const mappedNotifications = await Promise.all(
        notifications.map((notification) =>
          mapToGetNotificationsDto(
            notification,
            this.profileModel,
            this.companyModel,
          ),
        ),
      );

      const sortedNotifications = mappedNotifications.sort((a, b) => {
        if (!a || !a.timestamp || !b || !b.timestamp) return 0;
        return (
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
      });

      return sortedNotifications.filter(
        (notification) => notification !== null,
      ) as GetNotificationsDto[];
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch notifications');
    }
  }

  async getUnreadNotifications(
    userId: string,
    companyId: string,
    page: number,
    limit: number,
  ): Promise<GetNotificationsDto[]> {
    try {
      const authorId = await getUserAccessed(
        userId,
        companyId,
        this.companyManagerModel,
      );

      const skip = (page - 1) * limit;

      const notifications = await this.notificationModel
        .find({
          receiver_id: new Types.ObjectId(authorId),
          seen: false, // Only include unseen notifications
          type: { $ne: 'Message' }, // Exclude notifications of type 'Message'
        })
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      const mappedNotifications = await Promise.all(
        notifications.map((notification) =>
          mapToGetNotificationsDto(
            notification,
            this.profileModel,
            this.companyModel,
          ),
        ),
      );

      return mappedNotifications.filter(
        (notification) => notification !== null,
      ) as GetNotificationsDto[];
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch unread messages');
    }
  }

  async markAsRead(notificationId: string, userId: string, companyId: string) {
    try {
      const authorId = await getUserAccessed(
        userId,
        companyId,
        this.companyManagerModel,
      );

      const notification = await this.notificationModel
        .findOne({
          _id: new Types.ObjectId(notificationId),
          receiver_id: new Types.ObjectId(authorId),
        })
        .exec();
      if (!notification) {
        throw new Error('Notification not found or access denied');
      }
      notification.seen = true;
      await notification.save();
      return { message: 'Notification marked as read' };
    } catch (error) {
      if (error.message === 'Notification not found or access denied') {
        throw new InternalServerErrorException(error.message);
      }
      throw new InternalServerErrorException(
        'Failed to mark notification as read',
      );
    }
  }

  async getUnseenCount(
    userId: string,
    companyId: string,
  ): Promise<{ unseenCount: number }> {
    try {
      const authorId = await getUserAccessed(
        userId,
        companyId,
        this.companyManagerModel,
      );

      const unseenCount = await this.notificationModel.countDocuments({
        receiver_id: new Types.ObjectId(authorId),
        seen: false,
        type: { $ne: 'Message' }, // Exclude notifications of type 'Message'
      });
      return { unseenCount };
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to fetch unseen notification count',
      );
    }
  }

  async subscribeFcmToken(userId: string, fcmToken: string): Promise<void> {
    await this.userModel.updateOne(
      { _id: new Types.ObjectId(userId) },
      { $addToSet: { fcm_tokens: fcmToken } }, // Ensures no duplicate tokens
    );
  }
}
