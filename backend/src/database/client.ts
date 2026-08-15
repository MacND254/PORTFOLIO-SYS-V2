import { PrismaClient } from '@prisma/client';
import { logger } from '../config/logger';

export const prisma = new PrismaClient({
  log: [
    { emit: 'event', level: 'query' },
    { emit: 'stdout', level: 'error' },
    { emit: 'stdout', level: 'info' },
    { emit: 'stdout', level: 'warn' },
  ],
});

// Optionally log queries in dev mode if needed
prisma.$on('query' as any, (e: any) => {
  if (process.env.DEBUG_QUERIES === 'true') {
    logger.debug(`Query: ${e.query} -- Params: ${e.params} -- Duration: ${e.duration}ms`);
  }
});
