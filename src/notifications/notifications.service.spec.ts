import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import { getModelToken } from '@nestjs/mongoose';
import { Notification } from './infrastructure/database/schemas/notification.schema';
import { Profile } from '../profiles/infrastructure/database/schemas/profile.schema';
import { Company } from '../companies/infrastructure/database/schemas/company.schema';
import { Types } from 'mongoose';
import * as notificationMappers from './mappers/notification.mapper';
import * as postHelpers from '../posts/helpers/posts.helpers';
import { CompanyManager } from '../companies/infrastructure/database/schemas/company-manager.schema';
import { User } from '../users/infrastructure/database/schemas/user.schema';

describe('NotificationsService', () => {
  let service: NotificationsService;

  let notificationModelMock: any;
  let profileModelMock: any;
  let companyManagerModelMock: any;
  let userModelMock: any;
  let companyModelMock: any;

  beforeEach(async () => {
    notificationModelMock = {
      find: jest.fn(),
      findOne: jest.fn(),
      countDocuments: jest.fn(),
      save: jest.fn(),
    };

    profileModelMock = {
      findById: jest.fn(),
    };

    companyManagerModelMock = {
      findById: jest.fn(),
    };

    userModelMock = {
      updateOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: getModelToken(Notification.name),
          useValue: notificationModelMock,
        },
        { provide: getModelToken(Profile.name), useValue: profileModelMock },
        {
          provide: getModelToken(CompanyManager.name),
          useValue: companyManagerModelMock,
        },

        {
          provide: getModelToken(User.name),
          useValue: userModelMock,
        },
        {
          provide: getModelToken(Company.name),
          useValue: companyModelMock,
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  it('[1] should be defined', () => {
    expect(service).toBeDefined();
  });

  it('[2] should fetch notifications for a user with pagination', async () => {
    const mockUserId = new Types.ObjectId().toString();
    const mockCompanyId = new Types.ObjectId().toString();
    const page = 1;
    const limit = 10;
    jest.spyOn(postHelpers, 'getUserAccessed').mockResolvedValue(mockUserId);

    const mockNotifications = [
      {
        _id: new Types.ObjectId(),
        receiver_id: mockUserId,
        sender_id: new Types.ObjectId(),
        timestamp: undefined, // Ensure one notification has a null timestamp
      },
      {
        _id: new Types.ObjectId(),
        receiver_id: mockUserId,
        sender_id: new Types.ObjectId(),
        timestamp: new Date().toISOString(),
      },
    ];
    const mappedNotifications = [
      {
        id: mockNotifications[0]._id.toString(),
        content: 'Test 1',
        timestamp: mockNotifications[0].timestamp,
      },
      {
        id: mockNotifications[1]._id.toString(),
        content: 'Test 2',
        timestamp: mockNotifications[1].timestamp,
      },
    ];

    notificationModelMock.find.mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(mockNotifications),
    });

    jest
      .spyOn(notificationMappers, 'mapToGetNotificationsDto')
      .mockResolvedValueOnce(mappedNotifications[0])
      .mockResolvedValueOnce(mappedNotifications[1]);

    const result = await service.getNotifications(
      mockUserId,
      mockCompanyId,
      page,
      limit,
    );

    const sortedNotifications = mappedNotifications.sort((a, b) => {
      if (!a || !a.timestamp || !b || !b.timestamp) return 0; // This condition will now be triggered
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });

    expect(result).toEqual(sortedNotifications);
    expect(notificationModelMock.find).toHaveBeenCalledWith({
      receiver_id: new Types.ObjectId(mockUserId),
      type: { $ne: 'Message' }, // Exclude notifications of type 'Message'
    });
    expect(notificationModelMock.find().skip).toHaveBeenCalledWith(
      (page - 1) * limit,
    );
    expect(notificationModelMock.find().limit).toHaveBeenCalledWith(limit);
  });
  it('[2-b] should fetch notifications for a user with pagination', async () => {
    const mockUserId = new Types.ObjectId().toString();
    const mockCompanyId = new Types.ObjectId().toString();
    const page = 1;
    const limit = 10;
    jest.spyOn(postHelpers, 'getUserAccessed').mockResolvedValue(mockUserId);

    const mockNotifications = [
      {
        _id: new Types.ObjectId(),
        receiver_id: mockUserId,
        sender_id: new Types.ObjectId(),
        timestamp: new Date().toISOString(), // Ensure one notification has a null timestamp
      },
      {
        _id: new Types.ObjectId(),
        receiver_id: mockUserId,
        sender_id: new Types.ObjectId(),
        timestamp: new Date().toISOString(),
      },
    ];
    const mappedNotifications = [
      {
        id: mockNotifications[0]._id.toString(),
        content: 'Test 1',
        timestamp: mockNotifications[0].timestamp,
      },
      {
        id: mockNotifications[1]._id.toString(),
        content: 'Test 2',
        timestamp: mockNotifications[1].timestamp,
      },
    ];

    notificationModelMock.find.mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(mockNotifications),
    });

    jest
      .spyOn(notificationMappers, 'mapToGetNotificationsDto')
      .mockResolvedValueOnce(mappedNotifications[0])
      .mockResolvedValueOnce(mappedNotifications[1]);

    const result = await service.getNotifications(
      mockUserId,
      mockCompanyId,
      page,
      limit,
    );

    const sortedNotifications = mappedNotifications.sort((a, b) => {
      if (!a || !a.timestamp || !b || !b.timestamp) return 0; // This condition will now be triggered
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });

    expect(result).toEqual(sortedNotifications);
    expect(notificationModelMock.find).toHaveBeenCalledWith({
      receiver_id: new Types.ObjectId(mockUserId),
      type: { $ne: 'Message' }, // Exclude notifications of type 'Message'
    });
    expect(notificationModelMock.find().skip).toHaveBeenCalledWith(
      (page - 1) * limit,
    );
    expect(notificationModelMock.find().limit).toHaveBeenCalledWith(limit);
  });

  it('[11] should fetch unread notifications for a user with pagination', async () => {
    const mockUserId = new Types.ObjectId().toString();
    const mockCompanyId = new Types.ObjectId().toString();
    const page = 1;
    const limit = 10;
    jest.spyOn(postHelpers, 'getUserAccessed').mockResolvedValue(mockUserId);

    const mockNotifications = [
      {
        _id: new Types.ObjectId(),
        receiver_id: mockUserId,
        sender_id: new Types.ObjectId(),
        seen: false,
      },
    ];
    const mappedNotifications = [
      { id: mockNotifications[0]._id.toString(), content: 'Test' },
    ];

    notificationModelMock.find.mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(mockNotifications),
    });

    jest
      .spyOn(notificationMappers, 'mapToGetNotificationsDto')
      .mockResolvedValueOnce(mappedNotifications[0]);

    const result = await service.getUnreadNotifications(
      mockUserId,
      mockCompanyId,
      page,
      limit,
    );

    expect(result).toEqual(mappedNotifications);
    expect(notificationModelMock.find).toHaveBeenCalledWith({
      receiver_id: new Types.ObjectId(mockUserId),
      seen: false, // Only include unseen notifications
      type: { $ne: 'Message' }, // Exclude notifications of type 'Message'
    });
    expect(notificationModelMock.find().skip).toHaveBeenCalledWith(
      (page - 1) * limit,
    );
    expect(notificationModelMock.find().limit).toHaveBeenCalledWith(limit);
  });

  it('[10] should fetch unread messages for a user with pagination', async () => {
    const mockUserId = new Types.ObjectId().toString();
    const mockCompanyId = new Types.ObjectId().toString();
    const page = 1;
    const limit = 10;
    jest.spyOn(postHelpers, 'getUserAccessed').mockResolvedValue(mockUserId);

    const mockNotifications = [
      {
        _id: new Types.ObjectId(),
        receiver_id: mockUserId,
        sender_id: new Types.ObjectId(),
        seen: false,
      },
    ];
    const mappedNotifications = [
      { id: mockNotifications[0]._id.toString(), content: 'Test' },
    ];

    notificationModelMock.find.mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(mockNotifications),
    });

    jest
      .spyOn(notificationMappers, 'mapToGetNotificationsDto')
      .mockResolvedValueOnce(mappedNotifications[0]);

    const result = await service.getUnreadNotifications(
      mockUserId,
      mockCompanyId,
      page,
      limit,
    );

    expect(result).toEqual(mappedNotifications);
    expect(notificationModelMock.find).toHaveBeenCalledWith({
      receiver_id: new Types.ObjectId(mockUserId),
      seen: false, // Only include unseen notifications
      type: { $ne: 'Message' }, // Exclude notifications of type 'Message'
    });
    expect(notificationModelMock.find().skip).toHaveBeenCalledWith(
      (page - 1) * limit,
    );
    expect(notificationModelMock.find().limit).toHaveBeenCalledWith(limit);
  });

  it('[3] should mark a notification as read', async () => {
    const mockNotificationId = new Types.ObjectId().toString();
    const mockUserId = new Types.ObjectId().toString();
    const mockCompanyId = new Types.ObjectId().toString();
    jest.spyOn(postHelpers, 'getUserAccessed').mockResolvedValue(mockUserId);
    const mockNotification = {
      _id: mockNotificationId,
      receiver_id: mockUserId,
      seen: false,
      save: jest.fn(),
    };

    notificationModelMock.findOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockNotification),
    });

    const result = await service.markAsRead(
      mockNotificationId,
      mockUserId,
      mockCompanyId,
    );

    expect(result).toEqual({ message: 'Notification marked as read' });
    expect(mockNotification.seen).toBe(true);
    expect(mockNotification.save).toHaveBeenCalled();
  });

  it('[4] should throw an error if notification not found or access denied', async () => {
    const mockNotificationId = new Types.ObjectId().toString();
    const mockUserId = new Types.ObjectId().toString();
    const mockCompanyId = new Types.ObjectId().toString();
    jest.spyOn(postHelpers, 'getUserAccessed').mockResolvedValue(mockUserId);

    notificationModelMock.findOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    });

    await expect(
      service.markAsRead(mockNotificationId, mockUserId, mockCompanyId),
    ).rejects.toThrow('Notification not found or access denied');
  });

  it('[5] should get unseen notification count for a user', async () => {
    const mockUserId = new Types.ObjectId().toString();
    const mockCount = 5;
    const mockCompanyId = new Types.ObjectId().toString();
    jest.spyOn(postHelpers, 'getUserAccessed').mockResolvedValue(mockUserId);

    notificationModelMock.countDocuments.mockResolvedValue(mockCount);

    const result = await service.getUnseenCount(mockUserId, mockCompanyId);

    expect(result).toEqual({ unseenCount: mockCount });
    expect(notificationModelMock.countDocuments).toHaveBeenCalledWith({
      receiver_id: new Types.ObjectId(mockUserId),
      seen: false,
      type: { $ne: 'Message' }, // Exclude notifications of type 'Message'
    });
  });

  it('[5-b] should get unseen notification count for a user', async () => {
    const mockUserId = new Types.ObjectId().toString();
    const mockCount = 5;
    const mockCompanyId = new Types.ObjectId().toString();
    jest.spyOn(postHelpers, 'getUserAccessed').mockResolvedValue(mockUserId);

    notificationModelMock.countDocuments.mockResolvedValue(mockCount);

    const result = await service.getUnseenMessagesCount(
      mockUserId,
      mockCompanyId,
    );

    expect(result).toEqual({ unseenCount: mockCount });
    expect(notificationModelMock.countDocuments).toHaveBeenCalledWith({
      receiver_id: new Types.ObjectId(mockUserId),
      seen: false,
      type: 'Message',
    });
  });

  it('[6] should handle errors in getNotifications gracefully', async () => {
    const mockUserId = new Types.ObjectId().toString();
    const mockCompanyId = new Types.ObjectId().toString();
    jest.spyOn(postHelpers, 'getUserAccessed').mockResolvedValue(mockUserId);

    notificationModelMock.find.mockImplementation(() => {
      throw new Error('Database error');
    });

    await expect(
      service.getNotifications(mockUserId, mockCompanyId, 1, 10),
    ).rejects.toThrow('Failed to fetch notifications');
  });

  it('[7] should handle errors in markAsRead gracefully', async () => {
    const mockNotificationId = new Types.ObjectId().toString();
    const mockUserId = new Types.ObjectId().toString();
    const mockCompanyId = new Types.ObjectId().toString();
    jest.spyOn(postHelpers, 'getUserAccessed').mockResolvedValue(mockUserId);

    notificationModelMock.findOne.mockImplementation(() => {
      throw new Error('Database error');
    });

    await expect(
      service.markAsRead(mockNotificationId, mockUserId, mockCompanyId),
    ).rejects.toThrow('Failed to mark notification as read');
  });

  it('[8] should handle errors in getUnseenCount gracefully', async () => {
    const mockUserId = new Types.ObjectId().toString();
    const mockCompanyId = new Types.ObjectId().toString();
    jest.spyOn(postHelpers, 'getUserAccessed').mockResolvedValue(mockUserId);

    notificationModelMock.countDocuments.mockImplementation(() => {
      throw new Error('Database error');
    });

    await expect(
      service.getUnseenCount(mockUserId, mockCompanyId),
    ).rejects.toThrow('Failed to fetch unseen notification count');
  });

  it('[8-b] should handle errors in getUnseenCount gracefully', async () => {
    const mockUserId = new Types.ObjectId().toString();
    const mockCompanyId = new Types.ObjectId().toString();
    jest.spyOn(postHelpers, 'getUserAccessed').mockResolvedValue(mockUserId);

    notificationModelMock.countDocuments.mockImplementation(() => {
      throw new Error('Database error');
    });

    await expect(
      service.getUnseenMessagesCount(mockUserId, mockCompanyId),
    ).rejects.toThrow('Failed to fetch unseen notification count');
  });

  it('[9] should test subscribeFcmToken', async () => {
    const mockUserId = new Types.ObjectId().toString();
    const mockFcmToken = 'mockFcmToken';

    userModelMock.updateOne.mockReturnValue({});
    await service.subscribeFcmToken(mockUserId, mockFcmToken);
    expect(userModelMock.updateOne).toHaveBeenCalledWith(
      { _id: new Types.ObjectId(mockUserId) },
      {
        $addToSet: { fcm_tokens: mockFcmToken },
      },
    );
  });

  it('[12] should throw an InternalServerErrorException in getUnreadNotifications', async () => {
    const mockUserId = new Types.ObjectId().toString();
    const mockCompanyId = new Types.ObjectId().toString();
    const page = 1;
    const limit = 10;
    jest.spyOn(postHelpers, 'getUserAccessed').mockResolvedValue(mockUserId);

    notificationModelMock.find.mockImplementation(() => {
      throw new Error('Database error');
    });

    await expect(
      service.getUnreadNotifications(mockUserId, mockCompanyId, page, limit),
    ).rejects.toThrow('Failed to fetch unread messages');
  });
});
