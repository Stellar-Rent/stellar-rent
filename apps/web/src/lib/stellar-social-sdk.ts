// Re-export del Stellar Social SDK para uso en la aplicación
// Este archivo facilita las importaciones y permite cambiar la fuente del SDK fácilmente

export { StellarSocialSDK } from '../../stellar-social-sdk/dist/index.esm.js';
export type {
  SocialAuthConfig,
  AuthMethod,
  AuthResult,
  SocialAccountData,
} from '../../stellar-social-sdk/dist/index.esm.js';
