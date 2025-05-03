// test-socket-client.ts
import { io } from 'socket.io-client';

const userId = '68053435a1563ae05ae06a4c';

const socket = io('https://tawasolapp.me', {
  transports: ['websocket'],
  query: { userId: userId },
});

socket.on('connect', () => {
  console.log('Socket connected:', socket.id);
});

socket.on('newNotification', (data) => {
  console.log('Received notification:', data);
});
