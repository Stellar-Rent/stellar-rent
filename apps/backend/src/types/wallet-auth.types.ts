import { z } from 'zod';

//===================
// Challenge request schema
//===================
export const challengeRequestSchema = z.object({
  publicKey: z.string().min(1, 'Public key is required'),
});

//===================
// Wallet login schema
//===================
export const walletLoginSchema = z.object({
  publicKey: z.string().min(1, 'Public key is required'),
  signature: z.string().min(1, 'Signature is required'),
  challenge: z.string().min(1, 'Challenge is required'),
});

//===================
// Types
//===================
export type ChallengeRequest = z.infer<typeof challengeRequestSchema>;
export type WalletLoginRequest = z.infer<typeof walletLoginSchema>;

export interface Challenge {
  id: string;
  public_key: string;
  challenge: string;
  expires_at: string;
  created_at: string;
}

export interface UserProfile {
  id?: string;
  user_id?: string;
  name?: string;
  avatar_url?: string;
  phone?: string;
  address?: string;
  preferences?: Record<string, unknown>;
  social_links?: Record<string, unknown>;
  verification_status: 'verified' | 'unverified' | 'pending';
  last_active: string;
  created_at?: string;
  updated_at?: string;
}

export interface WalletUser {
  id: string;
  public_key: string;
  created_at: string;
  updated_at: string;
}

export interface WalletAuthResponse {
  token: string;
  user: {
    id: string;
    publicKey: string;
    profile?: UserProfile;
  };
}

export interface ChallengeResponse {
  challenge: string;
  expiresAt: string;
}
