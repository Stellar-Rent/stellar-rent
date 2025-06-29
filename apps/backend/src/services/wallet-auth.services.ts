import { Keypair, StrKey } from '@stellar/stellar-sdk';
import jwt from 'jsonwebtoken';
import { supabase } from '../config/supabase';
import type { WalletAuthResponse, WalletLoginRequest } from '../types/wallet-auth.types';
import { getValidChallenge, removeChallenge } from './wallet-challenge.service';

//===================
//Verify the signature using Stellar SDK
//===================
async function verifySignature(
  publicKey: string,
  challenge: string,
  signature: string
): Promise<boolean> {
  try {
    const keypair = Keypair.fromPublicKey(publicKey);

    const challengeBuffer = Buffer.from(challenge, 'utf8');

    const signatureBuffer = Buffer.from(signature, 'base64');

    return keypair.verify(challengeBuffer, signatureBuffer);
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

//===================
//Get or create wallet user
//===================
async function getOrCreateWalletUser(publicKey: string) {
  const { data: existingUser, error: fetchError } = await supabase
    .from('wallet_users')
    .select('*')
    .eq('public_key', publicKey)
    .single();

  if (existingUser && !fetchError) {
    await supabase
      .from('wallet_users')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', existingUser.id);

    return existingUser;
  }

  const { data: newUser, error: createError } = await supabase
    .from('wallet_users')
    .insert({
      public_key: publicKey,
    })
    .select()
    .single();

  if (createError || !newUser) {
    console.error('Error creating wallet user:', createError);
    throw new Error('Failed to create wallet user');
  }

  await supabase.from('profiles').insert({
    user_id: newUser.id,
    verification_status: 'unverified',
    last_active: new Date().toISOString(),
  });

  return newUser;
}

//===================
//Get user profile
//===================
async function getUserProfile(userId: string) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  return profile || undefined;
}

//===================
//Generate JWT token
//===================
function generateJWT(userId: string, publicKey: string): string {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is required');
  }

  return jwt.sign(
    {
      userId,
      publicKey,
      type: 'wallet',
    },
    process.env.JWT_SECRET,
    {
      expiresIn: '7d',
    }
  );
}

//===================
//Verify wallet signature and authenticate user
//===================
export async function authenticateWallet(input: WalletLoginRequest): Promise<WalletAuthResponse> {
  const { publicKey, signature, challenge } = input;

  if (!StrKey.isValidEd25519PublicKey(publicKey)) {
    throw new Error('Invalid public key format');
  }
  const storedChallenge = await getValidChallenge(publicKey, challenge);
  if (!storedChallenge) {
    throw new Error('Invalid or expired challenge');
  }
  const isValidSignature = await verifySignature(publicKey, challenge, signature);
  if (!isValidSignature) {
    throw new Error('Invalid signature');
  }
  await removeChallenge(storedChallenge.id);
  const walletUser = await getOrCreateWalletUser(publicKey);
  const token = generateJWT(walletUser.id, publicKey);
  const profile = await getUserProfile(walletUser.id);

  return {
    token,
    user: {
      id: walletUser.id,
      publicKey,
      profile,
    },
  };
}
