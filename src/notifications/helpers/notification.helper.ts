import { Model, Types } from 'mongoose';
import { NotificationDocument } from '../infrastructure/database/schemas/notification.schema';

export async function addNotification(
  notificationModel: Model<NotificationDocument>,
  senderId: Types.ObjectId,
  receiverId: Types.ObjectId,
  referenceId: Types.ObjectId,
  referenceType: 'React' | 'Comment' | 'UserConnection' | 'Message',
  content: string,
  sentAt: Date,
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
  return notification.save();
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
