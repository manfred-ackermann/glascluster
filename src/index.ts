import { config, logger } from './config';
import { startServer } from './features/api/server';

async function bootstrap() {
  try {
    logger.info(`Starting GlasCluster application in ${config.env} mode...`);

    const { server, pollTimer } = startServer();

    // Setup graceful shutdown
    const gracefulShutdown = () => {
      logger.info('Received shutdown signal, tearing down gracefully...');
      
      clearInterval(pollTimer);
      server.close(() => {
        logger.info('HTTP server closed.');
        process.exit(0);
      });
      
      // Force exit after 10s if not closed
      setTimeout(() => {
        logger.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGINT', gracefulShutdown);
    process.on('SIGTERM', gracefulShutdown);

  } catch (error) {
    logger.error({ err: error }, 'Failed to start application');
    process.exit(1);
  }
}

bootstrap();
