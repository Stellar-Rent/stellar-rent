import type { Request } from 'express';
import { supabase } from '../config/supabase';
import type { UserProfileUpdate } from '../types/userProfile';

export const getUserProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) return { error };
  if (!data) return { error: new Error('User profile not found') };

  return { profile: data };
};

export const updateUserProfile = async (userId: string, updates: UserProfileUpdate) => {
  const { data, error } = await supabase
    .from('profiles')
    .update({ ...updates, last_active: new Date().toISOString() })
    .eq('user_id', userId)
    .select('*')
    .maybeSingle();

  if (error) return { error };
  return data;
};

export const deleteUserAccount = async (userId: string) => {
  const { error } = await supabase.from('profiles').delete().eq('user_id', userId);
  return error ? { error } : { success: true };
};

export const uploadUserAvatar = async (userId: string, req: Request) => {
  if (!req.file) {
    return { error: new Error('No file uploaded') };
  }

  const file = req.file;
  const filePath = `avatars/${userId}/${Date.now()}_${file.originalname}`;

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, file.buffer, {
      contentType: file.mimetype,
    });

  if (uploadError) return { error: uploadError };

  const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
  const publicUrl = data?.publicUrl;

  if (!publicUrl) return { error: new Error('Failed to generate public URL') };

  const { error: updateError } = await supabase.from('profiles')
    .update({ avatar_url: publicUrl })
    .eq('user_id', userId);

  if (updateError) return { error: updateError };

  return { avatar_url: publicUrl };
};
