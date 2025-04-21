// src/modules/gateway/notification.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { GetNotificationsDto } from 'src/notifications/dto/get-notifications.dto';

@WebSocketGateway({ cors: { origin: '*', methods: ['GET', 'POST'] } }) // Allow all origins for testing
export class NotificationGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private clients = new Map<string, any>(); // Map to store userId and client

  getClients() {
    return this.clients; // Public getter to access the clients map
  }

  handleConnection(client: any) {
    console.log(`Client connected: ${client.id}`);
    const userId = client.handshake.query.userId; // Assume userId is passed as a query parameter

    if (!userId) {
      console.warn(
        `Client ${client.id} attempted to connect without a userId.`,
      );
      client.disconnect(); // Disconnect the client if no userId is provided
      return;
    }

    this.clients.set(userId, client); // Map userId to client
    console.log(`Client ${client.id} connected with userId: ${userId}`);
    client.emit('connection', { message: 'Connected to WebSocket server!' });
  }

  handleDisconnect(client: any) {
    console.log(`Client disconnected: ${client.id}`);
    const userId = [...this.clients.entries()].find(
      ([, value]) => value.id === client.id,
    )?.[0];
    if (userId) {
      this.clients.delete(userId); // Remove client from map
    }
  }

  @SubscribeMessage('notify')
  handleNotify(@MessageBody() data: { userId: string; message: any }) {
    try {
      console.log('Received notification:', data);
      const targetClient = this.clients.get(data.userId); // Get client by userId
      if (targetClient) {
        targetClient.emit('newNotification', data.message); // Send notification to specific user
      } else {
        console.warn(`User with ID ${data.userId} is not connected.`);
      }
    } catch (error) {
      console.error('Error handling notification:', error);
    }
  }
}
