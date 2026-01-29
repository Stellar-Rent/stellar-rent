// @ts-ignore: Acceso a la raíz del proyecto
export { StellarSocialSDK } from '../../../../index';

/**
 * Definimos los tipos manualmente aquí para que la aplicación no los busque 
 * en el index de la raíz, evitando así los errores 2305.
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