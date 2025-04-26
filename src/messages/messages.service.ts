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
      sender_id: senderId,
      conversation_id: conversation._id,
      text: messageText,
      status: MessageStatus.Sent,
      sent_at: messageDate,
    });

    conversation.last_message_id = newMessage._id;
    conversation.unseen_count += 1;
    await conversation.save();

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

  async getConversations(userId: Types.ObjectId) {
    const conversations = await this.conversationModel
      .find({ participants: userId })
      .populate({
        path: 'participants', // Populate participants (users)
        model: 'User',
        select: 'first_name last_name ', // This refers to the User model
      })
      .populate({
        path: 'last_message_id', // Populate the last message in the conversation
        model: 'Message',
      })
      .lean();

    // Now, manually populate the profile for each participant
    const modifiedConversations = await Promise.all(
      conversations.map(async (conversation) => {
        const otherParticipant = conversation.participants.find(
          (participant: any) =>
            participant._id.toString() !== userId.toString(),
        );

        // Manually populate profile for each participant
        if (otherParticipant) {
          const profile = await this.profileModel
            .findOne({ _id: otherParticipant._id }) // Find profile by user id
            .select('profile_picture'); // Only select necessary fields

          (otherParticipant as any).profile = profile; // Add the profile to the participant (cast to `any` type)
        }

        return {
          _id: conversation._id,
          lastMessage: conversation.last_message_id,
          unseenCount: conversation.unseen_count,
          otherParticipant, // Add the populated participant here
        };
      }),
    );

    return modifiedConversations;
  }
}
