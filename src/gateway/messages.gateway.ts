import {
  SubscribeMessage,
  WebSocketGateway,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { MessagesService } from '../messages/messages.service';
import { SendMessageDto } from '../messages/dto/send-message.dto';
import { Model, Types } from 'mongoose';
import { isPremium } from '../payments/helpers/check-premium.helper';
import {
  PlanDetail,
  PlanDetailDocument,
} from '../payments/infrastructure/database/schemas/plan-detail.schema';
import { InjectModel } from '@nestjs/mongoose';

import Redis from 'ioredis';
import {
  Profile,
  ProfileDocument,
} from '../profiles/infrastructure/database/schemas/profile.schema';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class MessagesGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private redis: Redis;
  constructor(
    private readonly messagesService: MessagesService,
    @InjectModel(PlanDetail.name)
    private readonly planDetailModel: Model<PlanDetailDocument>,
    @InjectModel(Profile.name)
    private readonly profileModel: Model<ProfileDocument>,
  ) {
    this.redis = new Redis({
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });
    require('events').EventEmitter.defaultMaxListeners = 50;

    this.redis.on('error', (err) => {});
  }
  private server: Server;

  afterInit(server: Server) {
    this.server = server;
  }
  async updatePremiumStatus(userId: string, isPremium: boolean) {
    try {
      const sockets = await this.server.fetchSockets();
      const userSockets = sockets.filter(
        (socket) => socket.data.userId === userId,
      );
      userSockets.forEach((socket) => {
        socket.data.isPremium = isPremium;
      });
    } catch (error) {}
  }

  async handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;

    if (userId) {
      client.data.userId = userId;
      const profile = await this.profileModel
        .findById(new Types.ObjectId(userId))
        .lean();
      client.data.isPremium = profile?.is_premium;
      client.join(userId);
      this.messagesService.markMessagesAsDelivered(userId);
    } else {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {}

  @SubscribeMessage('send_message')
  async handleMessage(
    @MessageBody() rawPayload: SendMessageDto,
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.data.userId;
    const isPremiumUser = client.data.isPremium;

    const redisKey = `message_count:${userId}`;
    const count = parseInt((await this.redis.get(redisKey)) || '0');
    console.log('Current message count:', count);

    await this.redis.expire(redisKey, 864000);
    if (count >= 5 && !isPremiumUser) {
      client.emit('error_message', {
        type: 'LIMIT_REACHED',
        message:
          'You have reached the limit of 5 messages. Upgrade to premium.',
      });

      return;
    }
    await this.redis.incr(redisKey);

    client.emit('error_message', {
      type: 'ACK',
      message: 'Your message has been sent.',
    });
    let payload;
    try {
      payload =
        typeof rawPayload === 'string' ? JSON.parse(rawPayload) : rawPayload;
    } catch (error) {
      return;
    }

    if (!payload.receiverId) {
      return;
    }

    const messageDate = new Date();
    const media = Array.isArray(payload.media) ? payload.media : [];
    const senderId = client.data.userId;

    const { conversation, message } = await this.messagesService.createMessage(
      senderId,
      payload.receiverId,
      payload.text,
      media,
      messageDate,
    );

    client.to(payload.receiverId).emit('receive_message', {
      senderId,
      text: payload.text,
      media,
      sentAt: messageDate,
    });
  }
  @SubscribeMessage('messages_delivered')
  async handleDelivery(@ConnectedSocket() client: Socket) {
    const userId = client.data.userId;

    await this.messagesService.markMessagesAsDelivered(userId);
  }

  @SubscribeMessage('messages_read')
  async handleRead(
    @MessageBody() rawPayload: any,
    @ConnectedSocket() client: Socket,
  ) {
    const payload =
      typeof rawPayload === 'string' ? JSON.parse(rawPayload) : rawPayload;

    const userId = client.data.userId;
    const conversationId = payload.conversationId;

    await this.messagesService.markMessagesAsRead(
      new Types.ObjectId(conversationId),
      new Types.ObjectId(userId),
    );
  }
  @SubscribeMessage('typing')
  handleTyping(
    @MessageBody() payload: string | { receiverId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const parsed = typeof payload === 'string' ? JSON.parse(payload) : payload;
    const receiverId = parsed.receiverId || parsed;

    client.to(receiverId).emit('typing', {
      senderId: client.data.userId,
    });
  }
}
