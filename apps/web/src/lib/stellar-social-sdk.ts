/**
 * SDK Integration for Social Authentication on Stellar
 * Uses dynamic access to prevent build-time import errors
 */

// Importamos todo como namespace para evitar errores de exportación "not found"
import * as RootSDK from '../../../../index';

// Función defensiva para extraer la clase del SDK
const getSDK = () => {
  if (typeof window === 'undefined') return null;

  const anyRoot = RootSDK as any;
  // Intentamos todas las combinaciones posibles de exportación
  return anyRoot.StellarSocialSDK || anyRoot.default?.StellarSocialSDK || anyRoot.default || null;
};

export const StellarSocialSDK = getSDK();

// Tipos globales
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
