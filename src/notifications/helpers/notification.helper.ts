import { Model, Types } from 'mongoose';
import { NotificationDocument } from '../infrastructure/database/schemas/notification.schema';
import { NotificationGateway } from '../../gateway/notification.gateway';
import { mapToGetNotificationsDto } from '../mappers/notification.mapper';
import { profile } from 'console';
import { ProfileDocument } from 'src/profiles/infrastructure/database/schemas/profile.schema';
import { CompanyDocument } from 'src/companies/infrastructure/database/schemas/company.schema';

export async function addNotification(
  notificationModel: Model<NotificationDocument>,
  senderId: Types.ObjectId,
  receiverId: Types.ObjectId,
  referenceId: Types.ObjectId,
  referenceType: 'React' | 'Comment' | 'UserConnection' | 'Message',
  content: string,
  sentAt: Date,
  notificationGateway: NotificationGateway, // Inject NotificationGateway
  profileModel: Model<ProfileDocument>, // Inject Profile model
  companyModel: Model<CompanyDocument>, // Inject Company model
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
  console.log('Mapped notification:', getNotification);

  // Emit the notification to the specific userId
  const userId = receiverId.toString();
  const targetClient = notificationGateway.getClients().get(userId); // Use the public getter
  if (targetClient) {
    targetClient.emit('newNotification', getNotification);
  } else {
    console.warn(`User with ID ${userId} is not connected.`);
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
