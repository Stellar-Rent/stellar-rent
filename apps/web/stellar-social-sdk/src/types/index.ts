export interface SocialAuthConfig {
  contractId: string;
  network: 'testnet' | 'mainnet';
  horizonUrl?: string;
  googleClientId?: string;
  facebookAppId?: string;
}

export interface AuthMethod {
  type: 'google' | 'facebook' | 'phone' | 'passkey' | 'freighter';
  identifier: string;
  token?: string;
  metadata?: Record<string, any>;
}

export interface SocialAccountData {
  publicKey: string;
  authMethods: AuthMethod[];
  createdAt: number;
  recoveryContacts: string[];
}

export interface AuthResult {
  success: boolean;
  account?: any; // We'll import StellarSocialAccount in index.ts to avoid circular dependency
  error?: string;
}

export interface PhoneVerification {
  phoneNumber: string;
  verificationCode: string;
}

// Freighter wallet interface
declare global {
  interface Window {
    freighter?: {
      requestAccess(): Promise<{ publicKey: string }>;
      signTransaction(txn: string, network: string): Promise<{ signedTxn: string }>;
      getNetwork(): Promise<{ network: string; networkPassphrase: string }>;
    };
  }
}
