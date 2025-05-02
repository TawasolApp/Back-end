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
    //console.log('Conversation:', conversation);

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
    //console.log('Conversation Id:', conversation._id);

    conversation.last_message_id = newMessage._id;
    conversation.unseen_count += 1;

    await conversation.save();
    await this.markMessagesAsRead(
      conversation._id,
      new Types.ObjectId(senderId),
    );
    // await newMessage.save();
    await this.updateUnseenCount(conversation._id);

    return { conversation, message: newMessage };
  }
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
    //console.log('update unseen count: ' + unseenCount);

    // Update the unseen_count field in the conversation
    await this.conversationModel.updateOne(
      { _id: new Types.ObjectId(conversationId) },
      { $set: { unseen_count: unseenCount } },
    );
  }

  async markMessagesAsDelivered(userId: string) {
    console.log('messages delivered');
    console.log('sheeeeeeeeeeeeeesh: ' + MessageStatus.Delivered.toString());

    await this.messageModel.updateMany(
      { receiver_id: new Types.ObjectId(userId), status: MessageStatus.Sent },
      { $set: { status: MessageStatus.Delivered.toString() } },
    );
  }

  async markMessagesAsRead(
    conversationId: Types.ObjectId,
    userId: Types.ObjectId,
  ) {
    console.log('in service read message');
    console.log('conversation' + conversationId);
    console.log('userId' + userId);
    await this.messageModel.updateMany(
      {
        conversation_id: conversationId,
        receiver_id: userId,
        status: {
          $in: [MessageStatus.Sent, MessageStatus.Delivered],
        }, // ✅ Find both
      },
      { $set: { status: MessageStatus.Read } }, // ✅ No .toString() needed
    );
    await this.updateUnseenCount(conversationId);

    console.log('after service read message');
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
      .lean();
    //console.log('Conversations:', conversations);

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

        // Determine if the current user is the first participant
        const isFirstParticipant =
          conversation.participants[0].toString() === userId.toString();

        // Get the correct markedAsUnread value
        const markedAsUnread = isFirstParticipant
          ? conversation.markedAsUnread[0]
          : conversation.markedAsUnread[1];

        return {
          _id: conversation._id,
          lastMessage: lastMessage || null,
          unseenCount: conversation.unseen_count,
          markedAsUnread, // Add this field
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
    // console.log('Sorted Conversations:', sortedConversations);
    // console.log('unseen count in service:', sortedConversations[0].unseenCount);

    const mappedConversations = getConversations(sortedConversations);
    // console.log('Mapped Conversations:', mappedConversations);
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

    // console.log(messages);
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
      ? { $set: { 'markedAsUnread.0': true } }
      : { $set: { 'markedAsUnread.1': true } };

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
      ? updatedConversation.markedAsUnread[0]
      : updatedConversation.markedAsUnread[1];

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
      ? { $set: { 'markedAsUnread.0': false } }
      : { $set: { 'markedAsUnread.1': false } };

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
      ? updatedConversation.markedAsUnread[0]
      : updatedConversation.markedAsUnread[1];

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
