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
import { Company } from '../companies/infrastructure/database/schemas/company.schema';
import { Types } from 'mongoose';
import { getUserAccessed } from '../posts/helpers/posts.helpers';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<NotificationDocument>,
    @InjectModel(Profile.name)
    private readonly profileModel: Model<any>,
    @InjectModel(Company.name)
    private readonly companyModel: Model<any>,
  ) {}

  async getNotifications(
    userId: string,
    companyId: string,
  ): Promise<GetNotificationsDto[]> {
    try {
      const authorId = await getUserAccessed(
        userId,
        companyId,
        this.companyModel,
      );

      const notifications = await this.notificationModel
        .find({ receiver_id: new Types.ObjectId(authorId) })
        .sort({ timestamp: -1 })
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
      throw new InternalServerErrorException('Failed to fetch notifications');
    }
  }

  async markAsRead(notificationId: string, userId: string, companyId: string) {
    try {
      const authorId = await getUserAccessed(
        userId,
        companyId,
        this.companyModel,
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
        this.companyModel,
      );

      const unseenCount = await this.notificationModel.countDocuments({
        receiver_id: new Types.ObjectId(authorId),
        seen: false,
      });
      return { unseenCount };
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to fetch unseen notification count',
      );
    }
  }
}
