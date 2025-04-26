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
import { Injectable } from '@nestjs/common';
import { MessagesService } from '../messages/messages.service'; // Adjust the path as necessary

@WebSocketGateway({
  cors: {
    origin: '*', // Allow frontend URL in production
  },
})
export class MessagesGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  constructor(private readonly messagesService: MessagesService) {}
  afterInit(server: Server) {
    console.log('✅ WebSocket server initialized');
  }

  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;

    if (userId) {
      client.data.userId = userId; // Attach userId to socket
      console.log(`✅ Client ${client.id} connected with userId: ${userId}`);
      client.join(userId); // Automatically join their room
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
    @MessageBody() rawPayload: any,
    @ConnectedSocket() client: Socket,
  ) {
    let payload;
    try {
      payload =
        typeof rawPayload === 'string' ? JSON.parse(rawPayload) : rawPayload;
    } catch (error) {
      console.error('❌ Invalid JSON received:', error.message);
      return;
    }

    if (!payload.receiverId || !payload.text) {
      console.error('❌ Invalid payload: missing receiverId or text');
      return;
    }

    console.log('✅ Parsed payload:', payload);
    const messageDate = new Date();

    const senderId = client.data.userId; // Assuming you attached userId at connect time
    const { conversation, message } = await this.messagesService.createMessage(
      senderId,
      payload.receiverId,
      payload.text,
      messageDate,
    );

    client.to(payload.receiverId).emit('receive_message', {
      senderId: client.data.userId,
      text: payload.text,
      sentAt: messageDate,
    });

    console.log(
      `📨 Message sent from ${client.data.userId} to ${payload.receiverId}: ${payload.text}`,
    );
  }
}
