import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  Message,
  MessageDocument,
} from './infrastructure/database/schemas/message.schema';
import { Model, Types } from 'mongoose';
import {
  Conversation,
  ConversationDocument,
} from './infrastructure/database/schemas/conversation.schema';
import { MessageStatus } from './enums/message-status.enum';
import {
  Profile,
  ProfileDocument,
} from '../profiles/infrastructure/database/schemas/profile.schema';
import { getConversations, getMessages } from './dto/messages.mapper';
import { NotificationGateway } from '../common/gateway/notification.gateway';
import { addNotification } from '../notifications/helpers/notification.helper';
import {
  Notification,
  NotificationDocument,
} from '../notifications/infrastructure/database/schemas/notification.schema';
import {
  Company,
  CompanyDocument,
} from '../companies/infrastructure/database/schemas/company.schema';
import {
  CompanyManager,
  CompanyManagerDocument,
} from '../companies/infrastructure/database/schemas/company-manager.schema';
import {
  User,
  UserDocument,
} from '../users/infrastructure/database/schemas/user.schema';

@Injectable()
export class MessagesService {
  constructor(
    @InjectModel(Message.name)
    private readonly messageModel: Model<MessageDocument>,
    @InjectModel(Conversation.name)
    private readonly conversationModel: Model<ConversationDocument>,
    @InjectModel(Profile.name)
    private readonly profileModel: Model<ProfileDocument>,
    private readonly notificationGateway: NotificationGateway,
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<NotificationDocument>,
    @InjectModel(Company.name)
    private readonly companyModel: Model<CompanyDocument>,
    @InjectModel(CompanyManager.name)
    private readonly companyManagerModel: Model<CompanyManagerDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}
  /**
   * Creates a new message and handles conversation management
   * @param senderId - ID of the message sender
   * @param receiverId - ID of the message recipient
   * @param messageText - Content of the message
   * @param media - Array of media URLs attached to the message
   * @param messageDate - Timestamp of when the message was sent
   * @returns {Object} Contains the created conversation and message
   */

