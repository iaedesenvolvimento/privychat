import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

export const corsMiddleware = cors({
  origin: env.clientUrl,
  credentials: true
});

export const helmetMiddleware = helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
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
