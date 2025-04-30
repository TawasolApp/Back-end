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
import { BadRequestException } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*', // Allow frontend URL in production
  },
})
export class MessagesGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  constructor(
    private readonly messagesService: MessagesService,
    @InjectModel(PlanDetail.name)
    private readonly planDetailModel: Model<PlanDetailDocument>,
  ) {}
  private server: Server;

  afterInit(server: Server) {
    this.server = server; // Initialize the server property
    console.log('✅ WebSocket server initialized');
  }
  async updatePremiumStatus(userId: string, isPremium: boolean) {
    // Find all sockets for this user
    const sockets = await this.server.fetchSockets();
    const userSockets = sockets.filter(
      (socket) => socket.data.userId === userId,
    );

    // Update premium status for each socket
    userSockets.forEach((socket) => {
      socket.data.isPremium = isPremium;
      console.log(`Updated premium status for user ${userId} to ${isPremium}`);
    });
  }

  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;

    if (userId) {
      client.data.userId = userId; // Attach userId to socket
      client.data.isPremium = isPremium(userId, this.planDetailModel); // Check if user is premium
      client.data.messageCount = 0; // Initialize message count
      console.log(`✅ Client ${client.id} connected with userId: ${userId}`);
      client.join(userId); // Automatically join their room
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
    if (client.data.messageCount >= 30 && !client.data.isPremium) {
      throw new BadRequestException(
        'You have reached the limit of 30 messages. Upgrade to premium to send more messages.',
      );
    }
    client.data.messageCount += 1; // Increment message count
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

    console.log('✅ Parsed payload:', payload);
    const messageDate = new Date();

    const media = Array.isArray(payload.media) ? payload.media : [];

    const senderId = client.data.userId; // Assuming you attached userId at connect time
    const { conversation, message } = await this.messagesService.createMessage(
      senderId,
      payload.receiverId,
      payload.text,
      media,
      messageDate,
    );

    client.to(payload.receiverId).emit('receive_message', {
      senderId: client.data.userId,
      text: payload.text,
      media: media,
      sentAt: messageDate,
    });

    console.log(
      `📨 Message sent from ${client.data.userId} to ${payload.receiverId}: ${payload.text}`,
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
