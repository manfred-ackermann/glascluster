import dotenv from 'dotenv';
import pino from 'pino';

// Load environment variables
dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  // Poll interval in milliseconds (default 30 seconds)
  pollInterval: parseInt(process.env.POLL_INTERVAL_MS || '30000', 10),
};

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport:
    config.env !== 'production'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
          },
        }
      : undefined,
});
