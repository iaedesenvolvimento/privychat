import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

const renderWildcard = 'https://*.onrender.com';
const allowedOrigins = [env.clientUrl, env.publicApiUrl, env.publicSocketUrl].filter(Boolean);
const isRenderOrigin = (origin = '') => /^https:\/\/[a-z0-9-]+\.onrender\.com$/i.test(origin);

export const corsMiddleware = cors({
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    if (env.nodeEnv === 'production') return callback(null, true);
    if (allowedOrigins.includes(origin) || isRenderOrigin(origin)) return callback(null, true);
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204
});

export const helmetMiddleware = helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: ["'self'", renderWildcard, ...allowedOrigins, 'ws:', 'wss:'],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
      imgSrc: ["'self'", 'data:', 'blob:', renderWildcard, ...allowedOrigins],
      mediaSrc: ["'self'", 'data:', 'blob:', renderWildcard, ...allowedOrigins],
      manifestSrc: ["'self'"],
      workerSrc: ["'self'", 'blob:']
    }
  }
});

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: env.rateLimit.apiMax,
  skip: () => env.nodeEnv !== 'production',
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Muitas requisicoes. Aguarde alguns minutos e tente novamente.' }
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: env.rateLimit.authMax,
  skip: () => env.nodeEnv !== 'production',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: env.nodeEnv !== 'production',
  message: { message: 'Muitas tentativas de autenticacao. Aguarde alguns minutos ou reinicie o backend em desenvolvimento.' }
});
