import { randomBytes } from 'node:crypto';
import { supabase } from '../config/supabase';
import type { Challenge, ChallengeResponse } from '../types/wallet-auth.types';

//===================
// Generate a unique challenge for a given public key
//===================
export async function generateChallenge(publicKey: string): Promise<ChallengeResponse> {
  const CHALLENGE_EXPIRY_MINUTES = 5;

  // Check if there's already a valid challenge for this public key
  const { data: existingChallenge, error: fetchError } = await supabase
    .from('wallet_challenges')
    .select('*')
    .eq('public_key', publicKey)
    .gt('expires_at', new Date().toISOString())
    .single();

  if (existingChallenge && !fetchError) {
    console.log(`Reusing existing challenge for ${publicKey.substring(0, 10)}...`);
    return {
      challenge: existingChallenge.challenge,
      expiresAt: existingChallenge.expires_at,
    };
  }

  const challenge = randomBytes(12).toString('hex');
  const expiresAt = new Date(Date.now() + CHALLENGE_EXPIRY_MINUTES * 60 * 1000);

  await cleanupExpiredChallenges(publicKey);

  const { error } = await supabase.from('wallet_challenges').insert({
    public_key: publicKey,
    challenge,
    expires_at: expiresAt.toISOString(),
  });

  if (error) {
    console.error('Error storing challenge:', error);
    throw new Error('Failed to generate challenge');
  }

  console.log(`Generated new challenge for ${publicKey.substring(0, 10)}...`);
  return {
    challenge,
    expiresAt: expiresAt.toISOString(),
  };
}

//===================
// Retrieve and validate a challenge for a given public key
//===================
export async function getValidChallenge(
  publicKey: string,
  challengeValue: string
): Promise<Challenge | null> {
  const { data, error } = await supabase
    .from('wallet_challenges')
    .select('*')
    .eq('public_key', publicKey)
    .eq('challenge', challengeValue)
    .gt('expires_at', new Date().toISOString())
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

//===================
// Remove a used challenge
//===================
export async function removeChallenge(challengeId: string): Promise<void> {
  const { error } = await supabase.from('wallet_challenges').delete().eq('id', challengeId);

  if (error) {
    console.error('Error removing challenge:', error);
  }
}

//===================
// Clean up expired challenges for a public key
//===================
async function cleanupExpiredChallenges(publicKey?: string): Promise<void> {
  let query = supabase
    .from('wallet_challenges')
    .delete()
    .lt('expires_at', new Date().toISOString());

  if (publicKey) {
    query = query.eq('public_key', publicKey);
  }

  const { error } = await query;

  if (error) {
    console.error('Error cleaning up expired challenges:', error);
  }
}

//===================
// Periodic cleanup of all expired challenges
//===================
// export async function cleanupAllExpiredChallenges(): Promise<void> {
//   await cleanupExpiredChallenges();
// }
export async function cleanupAllExpiredChallenges(): Promise<void> {
  try {
    const { data: expiredChallenges, error: fetchError } = await supabase
      .from('wallet_challenges')
      .select('id')
      .lt('expires_at', new Date().toISOString());

    if (fetchError) {
      console.error('Error fetching expired challenges:', fetchError);
      return;
    }

    if (!expiredChallenges || expiredChallenges.length === 0) {
      console.log('No expired challenges to cleanup');
      return;
    }

    const { error: deleteError } = await supabase
      .from('wallet_challenges')
      .delete()
      .lt('expires_at', new Date().toISOString());

    if (deleteError) {
      console.error('Error cleaning up expired challenges:', deleteError);
    } else {
      console.log(`🗑️ Cleaned up ${expiredChallenges.length} expired challenges`);
    }
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
}
