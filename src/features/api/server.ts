import express from 'express';
import cors from 'cors';
import path from 'path';
import { config, logger } from '../../config';
import { graphRouter } from './routes';
import { K8sCollector } from '../kubernetes/K8sCollector';

export function startServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());

  // Serve static files from 'public' directory
  app.use(express.static(path.join(process.cwd(), 'public')));

  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', environment: config.env });
  });

  // API Routes
  app.use('/api', graphRouter);

  // Background polling for K8s data
  const k8sCollector = new K8sCollector();
  
  // Initial collection
  k8sCollector.collectAll().catch((err) => {
    logger.error({ err }, 'Initial K8s collection failed');
  });

  // Schedule collection
  const pollTimer = setInterval(() => {
    logger.debug('Running scheduled K8s collection...');
    k8sCollector.collectAll();
  }, config.pollInterval);

  // Start the server
  const server = app.listen(config.port, () => {
    logger.info(`Web server listening on port ${config.port}`);
  });

  return { server, pollTimer };
}
