import { NotificationDocument } from '../infrastructure/database/schemas/notification.schema';
import {
  Profile,
  ProfileDocument,
} from '../../profiles/infrastructure/database/schemas/profile.schema';
import {
  Company,
  CompanyDocument,
} from '../../companies/infrastructure/database/schemas/company.schema';
import { GetNotificationsDto } from '../dto/get-notifications.dto';
import { Model, Types } from 'mongoose';

export async function mapToGetNotificationsDto(
  notification: NotificationDocument,
  profileModel: Model<ProfileDocument>,
  companyModel: Model<CompanyDocument>,
): Promise<GetNotificationsDto | null> {
  let userName = '';
  let profilePicture = '';
  let senderType: 'User' | 'Company' | undefined;

  console.log(
    `Mapping notification: ${notification._id}, senderId: ${notification.sender_id}`,
  );
  // Check in Profile model
  const profile = await profileModel
    .findOne({ _id: new Types.ObjectId(notification.sender_id) })
    .lean();
  if (profile) {
    userName = `${profile.first_name} ${profile.last_name}`;
    profilePicture = profile.profile_picture || '';
    senderType = 'User';
  } else {
    // Check in Company model
    const company = await companyModel
      .findOne({ _id: new Types.ObjectId(notification.sender_id) })
      .lean();

    console.log(
      `Company found: ${company ? company.name : 'No company found'}`,
    );
    if (company) {
      userName = company.name;
      profilePicture = company.logo || '';
      senderType = 'Company';
    } else {
      // Skip notification if sender is not found
      console.error(
        `Sender not found with id: ${notification.sender_id}, type: ${notification.reference_type}`,
      );
      return null; // Return null to indicate the notification should be skipped
    }
  }

  return {
    notificationId: notification._id.toString(),
    userName,
    profilePicture,
    referenceId: notification.sender_id.toString(),
    senderType,
    type: notification.reference_type as
      | 'React'
      | 'Comment'
      | 'UserConnection'
      | 'Message',
    content: userName + ' ' + notification.content,
    isRead: notification.seen,
    timestamp: notification.sent_at.toISOString(),
    rootItemId: notification.root_item_id.toString(), // Ensure this is a string
  };
}
