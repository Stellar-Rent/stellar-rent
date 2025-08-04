import { Router } from 'express';
import type { NextFunction, Request, Response } from 'express';
import { syncController } from '../controllers/sync.controller';

const router = Router();

// Middleware to check if user is admin (you may want to implement proper auth middleware)
const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  // TODO: Implement proper admin authentication
  // For now, we'll allow all requests (you should implement proper auth)
  next();
};

// Sync service management
router.post('/start', requireAdmin, syncController.startSync.bind(syncController));
router.post('/stop', requireAdmin, syncController.stopSync.bind(syncController));
router.get('/status', requireAdmin, syncController.getStatus.bind(syncController));
router.post('/trigger', requireAdmin, syncController.triggerManualSync.bind(syncController));

// Sync data management
router.get('/events', requireAdmin, syncController.getSyncEvents.bind(syncController));
router.get('/logs', requireAdmin, syncController.getSyncLogs.bind(syncController));
router.get('/dashboard', requireAdmin, syncController.getDashboard.bind(syncController));

// Sync operations
router.post('/retry-failed', requireAdmin, syncController.retryFailedEvents.bind(syncController));
router.delete('/clear-old', requireAdmin, syncController.clearOldData.bind(syncController));

export default router;
