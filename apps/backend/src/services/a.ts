import type { UserProfileUpdate } from '../types/userProfile';

export const updateUserProfile = async (userId: string, updates: UserProfileUpdate) => {
  const { data, error } = await supabase
    .from('profiles')
    .update({ ...updates, last_active: new Date().toISOString() })
    .eq('user_id', userId)
    .single();

  return error ? { error } : { profile: data };
};
