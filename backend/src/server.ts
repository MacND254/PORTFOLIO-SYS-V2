import app from './app';
import { config } from './config/env';
import { logger } from './config/logger';

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
