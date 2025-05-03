import { Test, TestingModule } from '@nestjs/testing';
import { MessagesService } from './messages.service';
import { getModelToken } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Message,
  MessageDocument,
} from './infrastructure/database/schemas/message.schema';
import {
  Conversation,
  ConversationDocument,
} from './infrastructure/database/schemas/conversation.schema';
import { MessageStatus } from './enums/message-status.enum';
import {
  Profile,
  ProfileDocument,
} from '../profiles/infrastructure/database/schemas/profile.schema';
import {
  Company,
  CompanyDocument,
} from '../companies/infrastructure/database/schemas/company.schema';
import { CompanyManager } from '../companies/infrastructure/database/schemas/company-manager.schema';
import {
  User,
  UserDocument,
} from '../users/infrastructure/database/schemas/user.schema';
import { NotificationGateway } from '../common/gateway/notification.gateway';
import { NotFoundException } from '@nestjs/common';

// Helper type for mocked documents
type MockDocument<T> = T & {
  _id: Types.ObjectId;
  save: jest.Mock;
};

describe('MessagesService', () => {
  let service: MessagesService;
  let messageModel: Model<MessageDocument>;
  let conversationModel: Model<ConversationDocument>;
  let profileModel: Model<ProfileDocument>;
  let companyModel: Model<CompanyDocument>;
  let companyManagerModel: Model<any>;
  let userModel: Model<UserDocument>;
  let notificationGateway: NotificationGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessagesService,
        {
          provide: getModelToken(Message.name),
          useValue: {
            create: jest.fn(),
            countDocuments: jest.fn(),
            updateMany: jest.fn(),
            find: jest.fn(),
            findById: jest.fn(),
          },
        },
        {
          provide: getModelToken(Conversation.name),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn().mockImplementation((doc) => ({
              ...doc,
              _id: new Types.ObjectId(),
              save: jest.fn().mockResolvedValue(doc),
            })),
            find: jest.fn(),
            countDocuments: jest.fn(),
            findById: jest.fn(),
            findByIdAndUpdate: jest.fn(),
            updateOne: jest.fn(),
          },
        },
        {
          provide: getModelToken(Profile.name),
          useValue: {
            findById: jest.fn(),
          },
        },
        {
          provide: getModelToken(Company.name),
          useValue: {
            findById: jest.fn(),
          },
        },
        {
          provide: getModelToken(CompanyManager.name),
          useValue: {},
        },
        {
          provide: getModelToken(User.name),
          useValue: {
            findById: jest.fn(),
          },
        },
        {
          provide: NotificationGateway,
          useValue: {
            emitNotification: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<MessagesService>(MessagesService);
    messageModel = module.get<Model<MessageDocument>>(
      getModelToken(Message.name),
    );
    conversationModel = module.get<Model<ConversationDocument>>(
      getModelToken(Conversation.name),
    );
    profileModel = module.get<Model<ProfileDocument>>(
      getModelToken(Profile.name),
    );
    companyModel = module.get<Model<CompanyDocument>>(
      getModelToken(Company.name),
    );
    companyManagerModel = module.get<Model<any>>(
      getModelToken(CompanyManager.name),
    );
    userModel = module.get<Model<UserDocument>>(getModelToken(User.name));
    notificationGateway = module.get<NotificationGateway>(NotificationGateway);
  });

  describe('createMessage', () => {
    it('should create a new message and conversation', async () => {
      const senderId = new Types.ObjectId();
      const receiverId = new Types.ObjectId();
      const messageText = 'Hello';
      const media = ['image1.jpg'];
      const messageDate = new Date();

      const mockConversation: MockDocument<Conversation> = {
        _id: new Types.ObjectId(),
        participants: [senderId, receiverId],
        unseen_count: 0,
        last_message_id: new Types.ObjectId(),
        marked_as_unread: [false, false],
        save: jest.fn().mockResolvedValue(this),
      };

      const mockMessage = {
        _id: new Types.ObjectId(),
        sender_id: new Types.ObjectId(senderId),
        receiver_id: new Types.ObjectId(receiverId),
        conversation_id: mockConversation._id,
        text: messageText,
        media,
        status: MessageStatus.Sent,
        sent_at: messageDate,
      };

      jest.spyOn(conversationModel, 'findOne').mockResolvedValue(null);
      jest
        .spyOn(conversationModel, 'create')
        .mockResolvedValue(mockConversation as any);
      jest.spyOn(messageModel, 'create').mockResolvedValue(mockMessage as any);
      jest.spyOn(profileModel, 'findById').mockResolvedValue({} as any);
      jest.spyOn(companyModel, 'findById').mockResolvedValue(null);
      jest.spyOn(userModel, 'findById').mockResolvedValue({} as any);

      const result = await service.createMessage(
        senderId.toString(),
        receiverId.toString(),
        messageText,
        media,
        messageDate,
      );

      expect(conversationModel.findOne).toHaveBeenCalledWith({
        participants: { $all: [senderId, receiverId] },
      });
      expect(conversationModel.create).toHaveBeenCalledWith({
        participants: [senderId, receiverId],
        unseen_count: 0,
      });
      expect(messageModel.create).toHaveBeenCalledWith({
        _id: expect.any(Types.ObjectId),
        sender_id: new Types.ObjectId(senderId),
        receiver_id: new Types.ObjectId(receiverId),
        conversation_id: mockConversation._id,
        text: messageText,
        media,
        status: MessageStatus.Sent,
        sent_at: messageDate,
      });
      expect(result).toEqual({
        conversation: mockConversation,
        message: mockMessage,
      });
    });
  });

  describe('updateUnseenCount', () => {
    it('should update unseen count for conversation', async () => {
      const conversationId = new Types.ObjectId();
      const count = 5;

      jest.spyOn(messageModel, 'countDocuments').mockResolvedValue(count);
      jest.spyOn(conversationModel, 'updateOne').mockResolvedValue({} as any);

      await service.updateUnseenCount(conversationId);

      expect(messageModel.countDocuments).toHaveBeenCalledWith({
        conversation_id: conversationId,
        status: {
          $in: [
            MessageStatus.Sent.toString(),
            MessageStatus.Delivered.toString(),
          ],
        },
      });
      expect(conversationModel.updateOne).toHaveBeenCalledWith(
        { _id: conversationId },
        { $set: { unseen_count: count } },
      );
    });
  });

  describe('markMessagesAsDelivered', () => {
    it('should mark messages as delivered', async () => {
      const userId = new Types.ObjectId().toString();

      jest.spyOn(messageModel, 'updateMany').mockResolvedValue({} as any);

      await service.markMessagesAsDelivered(userId);

      expect(messageModel.updateMany).toHaveBeenCalledWith(
        {
          receiver_id: new Types.ObjectId(userId),
          status: MessageStatus.Sent,
        },
        { $set: { status: MessageStatus.Delivered.toString() } },
      );
    });
  });

  describe('markMessagesAsRead', () => {
    it('should mark messages as read', async () => {
      const conversationId = new Types.ObjectId();
      const userId = new Types.ObjectId();

      jest.spyOn(messageModel, 'updateMany').mockResolvedValue({} as any);
      jest.spyOn(service, 'updateUnseenCount').mockResolvedValue();

      await service.markMessagesAsRead(conversationId, userId);

      expect(messageModel.updateMany).toHaveBeenCalledWith(
        {
          conversation_id: conversationId,
          receiver_id: userId,
          status: { $in: [MessageStatus.Sent, MessageStatus.Delivered] },
        },
        { $set: { status: MessageStatus.Read } },
      );
      expect(service.updateUnseenCount).toHaveBeenCalledWith(conversationId);
    });
  });

  describe('getConversations', () => {
    it('should return paginated conversations', async () => {
      const userId = new Types.ObjectId();
      const otherParticipantId = new Types.ObjectId();
      const conversationId = new Types.ObjectId();
      const messageId = new Types.ObjectId();

      const mockConversations = [
        {
          _id: conversationId,
          participants: [userId, otherParticipantId],
          last_message_id: messageId,
          unseen_count: 1,
          markedAsUnread: [false, false],
        },
      ];

      const mockProfile = {
        first_name: 'John',
        last_name: 'Doe',
        profile_picture: 'profile.jpg',
      };

      const mockMessage = {
        _id: messageId,
        text: 'Hello',
        sent_at: new Date(),
      };

      jest
        .spyOn(conversationModel, 'find')
        .mockResolvedValue(mockConversations);
      jest.spyOn(conversationModel, 'countDocuments').mockResolvedValue(1);
      jest.spyOn(profileModel, 'findById').mockResolvedValue(mockProfile);
      jest.spyOn(messageModel, 'findById').mockResolvedValue(mockMessage);

      const result = await service.getConversations(userId, 1, 10);

      expect(result.data).toHaveLength(1);
      expect(result.pagination).toEqual({
        currentPage: 1,
        totalPages: 1,
        totalItems: 1,
        itemsPerPage: 10,
      });
    });

    it('should handle missing profile', async () => {
      const userId = new Types.ObjectId();
      const otherParticipantId = new Types.ObjectId();
      const conversationId = new Types.ObjectId();
      const messageId = new Types.ObjectId();

      const mockConversations = [
        {
          _id: conversationId,
          participants: [userId, otherParticipantId],
          last_message_id: messageId,
          unseen_count: 1,
          markedAsUnread: [false, false],
        },
      ];

      jest
        .spyOn(conversationModel, 'find')
        .mockResolvedValue(mockConversations);
      jest.spyOn(conversationModel, 'countDocuments').mockResolvedValue(1);
      jest.spyOn(profileModel, 'findById').mockResolvedValue(null);
      jest.spyOn(messageModel, 'findById').mockResolvedValue(null);

      const result = await service.getConversations(userId, 1, 10);

      expect(result.data[0].otherParticipant.firstName).toBeUndefined();
    });
  });

  describe('getConversationMessages', () => {
    it('should return paginated messages', async () => {
      const conversationId = new Types.ObjectId().toString();
      const mockMessages = [
        {
          _id: new Types.ObjectId(),
          text: 'Hello',
          sent_at: new Date(),
        },
      ];

      jest.spyOn(messageModel, 'countDocuments').mockResolvedValue(1);
      jest.spyOn(messageModel, 'find').mockResolvedValue(mockMessages);

      const result = await service.getConversationMessages(
        conversationId,
        1,
        10,
      );

      expect(result.data).toHaveLength(1);
      expect(result.pagination).toEqual({
        currentPage: 1,
        totalPages: 1,
        totalItems: 1,
        itemsPerPage: 10,
      });
    });
  });

  describe('setConversationAsUnread', () => {
    it('should mark conversation as unread', async () => {
      const userId = new Types.ObjectId();
      const otherParticipantId = new Types.ObjectId();
      const conversationId = new Types.ObjectId();
      const messageId = new Types.ObjectId();

      const mockConversation = {
        _id: conversationId,
        participants: [userId, otherParticipantId],
        last_message_id: messageId,
        unseen_count: 1,
        markedAsUnread: [false, false],
      };

      const mockUpdatedConversation = {
        ...mockConversation,
        markedAsUnread: [true, false],
      };

      const mockProfile = {
        first_name: 'John',
        last_name: 'Doe',
        profile_picture: 'profile.jpg',
      };

      const mockMessage = {
        _id: messageId,
        text: 'Hello',
        sent_at: new Date(),
      };

      jest
        .spyOn(conversationModel, 'findById')
        .mockResolvedValue(mockConversation);
      jest
        .spyOn(conversationModel, 'findByIdAndUpdate')
        .mockResolvedValue(mockUpdatedConversation);
      jest.spyOn(profileModel, 'findById').mockResolvedValue(mockProfile);
      jest.spyOn(messageModel, 'findById').mockResolvedValue(mockMessage);

      const result = await service.setConversationAsUnread(
        userId,
        conversationId,
      );

      expect(result.markedAsUnread).toBe(true);
    });

    it('should throw NotFoundException if conversation not found', async () => {
      jest.spyOn(conversationModel, 'findById').mockResolvedValue(null);

      await expect(
        service.setConversationAsUnread(
          new Types.ObjectId(),
          new Types.ObjectId(),
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('setConversationAsRead', () => {
    it('should mark conversation as read', async () => {
      const userId = new Types.ObjectId();
      const otherParticipantId = new Types.ObjectId();
      const conversationId = new Types.ObjectId();
      const messageId = new Types.ObjectId();

      const mockConversation = {
        _id: conversationId,
        participants: [userId, otherParticipantId],
        last_message_id: messageId,
        unseen_count: 1,
        markedAsUnread: [true, false],
      };

      const mockUpdatedConversation = {
        ...mockConversation,
        markedAsUnread: [false, false],
      };

      const mockProfile = {
        first_name: 'John',
        last_name: 'Doe',
        profile_picture: 'profile.jpg',
      };

      const mockMessage = {
        _id: messageId,
        text: 'Hello',
        sent_at: new Date(),
      };

      jest
        .spyOn(conversationModel, 'findById')
        .mockResolvedValue(mockConversation);
      jest
        .spyOn(conversationModel, 'findByIdAndUpdate')
        .mockResolvedValue(mockUpdatedConversation);
      jest.spyOn(profileModel, 'findById').mockResolvedValue(mockProfile);
      jest.spyOn(messageModel, 'findById').mockResolvedValue(mockMessage);

      const result = await service.setConversationAsRead(
        userId,
        conversationId,
      );

      expect(result.markedAsUnread).toBe(false);
    });

    it('should throw NotFoundException if conversation not found', async () => {
      jest.spyOn(conversationModel, 'findById').mockResolvedValue(null);

      await expect(
        service.setConversationAsRead(
          new Types.ObjectId(),
          new Types.ObjectId(),
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
