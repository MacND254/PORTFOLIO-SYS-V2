import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config(); // Fallback to current directory .env

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  platformDomain: process.env.PLATFORM_DOMAIN || 'localhost',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000,http://localhost:5000',
  backendUrl: BACKEND_URL,
  frontendUrl: FRONTEND_URL,
  databaseUrl: process.env.DATABASE_URL,
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  jwtSecret: process.env.JWT_SECRET || 'super_secret_jwt_key_minimum_32_characters_long_for_security!',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'super_secret_jwt_refresh_key_minimum_32_characters!',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  sessionSecret: process.env.SESSION_SECRET || 'portfolio_session_secret_key_2024!',
  storageProvider: process.env.STORAGE_PROVIDER || 'local',
  storagePath: path.resolve(process.cwd(), process.env.STORAGE_PATH || './uploads'),
  maxCvSize: parseInt(process.env.MAX_CV_SIZE || '10485760', 10),
  aiProvider: process.env.AI_PROVIDER || 'mock',
  aiApiKey: process.env.AI_API_KEY || '',
  oauth: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      callbackUrl: `${BACKEND_URL}/api/auth/google/callback`,
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID || '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
      callbackUrl: `${BACKEND_URL}/api/auth/github/callback`,
    },
  },
  superAdmin: {
    name: process.env.SUPER_ADMIN_NAME || 'System Super Administrator',
    email: process.env.SUPER_ADMIN_EMAIL || 'superadmin@myportfolio.com',
    password: process.env.SUPER_ADMIN_PASSWORD || 'ChangeMe@12345',
  },
  testAdmin: {
    name: process.env.TEST_ADMIN_NAME || 'Francis Mwangi',
    email: process.env.TEST_ADMIN_EMAIL || 'francis@example.com',
    password: process.env.TEST_ADMIN_PASSWORD || 'ChangeMe@12345',
    subdomain: process.env.TEST_ADMIN_SUBDOMAIN || 'francis',
    profession: process.env.TEST_ADMIN_PROFESSION || 'Software Engineer',
  }
};
