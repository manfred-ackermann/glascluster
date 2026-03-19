import { Router, Request, Response } from 'express';
import { graphStore } from '../graph/GraphStore';
import { K8sCollector } from '../kubernetes/K8sCollector';
import { logger } from '../../config';

export const graphRouter = Router();

/**
 * @route GET /api/graph
 * @desc Get the entire graph payload of K8s clusters
 */
graphRouter.get('/graph', (req: Request, res: Response) => {
  try {
    const data = graphStore.getGraph();
    res.json(data);
  } catch (error) {
    logger.error({ err: error }, 'Failed to fetch graph data');
    res.status(500).json({ error: 'Failed to fetch graph data' });
  }
});

/**
 * @route POST /api/graph/refresh
 * @desc Force an immediate refresh of Kubernetes data
 */
graphRouter.post('/graph/refresh', async (req: Request, res: Response) => {
  try {
    const collector = new K8sCollector();
    await collector.collectAll();
    res.json({ message: 'Graph data successfully refreshed' });
  } catch (error) {
    logger.error({ err: error }, 'Failed to refresh K8s data');
    res.status(500).json({ error: 'Failed to refresh K8s data' });
  }
});