  async createMessage(
    senderId: string,
    receiverId: string,
    messageText: string,
    media: string[],
    messageDate: Date,
  ) {
    let conversation = await this.conversationModel.findOne({
      participants: { $all: [senderId, receiverId] },
    });

    if (!conversation) {
      conversation = await this.conversationModel.create({
        participants: [senderId, receiverId],
        unseen_count: 0,
      });
    }

    const newMessage = await this.messageModel.create({
      _id: new Types.ObjectId(),
      sender_id: new Types.ObjectId(senderId),
      receiver_id: new Types.ObjectId(receiverId),
      conversation_id: conversation._id,
      text: messageText,
      media: media ?? [],
      status: MessageStatus.Sent,
      sent_at: messageDate,
    });

    conversation.last_message_id = newMessage._id;
    conversation.unseen_count += 1;

    await conversation.save();
    await this.markMessagesAsRead(
      conversation._id,
      new Types.ObjectId(senderId),
    );
    addNotification(
      this.notificationModel,
      new Types.ObjectId(senderId),
      new Types.ObjectId(receiverId),
      new Types.ObjectId(newMessage._id),
      new Types.ObjectId(conversation._id),
      'Message',
      'Sent you a message',
      new Date(),
      this.notificationGateway,
      this.profileModel,
      this.companyModel,
      this.userModel,
      this.companyManagerModel,
    );
    await this.updateUnseenCount(conversation._id);

    return { conversation, message: newMessage };
  }
  /**
   * Updates the unseen message count for a conversation
   * @param conversationId - ID of the conversation to update
   * @returns {Promise<void>}
   */
  async updateUnseenCount(conversationId: Types.ObjectId): Promise<void> {
    // Count messages with status 'Sent' or 'Delivered' for the given conversationId
    const unseenCount = await this.messageModel.countDocuments({
      conversation_id: conversationId,
      status: {
        $in: [
          MessageStatus.Sent.toString(),
          MessageStatus.Delivered.toString(),
        ],
      },
    });

    // Update the unseen_count field in the conversation
    await this.conversationModel.updateOne(
      { _id: new Types.ObjectId(conversationId) },
      { $set: { unseen_count: unseenCount } },
    );
  }
  /**
   * Marks all sent messages for a user as delivered
   * @param userId - ID of the message recipient
   * @returns {Promise<void>}
   */
  async markMessagesAsDelivered(userId: string) {

    await this.messageModel.updateMany(
      { receiver_id: new Types.ObjectId(userId), status: MessageStatus.Sent },
      { $set: { status: MessageStatus.Delivered.toString() } },
    );
  }
  /**
   * Marks all messages in a conversation as read for a specific user
   * @param conversationId - ID of the conversation
   * @param userId - ID of the user marking messages as read
   * @returns {Promise<void>}
   */
  async markMessagesAsRead(
    conversationId: Types.ObjectId,
    userId: Types.ObjectId,
  ) {
    await this.messageModel.updateMany(
      {
        conversation_id: conversationId,
        receiver_id: userId,
        status: {
          $in: [MessageStatus.Sent, MessageStatus.Delivered],
        },
      },
      { $set: { status: MessageStatus.Read } },
    );
    await this.updateUnseenCount(new Types.ObjectId(conversationId));
  }
  /**
   * Retrieves paginated conversations for a user
   * @param userId - ID of the user to get conversations for
   * @param page - Page number for pagination (default: 1)
   * @param limit - Number of items per page (default: 10)
   * @returns {Object} Paginated conversation data with participant info
   */
  async getConversations(
    userId: Types.ObjectId,
    page: number = 1,
    limit: number = 10,
  ) {
    const skip = (page - 1) * limit;

    // Find all conversations where the user is a participant with pagination
    const conversations = await this.conversationModel
      .find({ participants: userId })
      .lean();
    const total = await this.conversationModel.countDocuments({
      participants: userId,
    });

    const modifiedConversations = await Promise.all(
      conversations.map(async (conversation) => {
        // Find the other participant (not the current user)
        const otherParticipantId = conversation.participants.find(
          (participant: any) => participant.toString() !== userId.toString(),
        );

        if (!otherParticipantId) return null;

        // Fetch the profile data
        const profile = await this.profileModel
          .findById(new Types.ObjectId(otherParticipantId))
          .select('profile_picture first_name last_name')
          .lean();

        // Fetch the last message
        const lastMessage = await this.messageModel
          .findById(conversation.last_message_id)
          .lean();

        // Determine if the current user is the first participant
        const isFirstParticipant =
          conversation.participants[0].toString() === userId.toString();

        // Get the correct markedAsUnread value
        const markedAsUnread = isFirstParticipant
          ? conversation.marked_as_unread[0]
          : conversation.marked_as_unread[1];

        return {
          _id: conversation._id,
          lastMessage: lastMessage || null,
          unseenCount: conversation.unseen_count,
          markedAsUnread, 
          otherParticipant: {
            _id: otherParticipantId,
            first_name: profile?.first_name,
            last_name: profile?.last_name,
            profile_picture: profile?.profile_picture,
          },
        };
      }),
    );

    // Filter out any null conversations
    const filteredConversations = modifiedConversations.filter(
      (conv) => conv !== null,
    );

    // Sort by last message date (newest first)
    const sortedConversations = filteredConversations.sort((a, b) => {
      const dateA = a.lastMessage?.sent_at
        ? new Date(a.lastMessage.sent_at)
        : new Date(0);
      const dateB = b.lastMessage?.sent_at
        ? new Date(b.lastMessage.sent_at)
        : new Date(0);
      return dateB.getTime() - dateA.getTime();
    });

    const mappedConversations = getConversations(sortedConversations);
    mappedConversations.forEach((conversation) => {
      if (conversation.unseenCount === undefined) {
        conversation.unseenCount =
          sortedConversations.find(
            (sortedConversation) =>
              sortedConversation._id.toString() === conversation._id.toString(),
          )?.unseenCount ?? 0;
      }
    });
    const paginatedConversations = mappedConversations.slice(
      skip,
      skip + limit,
    );
    return {
      data: paginatedConversations,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit,
      },
    };
  }
  /**
   * Retrieves paginated messages for a conversation
   * @param conversationId - ID of the conversation
   * @param page - Page number for pagination (default: 1)
   * @param limit - Number of items per page (default: 10)
   * @returns {Object} Paginated message data
   */
  async getConversationMessages(
    conversationId: string,
    page: number = 1,
    limit: number = 10,
  ) {
    const skip = (page - 1) * limit;
    const total = await this.messageModel.countDocuments({
      conversation_id: new Types.ObjectId(conversationId),
    });
    const messages = await this.messageModel
      .find({ conversation_id: new Types.ObjectId(conversationId) })
      .sort({ sent_at: -1 }) 
      .skip(skip)
      .limit(limit)
      .lean();

    const mappedMessages = getMessages(messages);
    return {
      data: mappedMessages,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit,
      },
    };
  }
  /**
   * Marks a conversation as unread for a specific user
   * @param userId - ID of the user marking the conversation
   * @param conversationId - ID of the conversation to mark
   * @returns {Object} Updated conversation details
   * @throws {NotFoundException} If conversation not found
   * @throws {InternalServerErrorException} If update fails
   */
  async setConversationAsUnread(
    userId: Types.ObjectId,
    conversationId: Types.ObjectId,
  ) {
    // First find the conversation
    const conversation = await this.conversationModel.findById(conversationId);

    if (!conversation) {
      throw new Error('Conversation not found');
    }

    // Determine if the user is the first or second participant
    const isFirstParticipant = conversation.participants[0] == userId;

    // Update the correct position in markedAsUnread array
    const update = isFirstParticipant
      ? { $set: { 'marked_as_unread.0': true } }
      : { $set: { 'marked_as_unread.1': true } };

    // Update the conversation
    const updatedConversation = await this.conversationModel
      .findByIdAndUpdate(conversationId, update, { new: true })
      .lean();

    if (!updatedConversation) {
      throw new Error('Failed to update conversation');
    }

    // Format the response like getConversations
    const otherParticipantId = updatedConversation.participants.find(
      (participant: any) => participant.toString() !== userId.toString(),
    );

    if (!otherParticipantId) {
      throw new Error('Other participant not found');
    }

    // Fetch the profile data
    const profile = await this.profileModel
      .findById(new Types.ObjectId(otherParticipantId))
      .select('profile_picture first_name last_name')
      .lean();

    // Fetch the last message
    const lastMessage = await this.messageModel
      .findById(updatedConversation.last_message_id)
      .lean();

    // Get the correct markedAsUnread value
    const markedAsUnread = isFirstParticipant
      ? updatedConversation.marked_as_unread[0]
      : updatedConversation.marked_as_unread[1];

    return {
      _id: updatedConversation._id,
      lastMessage: lastMessage || null,
      unseenCount: updatedConversation.unseen_count,
      markedAsUnread,
      otherParticipant: {
        _id: otherParticipantId,
        first_name: profile?.first_name,
        last_name: profile?.last_name,
        profile_picture: profile?.profile_picture,
      },
    };
  }
  /**
   * Marks a conversation as read for a specific user
   * @param userId - ID of the user marking the conversation
   * @param conversationId - ID of the conversation to mark
   * @returns {Object} Updated conversation details
   * @throws {NotFoundException} If conversation not found
   * @throws {InternalServerErrorException} If update fails
   */
  async setConversationAsRead(
    userId: Types.ObjectId,
    conversationId: Types.ObjectId,
  ) {
    // First find the conversation
    const conversation = await this.conversationModel.findById(conversationId);

    if (!conversation) {
      throw new Error('Conversation not found');
    }

    // Determine if the user is the first or second participant
    const isFirstParticipant = conversation.participants[0] == userId;

    // Update the correct position in markedAsUnread array
    const update = isFirstParticipant
      ? { $set: { 'marked_as_unread.0': false } }
      : { $set: { 'marked_as_unread.1': false } };

    // Update the conversation
    const updatedConversation = await this.conversationModel
      .findByIdAndUpdate(conversationId, update, { new: true })
      .lean();

    if (!updatedConversation) {
      throw new Error('Failed to update conversation');
    }

    // Format the response like getConversations
    console.log('updatedConversation:', updatedConversation);
    const otherParticipantId = updatedConversation.participants.find(
      (participant: any) => participant.toString() !== userId.toString(),
    );
    console.log('otherParticipantId:', otherParticipantId);

    if (!otherParticipantId) {
      throw new Error('Other participant not found');
    }

    // Fetch the profile data
    const profile = await this.profileModel
      .findById(new Types.ObjectId(otherParticipantId))
      .select('profile_picture first_name last_name')
      .lean();
    console.log('profile:', profile);
    // Fetch the last message
    const lastMessage = await this.messageModel
      .findById(updatedConversation.last_message_id)
      .lean();

    // Get the correct markedAsUnread value
    const markedAsUnread = isFirstParticipant
      ? updatedConversation.marked_as_unread[0]
      : updatedConversation.marked_as_unread[1];

    return {
      _id: updatedConversation._id,
      lastMessage: lastMessage || null,
      unseenCount: updatedConversation.unseen_count,
      markedAsUnread,
      otherParticipant: {
        _id: otherParticipantId,
        firstName: profile?.first_name,
        lastName: profile?.last_name,
        profilePicture: profile?.profile_picture,
      },
    };
  }
}
