import { Router } from 'express';
import { login, register } from '../controllers/auth.controller';
import { validateLogin, validateRegister } from '../validators/auth.validator';

const authRouter = Router();

authRouter.post('/login', validateLogin, login);
authRouter.post('/register', validateRegister, register);

export default authRouter;
