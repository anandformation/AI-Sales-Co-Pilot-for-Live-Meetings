import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:3001';

const socket = io(SOCKET_URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5
});

socket.on('connect', () => {
  console.log('[Socket] Connected:', socket.id);
});

socket.on('disconnect', () => {
  console.log('[Socket] Disconnected');
});

socket.on('connect_error', (err) => {
  console.error('[Socket] Connection error:', err.message);
});

export default socket;
