import type { Request, Response } from 'express';
import {
  deleteUserAccount,
  getUserProfile,
  updateUserProfile,
  uploadUserAvatar,
} from '../services/profile.service';
import { updateProfileSchema } from '../validators/profile.validators';

export const getProfile = async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Usuario no autenticado' });

  const result = await getUserProfile(req.user.id);
  if (result.error) return res.status(400).json({ error: result.error.message });

  res.json(result.profile);
};

export const updateProfile = async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Usuario no autenticado' });

  const parse = updateProfileSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: parse.error.format() });
  }

  const result = await updateUserProfile(req.user.id, parse.data);
  if (result.error) return res.status(400).json({ error: result.error.message });

  res.json(result.data || { message: 'Perfil actualizado correctamente' });
};

export const deleteAccount = async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Usuario no autenticado' });

  const result = await deleteUserAccount(req.user.id);
  if (result.error) return res.status(400).json({ error: result.error.message });

  res.json({ message: 'Cuenta eliminada' });
};

export const uploadAvatar = async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Usuario no autenticado' });

  const result = await uploadUserAvatar(req.user.id, req);
  if (result.error) return res.status(400).json({ error: result.error.message });

  res.json({ avatar_url: result.avatar_url });
};
