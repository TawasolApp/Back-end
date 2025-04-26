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
      .populate({ path: 'participants', model: 'User' })
      .populate({ path: 'last_message_id', model: 'Message' })
      .lean();

    const modifiedConversations = conversations.map((conversation) => {
      const otherParticipant = conversation.participants.find(
        (participant: any) => participant._id.toString() !== userId.toString(),
      );

      return {
        _id: conversation._id,
        last_messaged: conversation.last_message_id,
        unseen_count: conversation.unseen_count,
        otherParticipant, // ✅ keep only the other participant
      };
    });

    return modifiedConversations;
  }
}
