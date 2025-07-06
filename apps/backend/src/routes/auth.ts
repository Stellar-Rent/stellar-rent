import { Router } from 'express';
import { login, register } from '../controllers/authController';
import { authLimit } from '../middleware/rateLimiter';
import { validateLogin, validateRegister } from '../validators/auth.validator';

const router = Router();

router.post('/login', authLimit, validateLogin, login);
router.post('/register', authLimit, validateRegister, register);

export default router;
