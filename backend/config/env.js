import dotenv from 'dotenv';

dotenv.config();

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 5000),
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'privychat'
  },
  jwtSecret: process.env.JWT_SECRET || 'dev-access-secret',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  rateLimit: {
    apiMax: Number(process.env.RATE_LIMIT_API_MAX || 240),
    authMax: Number(process.env.RATE_LIMIT_AUTH_MAX || (process.env.NODE_ENV === 'production' ? 30 : 300))
  },
  messageSecret: process.env.MESSAGE_SECRET || 'dev-message-secret-that-is-long-enough',
  googleClientId: process.env.GOOGLE_CLIENT_ID || ''
};
