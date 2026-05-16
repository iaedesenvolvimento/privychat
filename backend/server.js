import express from 'express';
import cookieParser from 'cookie-parser';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import conversationRoutes from './routes/conversationRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import { initDb } from './config/initDb.js';
import { query } from './config/db.js';
import { env } from './config/env.js';
import { apiLimiter, corsMiddleware, helmetMiddleware } from './middlewares/security.js';
import { registerChatSocket } from './sockets/chatSocket.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: env.clientUrl,
    credentials: true
  }
});
app.set('io', io);

app.use(helmetMiddleware);
app.use(corsMiddleware);
app.use(apiLimiter);
app.use(express.json({ limit: '15mb' }));
app.use(cookieParser());
const uploadDir = path.isAbsolute(process.env.UPLOAD_DIR || '') ? process.env.UPLOAD_DIR : path.join(process.cwd(), process.env.UPLOAD_DIR || 'uploads');
app.use('/uploads', express.static(uploadDir));

app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'PrivyChat API' }));
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/messages', messageRoutes);

const frontendDist = path.resolve(__dirname, '..', 'frontend', 'dist');
app.use(express.static(frontendDist));
app.use((req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) return next();
  res.sendFile(path.join(frontendDist, 'index.html'));
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: 'Erro interno.' });
});

await initDb();
await query('UPDATE users SET is_online = FALSE');
registerChatSocket(io);

httpServer.listen(env.port, () => {
  console.log(`PrivyChat API listening on http://localhost:${env.port}`);
});
