// @ts-ignore: Accessing root project SDK
export { StellarSocialSDK } from '../../../../index';

/**
 * Manually defined types to prevent TS2305 errors when
 * resolving types from the root directory.
 */
export type AuthMethod = 'google' | 'apple' | 'facebook' | 'wallet';
export type UserRole = 'guest' | 'host' | 'tenant' | 'dual';

export interface SocialAuthConfig {
  clientId: string;
  method: AuthMethod;
}

export interface StellarUser {
  publicKey: string;
  email?: string;
  role?: UserRole;
}
