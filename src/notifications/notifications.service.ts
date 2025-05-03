import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Notification,
  NotificationDocument,
} from './infrastructure/database/schemas/notification.schema';
import { GetNotificationsDto } from './dto/get-notifications.dto';
import { mapToGetNotificationsDto } from './mappers/notification.mapper';
import { Profile } from '../profiles/infrastructure/database/schemas/profile.schema';
import {
  Company,
  CompanyDocument,
} from '../companies/infrastructure/database/schemas/company.schema';
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
    private readonly userModel: Model<UserDocument>,
    @InjectModel(Company.name)
    private readonly companyModel: Model<CompanyDocument>,
  ) {}

  /**
   * Retrieve notifications for a user with pagination.
   */
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
          reference_type: { $ne: 'Message' },
        })
        .sort({ timestamp: -1, _id: -1 })
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
      );
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch notifications');
    }
  }

  /**
   * Retrieve unread notifications for a user with pagination.
   */
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
          seen: false,
          reference_type: { $ne: 'Message' },
        })
        .sort({ timestamp: -1, _id: -1 })
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
      );
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch unread messages');
    }
  }

  /**
   * Mark a notification as read for a user.
   */
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

  /**
   * Get the count of unseen notifications count for a user.
   */
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
        reference_type: { $ne: 'Message' },
      });
      return { unseenCount };
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to fetch unseen notification count',
      );
    }
  }

  /**
   * Get the count of unseen Messages count for a user.
   */
  async getUnseenMessagesCount(
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
        reference_type: 'Message',
      });
      return { unseenCount };
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to fetch unseen notification count',
      );
    }
  }

  /**
   * Subscribe a user to an FCM token for notifications.
   */
  async subscribeFcmToken(userId: string, fcmToken: string): Promise<void> {
    await this.userModel.updateOne(
      { _id: new Types.ObjectId(userId) },
      { $addToSet: { fcm_tokens: fcmToken } },
    );
  }
}
