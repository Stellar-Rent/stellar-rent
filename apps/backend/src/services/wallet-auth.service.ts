import { Networks, StrKey, Transaction } from '@stellar/stellar-sdk';
import jwt from 'jsonwebtoken';
import { supabase } from '../config/supabase';
import type { WalletAuthResponse, WalletLoginRequest } from '../types/wallet-auth.types';
import { getValidChallenge, removeChallenge } from './wallet-challenge.service';

//===================
// Verify the signed transaction contains the correct challenge and is signed by the correct key
//===================
async function verifySignedTransaction(
  publicKey: string,
  challenge: string,
  signedTransactionXDR: string
): Promise<boolean> {
  try {
    const transaction = new Transaction(
      signedTransactionXDR,
      process.env.NODE_ENV === 'production' ? Networks.TESTNET : Networks.PUBLIC
    );
    if (transaction.signatures.length === 0) {
      return false;
    }
    const memo = transaction.memo;
    if (!memo || memo.type !== 'text') {
      return false;
    }

    let memoValue: string;
    if (Buffer.isBuffer(memo.value)) {
      memoValue = memo.value.toString('utf8');
    } else {
      memoValue = memo.value as string;
    }

    if (memoValue !== challenge) {
      return false;
    }
    const transactionHash = transaction.hash();
    const signature = transaction.signatures[0];

    const { Keypair } = await import('@stellar/stellar-sdk');
    const keypair = Keypair.fromPublicKey(publicKey);

    const isValid = keypair.verify(transactionHash, signature.signature());

    if (!isValid) {
    } else {
    }

    return isValid;
  } catch (error) {
    return false;
  }
}

//===================
// Get or create wallet user
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
    throw new Error('Failed to create wallet user');
  }

  const { error: profileError } = await supabase.from('profiles').insert({
    user_id: newUser.id,
    name: 'Wallet User',
    verification_status: 'unverified',
    last_active: new Date().toISOString(),
  });

  if (profileError) {
  }

  return newUser;
}

//===================
// Get user profile
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
// Generate JWT token
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
// Verify wallet signature and authenticate user
//===================
export async function authenticateWallet(input: WalletLoginRequest): Promise<WalletAuthResponse> {
  const { publicKey, signedTransaction, challenge } = input;
  if (!StrKey.isValidEd25519PublicKey(publicKey)) {
    throw new Error('Invalid public key format');
  }

  const storedChallenge = await getValidChallenge(publicKey, challenge);
  if (!storedChallenge) {
    throw new Error('Invalid or expired challenge');
  }

  const isValidTransaction = await verifySignedTransaction(publicKey, challenge, signedTransaction);
  if (!isValidTransaction) {
    throw new Error('Invalid signed transaction');
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
