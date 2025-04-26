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
import * as jwt from 'jsonwebtoken';

@WebSocketGateway({
  cors: {
    origin: '*', // or specify your frontend URL
  },
})
export class MessagesGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  afterInit(server: Server) {
    console.log('WebSocket server initialized');
  }

  handleConnection(client: Socket) {
    const token = client.handshake.query.token;
    if (typeof token === 'string') {
      try {
        const user = jwt.verify(
          token,
          '4a52519e47d98ddd4b515a71ca31443d530b16bd48218cacd2805ea7d0cdc5d4',
        );
        console.log('User authenticated:', user);
      } catch (error) {
        console.log('Invalid token');
        client.disconnect();
      }
    } else {
      console.log('Token is missing or invalid');
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join')
  handleJoinRoom(
    @MessageBody() userId: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.join(userId);
    console.log(`User with ID ${userId} joined their room`);
  }

  @SubscribeMessage('send_message')
  handleMessage(
    @MessageBody()
    payload: { receiverId: string; text: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.to(payload.receiverId).emit('receive_message', payload);
    console.log(`Message sent to ${payload.receiverId}: ${payload.text}`);
  }
}
