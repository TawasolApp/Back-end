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
@Injectable()
export class MessagesService {
  constructor(
    @InjectModel(Message.name)
    private readonly messageModel: Model<MessageDocument>,
    @InjectModel(Conversation.name)
    private readonly conversationModel: Model<ConversationDocument>,
    @InjectModel(Profile.name)
    private readonly profileModel: Model<ProfileDocument>, // Replace 'any' with the actual type of your Profile model
  ) {}

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
    console.log('Conversation:', conversation);

    if (!conversation) {
      conversation = await this.conversationModel.create({
        participants: [senderId, receiverId],
        unseen_count: 0,
      });
    }

    const newMessage = await this.messageModel.create({
      _id: new Types.ObjectId(),
      sender_id: senderId,
      conversation_id: conversation._id,
      text: messageText,
      media: media ?? [],
      status: MessageStatus.Sent,
      sent_at: messageDate,
    });

    conversation.last_message_id = newMessage._id;
    conversation.unseen_count += 1;
    await conversation.save();
    // await newMessage.save();

    return { conversation, message: newMessage };
  }

  async markMessagesAsDelivered(userId: string) {
    await this.messageModel.updateMany(
      { receiver_id: userId, status: MessageStatus.Sent },
      { $set: { status: MessageStatus.Delivered } },
    );
  }

  async markMessagesAsRead(conversationId: string, userId: string) {
    await this.messageModel.updateMany(
      {
        conversation_id: conversationId,
        receiver_id: userId,
        status: MessageStatus.Delivered,
      },
      { $set: { status: MessageStatus.Read } },
    );
  }

  async getConversations(
    userId: Types.ObjectId,
    page: number = 1,
    limit: number = 10,
  ) {
    // Calculate skip value based on page and limit
    const skip = (page - 1) * limit;

    // Find all conversations where the user is a participant with pagination
    const conversations = await this.conversationModel
      .find({ participants: userId })
      // .sort({ 'last_message_id.sent_at': -1 }) // Sort by most recent message first
      // .skip(skip)
      // .limit(limit)
      .lean();
    console.log('Conversations:', conversations);

    // Get total count for pagination metadata
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

        return {
          _id: conversation._id,
          lastMessage: lastMessage || null,
          unseenCount: conversation.unseen_count,
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

    // Sort by last message date (newest first) - might be redundant since we sorted the query
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
      .sort({ sent_at: -1 }) // Sort by most recent message first
      .skip(skip)
      .limit(limit)
      .lean();

    console.log(messages);
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
}
