import app from './app';
import { config } from './config/env';
import { logger } from './config/logger';
import { prisma } from './database/client';
import { redisClient } from './config/redis';

const PORT = config.port;

const server = app.listen(PORT, () => {
  logger.info(`=================================================`);
  logger.info(`🚀 PORTFOLIO SAAS BACKEND RUNNING ON PORT ${PORT}`);
  logger.info(`🌐 Platform Domain: ${config.platformDomain}`);
  logger.info(`📚 Swagger Documentation: http://localhost:${PORT}/api-docs`);
  logger.info(`🏥 Health Check: http://localhost:${PORT}/api/health`);
  logger.info(`=================================================`);
});

process.on('unhandledRejection', (reason: any) => {
  logger.error('Unhandled Rejection:', reason);
});

process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

const shutdown = async (signal: string) => {
  logger.info(`${signal} received. Draining HTTP connections.`);
  server.close(async () => {
    try {
      await redisClient?.quit();
      await prisma.$disconnect();
      logger.info('Shutdown complete.');
      process.exit(0);
    } catch (error) {
      logger.error('Error while shutting down:', error);
      process.exit(1);
    }
  });

  // Railway eventually sends SIGKILL; do not leave a deployment draining forever.
  setTimeout(() => process.exit(1), 25_000).unref();
};

process.once('SIGTERM', () => void shutdown('SIGTERM'));
process.once('SIGINT', () => void shutdown('SIGINT'));
