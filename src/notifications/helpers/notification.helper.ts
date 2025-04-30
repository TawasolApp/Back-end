import { Model, Types } from 'mongoose';
import { NotificationDocument } from '../infrastructure/database/schemas/notification.schema';
import { NotificationGateway } from '../../gateway/notification.gateway';
import { mapToGetNotificationsDto } from '../mappers/notification.mapper';
import { profile } from 'console';
import { ProfileDocument } from '../../profiles/infrastructure/database/schemas/profile.schema';
import { CompanyDocument } from '../../companies/infrastructure/database/schemas/company.schema';
import * as admin from 'firebase-admin';
import { firebaseAdminProvider } from '../firebase-admin.provider'; // Import the provider
import {
  User,
  UserDocument,
} from '../../users/infrastructure/database/schemas/user.schema';
import { InjectModel } from '@nestjs/mongoose';
import {
  CompanyManager,
  CompanyManagerDocument,
} from '../../companies/infrastructure/database/schemas/company-manager.schema';
import { get } from 'http';

export async function addNotification(
  notificationModel: Model<NotificationDocument>,
  senderId: Types.ObjectId,
  receiverId: Types.ObjectId,
  referenceId: Types.ObjectId,
  rootId: Types.ObjectId,
  referenceType:
    | 'React'
    | 'Comment'
    | 'UserConnection'
    | 'Message'
    | 'JobOffer',
  content: string,
  sentAt: Date,
  notificationGateway: NotificationGateway, // Inject NotificationGateway
  profileModel: Model<ProfileDocument>, // Inject Profile model
  companyModel: Model<CompanyDocument>, // Inject Company model
  userModel: Model<UserDocument>, // Inject User model
  companyManagerModel: Model<any>, // Inject CompanyManager model
) {
  if (senderId.equals(receiverId)) {
    console.log(
      'Sender and receiver are the same. No notification will be created.',
    );
    return null;
  }

  const notification = new notificationModel({
    _id: new Types.ObjectId(),
    sender_id: senderId,
    receiver_id: receiverId,
    item_id: referenceId,
    reference_type: referenceType as
      | 'React'
      | 'Comment'
      | 'UserConnection'
      | 'Message',
    content,
    seen: false, // Always save as unread
    sent_at: sentAt,
    root_item_id: rootId,
  });
  console.log(
    `Notification created: ${senderId} -> ${receiverId}, type: ${referenceType}`,
  );

  const savedNotification = await notification.save();
  const getNotification = await mapToGetNotificationsDto(
    notification,
    profileModel,
    companyModel,
  );
  // console.log('Mapped notification:', getNotification);

  // Emit the notification to the specific userId
  const userId = receiverId.toString();
  const targetClient = notificationGateway.getClients().get(userId); // Use the public getter
  if (targetClient) {
    targetClient.emit('newNotification', getNotification);
  } else {
    console.warn(`User with ID ${userId} is not connected.`);
  }

  // Send notification via Firebase using all FCM tokens
  try {
    const managedCompany = await companyManagerModel
      .find({ company_id: new Types.ObjectId(receiverId) })
      .exec();

    console.log(
      `Managed companies for receiver ID ${receiverId}:`,
      managedCompany,
    );
    if (managedCompany) {
      for (const company of managedCompany) {
        const user = await userModel
          .findById(company.manager_id)
          .select('fcm_tokens');
        if (!user || !user.fcm_tokens || user.fcm_tokens.length === 0) {
          console.warn(`No FCM tokens found for user ID ${company.manager_id}`);
          return savedNotification;
        }

        const message = {
          title: 'Managed Company has a new Notification',
          body: getNotification?.content,
        };

        for (const token of user.fcm_tokens) {
          try {
            await admin.messaging().send({
              token,
              notification: {
                title: message.title,
                body: getNotification?.content,
              },
              data: {
                rootId: rootId.toString(),
              },
              android: {
                priority: 'high',
                notification: {
                  sound: 'default',
                  channelId: 'default',
                },
              },
              apns: {
                payload: {
                  aps: {
                    sound: 'default',
                    channelId: 'default',
                  },
                },
              },
            });
            console.log(`Notification sent via Firebase to token: ${token}`);
          } catch (error) {
            console.error(
              `Error sending notification to token ${token}:`,
              error,
            );
          }
        }
      }
    }
    if (managedCompany.length === 0) {
      const user = await userModel.findById(receiverId).select('fcm_tokens');
      if (!user || !user.fcm_tokens || user.fcm_tokens.length === 0) {
        console.warn(`No FCM tokens found for user ID ${receiverId}`);
        return savedNotification;
      }

      console.log(`User FCM tokens:`, user.fcm_tokens);

      const message = {
        title: 'New Notification',
        body: getNotification?.content,
      };

      for (const token of user.fcm_tokens) {
        try {
          await admin.messaging().send({
            token,
            notification: {
              title: message.title,
              body: message.body,
            },
            data: {
              rootId: rootId.toString(),
            },
            android: {
              priority: 'high',
              notification: {
                sound: 'default',
                channelId: 'default',
              },
            },
            apns: {
              payload: {
                aps: {
                  sound: 'default',
                },
              },
            },
          });
          console.log(`Notification sent via Firebase to token: ${token}`);
        } catch (error) {
          console.error(`Error sending notification to token ${token}:`, error);
        }
      }
    }
  } catch (error) {
    console.error(
      `Error retrieving FCM tokens or sending notifications:`,
      error,
    );
  }

  return savedNotification;
}

export async function deleteNotification(
  notificationModel: Model<NotificationDocument>,
  itemId: Types.ObjectId,
) {
  try {
    const result = await notificationModel.findOneAndDelete({
      item_id: itemId,
    });
    if (!result) {
      console.log(`Notification with item_id ${itemId} not found.`);
      return null;
    }
    console.log(`Notification with item_id ${itemId} deleted successfully.`);
    return result;
  } catch (error) {
    console.error(`Error deleting notification with item_id ${itemId}:`, error);
    throw error;
  }
}
