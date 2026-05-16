import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { query } from '../config/db.js';

const online = new Map();
const forcedOffline = new Set();

function addOnline(userId, socketId) {
  const sockets = online.get(userId) || new Set();
  sockets.add(socketId);
  online.set(userId, sockets);
}

function removeOnline(userId, socketId) {
  const sockets = online.get(userId);
  if (!sockets) return false;
  sockets.delete(socketId);
  if (sockets.size === 0) {
    online.delete(userId);
    return true;
  }
  return false;
}

export function registerChatSocket(io) {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      const payload = jwt.verify(token, env.jwtSecret);
      socket.userId = payload.sub;
      next();
    } catch {
      next(new Error('Unauthorized'));
    }
  });

  io.on('connection', async (socket) => {
    socket.join(`user:${socket.userId}`);
    addOnline(socket.userId, socket.id);
    if (!forcedOffline.has(socket.userId)) {
      await query('UPDATE users SET is_online = TRUE WHERE id = :id', { id: socket.userId });
    }
    io.emit('presence:update', Array.from(online.keys()).filter((userId) => !forcedOffline.has(userId)));

    const rooms = await query('SELECT conversation_id FROM conversation_participants WHERE user_id = :id', { id: socket.userId });
    rooms.forEach((room) => socket.join(room.conversation_id));

    socket.on('presence:request', () => {
      socket.emit('presence:update', Array.from(online.keys()).filter((userId) => !forcedOffline.has(userId)));
    });

    socket.on('presence:set', async ({ online: wantsOnline }) => {
      if (wantsOnline) {
        forcedOffline.delete(socket.userId);
        await query('UPDATE users SET is_online = TRUE WHERE id = :id', { id: socket.userId });
      } else {
        forcedOffline.add(socket.userId);
        await query('UPDATE users SET is_online = FALSE, last_seen = NOW() WHERE id = :id', { id: socket.userId });
      }
      io.emit('presence:update', Array.from(online.keys()).filter((userId) => !forcedOffline.has(userId)));
    });

    socket.on('conversation:join', async (conversationId) => {
      const allowed = await query('SELECT conversation_id FROM conversation_participants WHERE conversation_id = :conversationId AND user_id = :userId', {
        conversationId,
        userId: socket.userId
      });
      if (allowed.length) socket.join(conversationId);
    });

    socket.on('message:send', async (message) => {
      const participants = await query('SELECT user_id FROM conversation_participants WHERE conversation_id = :conversationId', {
        conversationId: message.conversationId
      });
      participants
        .filter((participant) => participant.user_id !== socket.userId)
        .forEach((participant) => io.to(`user:${participant.user_id}`).emit('message:new', message));
      socket.emit('message:delivered', { id: message.id });
    });

    socket.on('messages:read', async ({ conversationId }) => {
      const allowed = await query('SELECT conversation_id FROM conversation_participants WHERE conversation_id = :conversationId AND user_id = :userId', {
        conversationId,
        userId: socket.userId
      });
      if (!allowed.length) return;
      await query('UPDATE messages SET read_at = COALESCE(read_at, NOW()) WHERE conversation_id = :conversationId AND sender_id <> :userId', {
        conversationId,
        userId: socket.userId
      });
      await query('UPDATE conversation_participants SET unread_count = 0 WHERE conversation_id = :conversationId AND user_id = :userId', {
        conversationId,
        userId: socket.userId
      });
      socket.to(conversationId).emit('messages:read', { conversationId, readerId: socket.userId });
    });

    socket.on('typing:update', ({ conversationId, isTyping }) => {
      socket.to(conversationId).emit('typing:update', { conversationId, userId: socket.userId, isTyping });
    });

    socket.on('disconnect', async () => {
      const wentOffline = removeOnline(socket.userId, socket.id);
      if (wentOffline) {
        forcedOffline.delete(socket.userId);
        await query('UPDATE users SET is_online = FALSE, last_seen = NOW() WHERE id = :id', { id: socket.userId });
      }
      io.emit('presence:update', Array.from(online.keys()).filter((userId) => !forcedOffline.has(userId)));
    });
  });
}
