// Tipos para el sistema de autenticación con Stellar Social SDK

export interface CredentialResponse {
  credential: string;
  select_by?: string;
  clientId?: string;
}

export interface BalanceInfo {
  asset: string;
  balance: string;
}

export interface SocialUser {
  publicKey: string;
  name?: string;
  email?: string;
  picture?: string;
  authMethod: 'google' | 'freighter';
}

export interface StellarSocialAccount {
  publicKey: string;
  data: {
    publicKey: string;
    authMethods: AuthMethodData[];
    createdAt: number;
    recoveryContacts: string[];
  };
  getBalance(): Promise<BalanceInfo[]>;
  sendPayment(destination: string, amount: string, asset?: unknown, memo?: string): Promise<string>;
  addAuthMethod(method: AuthMethodData): Promise<boolean>;
}

export interface AuthMethodData {
  type: string;
  identifier: string;
  metadata?: {
    name?: string;
    email?: string;
    picture?: string;
  };
}

export interface AuthContextType {
  // Estado
  user: SocialUser | null;
  account: StellarSocialAccount | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  authMethod: 'google' | 'freighter' | null;

  // Métodos
  loginWithGoogle: (credentialResponse: CredentialResponse) => Promise<void>;
  loginWithFreighter: () => Promise<void>;
  logout: () => void;
  getBalance: () => Promise<BalanceInfo[]>;
  sendPayment: (to: string, amount: string, memo?: string) => Promise<string>;
}

// Extender Window para Google Identity Services
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: GoogleIdConfig) => void;
          renderButton: (element: HTMLElement, config: GoogleButtonConfig) => void;
          prompt: (callback?: (notification: PromptNotification) => void) => void;
          disableAutoSelect: () => void;
          revoke: (hint: string, callback?: () => void) => void;
        };
      };
    };
    handleGoogleCredential?: (response: CredentialResponse) => void;
  }
}

export interface GoogleIdConfig {
  client_id: string;
  callback: (response: CredentialResponse) => void;
  auto_select?: boolean;
  cancel_on_tap_outside?: boolean;
  ux_mode?: 'popup' | 'redirect';
  context?: 'signin' | 'signup' | 'use';
  itp_support?: boolean;
  use_fedcm_for_prompt?: boolean;
}

export interface GoogleButtonConfig {
  type?: 'standard' | 'icon';
  theme?: 'outline' | 'filled_blue' | 'filled_black';
  size?: 'large' | 'medium' | 'small';
  text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
  shape?: 'rectangular' | 'pill' | 'circle' | 'square';
  logo_alignment?: 'left' | 'center';
  width?: string | number;
}

export interface PromptNotification {
  isNotDisplayed(): boolean;
  isSkippedMoment(): boolean;
  isDismissedMoment(): boolean;
  getNotDisplayedReason(): string;
  getSkippedReason(): string;
  getDismissedReason(): string;
}
