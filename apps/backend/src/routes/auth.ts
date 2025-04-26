import { Router } from 'express';
import { login, register } from '../controllers/authController';

const router = Router();

router.post('/login', login);
router.post('/register', register);

export default router;
