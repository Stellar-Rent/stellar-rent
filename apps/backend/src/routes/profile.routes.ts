import { Router } from 'express';
import {
  deleteAccount,
  getProfile,
  updateProfile,
  uploadAvatar,
} from '../controllers/profile.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { upload } from '../middleware/multer';

const profileRouter = Router();

profileRouter.get('/', authenticateToken, getProfile);
profileRouter.patch('/', authenticateToken, updateProfile);
profileRouter.delete('/', authenticateToken, deleteAccount);
profileRouter.post('/avatar', authenticateToken, upload.single('avatar'), uploadAvatar);

export default profileRouter;
