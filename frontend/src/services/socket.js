import { io } from 'socket.io-client';
import { useAuthStore } from '../store/authStore.js';

let socket;

export function getSocket() {
  const { accessToken } = useAuthStore.getState();
  if (!socket) {
    socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 800,
      auth: { token: accessToken }
    });
  }
  socket.auth = { token: accessToken };
  return socket;
}

export function disconnectSocket() {
  if (socket) socket.disconnect();
}
