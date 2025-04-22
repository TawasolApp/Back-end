// test-socket-client.ts
import { io } from 'socket.io-client';

const userId = '68053435a1563ae05ae06a4c'; // Replace with the desired userId

const socket = io('http://localhost:3000', {
  transports: ['websocket'],
  query: { userId: userId }, // Explicitly pass userId as a query parameter
});

socket.on('connect', () => {
  console.log('Socket connected:', socket.id);
});

socket.on('newNotification', (data) => {
  console.log('Received notification:', data);
});
