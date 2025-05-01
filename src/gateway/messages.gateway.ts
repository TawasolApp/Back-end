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
import { MessagesService } from '../messages/messages.service'; // Adjust the path as necessary
import { SendMessageDto } from '../messages/dto/send-message.dto';
import { Model, Types } from 'mongoose';
import { isPremium } from '../payments/helpers/check-premium.helper';
import {
  PlanDetail,
  PlanDetailDocument,
} from '../payments/infrastructure/database/schemas/plan-detail.schema';
import { InjectModel } from '@nestjs/mongoose';

import Redis from 'ioredis';

@WebSocketGateway({
  cors: {
    origin: '*', // Allow frontend URL in production
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
  ) {
    this.redis = new Redis();
    this.redis.on('error', (err) => {
      console.error('Redis error:', err.message);
    });
  }
  private server: Server;

  afterInit(server: Server) {
    this.server = server; // Initialize the server property
    console.log('✅ WebSocket server initialized');
  }
  async updatePremiumStatus(userId: string, isPremium: boolean) {
    // Find all sockets for this user
    try {
      const sockets = await this.server.fetchSockets();
      const userSockets = sockets.filter(
        (socket) => socket.data.userId === userId,
      );

      // Update premium status for each socket
      userSockets.forEach((socket) => {
        socket.data.isPremium = isPremium;
        console.log(
          `Updated premium status for user ${userId} to ${isPremium}`,
        );
      });
    } catch (error) {
      console.error('❌ Error updating premium status:', error.message);
    }
  }

  async handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;

    if (userId) {
      client.data.userId = userId;
      client.data.isPremium = await isPremium(userId, this.planDetailModel);
      console.log(`✅ Client ${client.id} connected with userId: ${userId}`);
      client.join(userId);
      this.messagesService.markMessagesAsDelivered(userId);
    } else {
      console.log('❌ Connection rejected: userId missing');
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    console.log(`⚡ Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('send_message')
  async handleMessage(
    @MessageBody() rawPayload: SendMessageDto,
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.data.userId;
    const isPremiumUser = client.data.isPremium;

    const redisKey = `message_count:${userId}`;
    let count = parseInt((await this.redis.get(redisKey)) || '0');
    console.log('Current message count:', count);

    if (count >= 30 && !isPremiumUser) {
      console.log('❌ Message limit reached for non-premium user');

      client.emit('error_message', {
        type: 'LIMIT_REACHED',
        message:
          'You have reached the limit of 30 messages. Upgrade to premium.',
      });

      return;
    }

    await this.redis.incr(redisKey); // Increment count

    // Optional: Set an expiry for daily reset
    if (count === 0) {
      await this.redis.expire(redisKey, 86400); // 24 hours
    }

    // Parse and send message (your existing logic below)
    let payload;
    try {
      payload =
        typeof rawPayload === 'string' ? JSON.parse(rawPayload) : rawPayload;
    } catch (error) {
      console.error('❌ Invalid JSON received:', error.message);
      return;
    }

    if (!payload.receiverId) {
      console.error('❌ Invalid payload: missing receiverId ');
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

    console.log(
      `📨 Message sent from ${senderId} to ${payload.receiverId}: ${payload.text}`,
    );
  }

  // Add these to your gateway
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

    console.log('convvvvvvvvv: ', payload);

    const userId = client.data.userId;
    const conversationId = payload.conversationId;

    console.log('id==== ', conversationId);

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
    // Parse if it's a string
    const parsed = typeof payload === 'string' ? JSON.parse(payload) : payload;

    // Extract receiverId
    const receiverId = parsed.receiverId || parsed;

    console.log('Typing event received for:', receiverId);

    client.to(receiverId).emit('typing', {
      senderId: client.data.userId,
    });
  }
}
