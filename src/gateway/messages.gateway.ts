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
    console.log(`Client connected: ${client.id}`);
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
