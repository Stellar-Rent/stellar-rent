import { Networks, StrKey, Transaction } from '@stellar/stellar-sdk';
import jwt from 'jsonwebtoken';
import { supabase } from '../config/supabase';
import type { WalletAuthResponse, WalletLoginRequest } from '../types/wallet-auth.types';
import {
  InvalidChallengeError,
  InvalidPublicKeyError,
  SignatureVerificationError,
} from '../types/wallet-error-types';
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
      process.env.NODE_ENV === 'production' ? Networks.PUBLIC : Networks.TESTNET
    );
    if (transaction.signatures.length === 0) {
      console.error('No signatures found in transaction');
      return false;
    }
    const sourceAccount = transaction.source;
    if (sourceAccount !== publicKey) {
      console.error('Transaction source account mismatch');
      return false;
    }
    // Verify the transaction memo contains our challenge
    const memo = transaction.memo;
    if (!memo || memo.type !== 'text') {
      console.error('Invalid memo type:', memo?.type);
      return false;
    }

    let memoValue: string;
    if (Buffer.isBuffer(memo.value)) {
      memoValue = memo.value.toString('utf8');
    } else {
      memoValue = memo.value as string;
    }

    if (memoValue !== challenge) {
      console.error('Memo mismatch!');
      console.error('   Expected:', challenge);
      return false;
    }
    const transactionHash = transaction.hash();
    const signature = transaction.signatures[0];

    const { Keypair } = await import('@stellar/stellar-sdk');
    const keypair = Keypair.fromPublicKey(publicKey);

    // Verify the signature
    const isValid = keypair.verify(transactionHash, signature.signature());

    if (!isValid) {
      console.error('Signature verification failed');
    } else {
      console.log('Signature verification successful');
    }

    return isValid;
  } catch (error) {
    console.error('Transaction verification error:', error);
    return false;
  }
}

//===================
// Get or create wallet user
//===================
async function getOrCreateWalletUser(publicKey: string) {
  console.log('Getting or creating wallet user for:', `${publicKey.substring(0, 10)}...`);

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

  console.log('New user created:', newUser.id);

  const { error: profileError } = await supabase.from('profiles').insert({
    user_id: newUser.id,
    name: 'Wallet User',
    verification_status: 'unverified',
    last_active: new Date().toISOString(),
  });

  if (profileError) {
    console.error('Warning: Failed to create profile:', profileError.message || profileError);
  } else {
    console.log('Profile created for user');
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
  const userKey = `${publicKey.substring(0, 10)}...`;

  console.log(`Starting wallet authentication for ${userKey}`);
  console.log(`Challenge: ${challenge}`);

  if (!StrKey.isValidEd25519PublicKey(publicKey)) {
    console.error(`Invalid public key format for ${userKey}`);
    throw new InvalidPublicKeyError('Invalid public key format');
  }
  console.log(`Public key format is valid for ${userKey}`);

  console.log(`Validating challenge for ${userKey}...`);
  const storedChallenge = await getValidChallenge(publicKey, challenge);
  if (!storedChallenge) {
    console.error(`Invalid or expired challenge for ${userKey}`);
    throw new InvalidChallengeError('Invalid or expired challenge');
  }
  console.log(`Challenge is valid for ${userKey}`);
  console.log(`Verifying signed transaction for ${userKey}...`);
  const isValidTransaction = await verifySignedTransaction(publicKey, challenge, signedTransaction);
  if (!isValidTransaction) {
    console.error(`Transaction verification failed for ${userKey}`);
    throw new SignatureVerificationError('Invalid signed transaction');
  }
  console.log(`Transaction verification successful for ${userKey}`);

  console.log(`Removing used challenge for ${userKey}...`);
  await removeChallenge(storedChallenge.id);

  console.log(`Getting or creating wallet user for ${userKey}...`);
  const walletUser = await getOrCreateWalletUser(publicKey);

  console.log(`Generating JWT token for ${userKey}...`);
  const token = generateJWT(walletUser.id, publicKey);

  const profile = await getUserProfile(walletUser.id);
  console.log(`Wallet authentication completed successfully for ${userKey}!`);
  return {
    token,
    user: {
      id: walletUser.id,
      publicKey,
      profile,
    },
  };
}
