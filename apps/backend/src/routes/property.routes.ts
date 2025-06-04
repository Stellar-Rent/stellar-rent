import { Router } from 'express';
import { getPropertyById } from '../controllers/property.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.get('/:id', authenticateToken, getPropertyById);

export default router;
