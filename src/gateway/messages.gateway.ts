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
    origin: '*', // Allow frontend URL in production
  },
})
export class MessagesGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
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
  handleMessage(
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

    client.to(payload.receiverId).emit('receive_message', {
      senderId: client.data.userId,
      text: payload.text,
    });

    console.log(
      `📨 Message sent from ${client.data.userId} to ${payload.receiverId}: ${payload.text}`,
    );
  }
}
