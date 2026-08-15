import Redis from 'ioredis';
import { config } from './env';
import { logger } from './logger';

export let redisClient: Redis | null = null;
let isRedisConnected = false;

try {
  redisClient = new Redis(config.redisUrl, {
    maxRetriesPerRequest: 1,
    retryStrategy(times) {
      if (times > 3) {
        logger.warn('Redis connection retry limit reached. Continuing without Redis cache/rate-limiting.');
        return null; // Stop retrying
      }
      return Math.min(times * 100, 2000);
    },
    lazyConnect: true,
  });

  redisClient.connect().then(() => {
    isRedisConnected = true;
    logger.info('Connected to Redis successfully.');
  }).catch((err) => {
    logger.warn(`Redis connection failed: ${err.message}. Operating in fallback mode.`);
    redisClient = null;
  });

  redisClient.on('error', (err) => {
    if (isRedisConnected) {
      logger.warn(`Redis error: ${err.message}`);
    }
    isRedisConnected = false;
  });
} catch (error: any) {
  logger.warn(`Failed to initialize Redis client: ${error.message}`);
  redisClient = null;
}

export const getRedisStatus = async (): Promise<boolean> => {
  if (!redisClient) return false;
  try {
    const ping = await redisClient.ping();
    return ping === 'PONG';
  } catch {
    return false;
  }
};
