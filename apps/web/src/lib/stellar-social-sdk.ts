<<<<<<< HEAD
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
=======
// Re-export del Stellar Social SDK para uso en la aplicación
// Este archivo facilita las importaciones y permite cambiar la fuente del SDK fácilmente

export { StellarSocialSDK } from '../../stellar-social-sdk/dist/index.esm.js';
export type {
  SocialAuthConfig,
  AuthMethod,
  AuthResult,
  SocialAccountData,
} from '../../stellar-social-sdk/dist/index.esm.js';
>>>>>>> origin/main
