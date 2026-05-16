import { io } from 'socket.io-client';
import { useAuthStore } from '../store/authStore.js';

let socket;

export function getSocket() {
  const { accessToken } = useAuthStore.getState();
  const socketUrl = import.meta.env.VITE_SOCKET_URL || (import.meta.env.PROD ? window.location.origin : 'http://localhost:5000');
  if (!socket) {
    socket = io(socketUrl, {
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
