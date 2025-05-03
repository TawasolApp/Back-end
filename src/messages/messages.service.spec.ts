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
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Company } from '../companies/infrastructure/database/schemas/company.schema';
import { CompanyManager } from '../companies/infrastructure/database/schemas/company-manager.schema';
import { User } from '../users/infrastructure/database/schemas/user.schema';
import { Notification } from '../notifications/infrastructure/database/schemas/notification.schema';
import { NotificationGateway } from '../common/gateway/notification.gateway';
import * as notificationHelpers from '../notifications/helpers/notification.helper';

describe('MessagesService', () => {
  let service: MessagesService;
  let messageModel: Model<MessageDocument>;
  let conversationModel: Model<ConversationDocument>;
  let profileModel: Model<ProfileDocument>;

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
            findOne: jest.fn(),

            lean: jest.fn(),
            exec: jest.fn(),
            findByIdAndUpdate: jest.fn().mockImplementation(() => ({
              lean: jest.fn().mockImplementation(() => ({
                exec: jest.fn().mockResolvedValue({
                  _id: 'conv123',
                  unreadBy: ['participant1'],
                }),
              })),
            })),
          },
        },
        {
          provide: getModelToken(Conversation.name),
          useValue: {
            create: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
            countDocuments: jest.fn(),
            findById: jest.fn(),
            findByIdAndUpdate: jest.fn().mockReturnThis(),
            updateOne: jest.fn(),
            findOneAndUpdate: jest.fn(),
            lean: jest.fn().mockReturnThis(),
            exec: jest.fn(),
          },
        },
        {
          provide: getModelToken(Profile.name),
          useValue: {
            findById: jest.fn(),
          },
        },
        {
          provide: getModelToken(Notification.name),
          useValue: {},
        },
        {
          provide: getModelToken(Company.name),
          useValue: {},
        },
        {
          provide: getModelToken(CompanyManager.name),
          useValue: {},
        },
        {
          provide: getModelToken(User.name),
          useValue: {},
        },
        {
          provide: NotificationGateway,
          useValue: {},
        },
      ],
    }).compile();
    jest.spyOn(notificationHelpers, 'addNotification').mockResolvedValue(null);
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
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createMessage', () => {
    it('should create a new conversation and message when none exists', async () => {
      const senderId = new Types.ObjectId().toString();
      const receiverId = new Types.ObjectId().toString();
      const messageText = 'Hello';
      const media = ['image1.jpg'];
      const messageDate = new Date();

      const mockConversation = {
        _id: new Types.ObjectId(),
        participants: [senderId, receiverId],
        last_message_id: new Types.ObjectId(),
        unseen_count: 1,
        save: jest.fn(),
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
      jest.spyOn(service, 'markMessagesAsRead').mockResolvedValue(undefined);
      jest.spyOn(service, 'updateUnseenCount').mockResolvedValue(undefined);

      const result = await service.createMessage(
        senderId,
        receiverId,
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

    it('should use existing conversation and create message', async () => {
      const senderId = new Types.ObjectId().toString();
      const receiverId = new Types.ObjectId().toString();
      const messageText = 'Hello again';
      const media = ['image2.jpg'];
      const messageDate = new Date();

      const existingConversation = {
        _id: new Types.ObjectId(),
        participants: [senderId, receiverId],
        last_message_id: new Types.ObjectId('645a3a1e7e3d4f001f3e3e3e'),
        unseen_count: 3,
        save: jest.fn(),
      };

      const mockMessage = {
        _id: new Types.ObjectId(),
        sender_id: new Types.ObjectId(senderId),
        receiver_id: new Types.ObjectId(receiverId),
        conversation_id: existingConversation._id,
        text: messageText,
        media,
        status: MessageStatus.Sent,
        sent_at: messageDate,
      };

      jest
        .spyOn(conversationModel, 'findOne')
        .mockResolvedValue(existingConversation as any);
      jest.spyOn(messageModel, 'create').mockResolvedValue(mockMessage as any);
      jest.spyOn(service, 'markMessagesAsRead').mockResolvedValue(undefined);
      jest.spyOn(service, 'updateUnseenCount').mockResolvedValue(undefined);

      const result = await service.createMessage(
        senderId,
        receiverId,
        messageText,
        media,
        messageDate,
      );

      expect(conversationModel.findOne).toHaveBeenCalledWith({
        participants: { $all: [senderId, receiverId] },
      });
      expect(conversationModel.create).not.toHaveBeenCalled();
      expect(messageModel.create).toHaveBeenCalled();
      expect(existingConversation.save).toHaveBeenCalled();
      expect(result).toEqual({
        conversation: existingConversation,
        message: mockMessage,
      });
    });
  });

  describe('updateUnseenCount', () => {
    it('should update unseen count for conversation', async () => {
      const conversationId = new Types.ObjectId();
      const unseenCount = 5;

      jest.spyOn(messageModel, 'countDocuments').mockResolvedValue(unseenCount);
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
        { $set: { unseen_count: unseenCount } },
      );
    });
  });

  describe('markMessagesAsDelivered', () => {
    it('should update message status to delivered', async () => {
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
    it('should update message status to read and update unseen count', async () => {
      const conversationId = new Types.ObjectId();
      const userId = new Types.ObjectId();

      jest.spyOn(messageModel, 'updateMany').mockResolvedValue({} as any);
      jest.spyOn(service, 'updateUnseenCount').mockResolvedValue(undefined);

      await service.markMessagesAsRead(conversationId, userId);

      expect(messageModel.updateMany).toHaveBeenCalledWith(
        {
          conversation_id: conversationId,
          receiver_id: userId,
          status: {
            $in: [MessageStatus.Sent, MessageStatus.Delivered],
          },
        },
        { $set: { status: MessageStatus.Read } },
      );
      expect(service.updateUnseenCount).toHaveBeenCalledWith(conversationId);
    });
  });

  describe('getConversations', () => {
    it('should return paginated conversations for user', async () => {
      const userId = new Types.ObjectId();
      const page = 1;
      const limit = 10;

      const mockConversations = [
        {
          _id: new Types.ObjectId(),
          participants: [userId, new Types.ObjectId()],
          last_message_id: new Types.ObjectId(),
          unseen_count: 2,
          marked_as_unread: [false, false],
        },
      ];

      const mockProfile = {
        first_name: 'John',
        last_name: 'Doe',
        profile_picture: 'profile.jpg',
      };

      const mockMessage = {
        _id: mockConversations[0].last_message_id,
        text: 'Last message',
        sent_at: new Date(),
      };

      jest.spyOn(conversationModel, 'find').mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockConversations),
      } as any);
      jest.spyOn(conversationModel, 'countDocuments').mockResolvedValue(1);
      jest.spyOn(profileModel, 'findById').mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(mockProfile),
        }),
      } as any);
      jest.spyOn(messageModel, 'findById').mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockMessage),
      } as any);

      const result = await service.getConversations(userId, page, limit);

      expect(result.data.length).toBe(1);
      expect(result.pagination.currentPage).toBe(page);
      expect(result.pagination.itemsPerPage).toBe(limit);
      expect(result.pagination.totalItems).toBe(1);
      expect(result.data[0].otherParticipant.firstName).toBe(
        mockProfile.first_name,
      );
    });
  });

  describe('getConversationMessages', () => {
    it('should return paginated messages for conversation', async () => {
      const conversationId = new Types.ObjectId().toString();
      const page = 1;
      const limit = 10;

      const mockMessages = [
        {
          _id: new Types.ObjectId(),
          text: 'Message 1',
          sent_at: new Date(),
          status: MessageStatus.Read,
        },
        {
          _id: new Types.ObjectId(),
          text: 'Message 2',
          sent_at: new Date(),
          status: MessageStatus.Read,
        },
      ];

      jest.spyOn(messageModel, 'countDocuments').mockResolvedValue(2);
      jest.spyOn(messageModel, 'find').mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue(mockMessages),
            }),
          }),
        }),
      } as any);

      const result = await service.getConversationMessages(
        conversationId,
        page,
        limit,
      );

      expect(result.data.length).toBe(2);
      expect(result.pagination.currentPage).toBe(page);
      expect(result.pagination.itemsPerPage).toBe(limit);
      expect(result.pagination.totalItems).toBe(2);
    });
  });
});
