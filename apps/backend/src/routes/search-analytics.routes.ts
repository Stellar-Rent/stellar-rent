import { Router } from 'express';
import {
  analyticsHealthCheck,
  getSearchMetrics,
  getSearchSuggestions,
} from '../controllers/search-analytics.controller';
import { authenticateToken } from '../validators/property.validator';

const router = Router();

router.get('/suggestions', getSearchSuggestions);
router.get('/health', analyticsHealthCheck);
router.get('/metrics', authenticateToken, getSearchMetrics);

export default router;
