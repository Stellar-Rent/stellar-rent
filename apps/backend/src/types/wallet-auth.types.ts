import { z } from 'zod';

// Challenge request schema
export const challengeRequestSchema = z.object({
  publicKey: z.string().min(1, 'Public key is required'),
});

// Wallet login schema
export const walletLoginSchema = z.object({
  publicKey: z.string().min(1, 'Public key is required'),
  signedTransaction: z.string().min(1, 'Signed transaction is required'),
  challenge: z.string().min(1, 'Challenge is required'),
});

// Types
export type ChallengeRequest = z.infer<typeof challengeRequestSchema>;
export type WalletLoginRequest = z.infer<typeof walletLoginSchema>;

export interface Challenge {
  id: string;
  public_key: string;
  challenge: string;
  expires_at: string;
  created_at: string;
}

export interface WalletAuthResponse {
  token: string;
  user: {
    id: string;
    publicKey: string;
    profile?: {
      name?: string;
      avatar_url?: string;
      phone?: string;
      address?: string;
      preferences?: Record<string, null>;
      social_links?: Record<string, null>;
      verification_status: string;
      last_active: string;
    };
  };
}

export interface ChallengeResponse {
  challenge: string;
  expiresAt: string;
}
