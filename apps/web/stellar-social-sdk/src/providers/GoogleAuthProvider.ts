import { AuthMethod } from '../types/index.js';
import { CryptoUtils } from '../utils/crypto.js';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          prompt: () => void;
          renderButton: (element: Element, config: any) => void;
        };
      };
    };
    handleGoogleCredential?: (response: any) => void;
  }
}

export class GoogleAuthProvider {
  private clientId: string;
  private initialized = false;

  constructor(clientId: string) {
    if (!clientId) {
      throw new Error('Google Client ID is required');
    }
    this.clientId = clientId;
  }

  /**
   * Initialize Google Identity Services (only load script, don't initialize)
   */
  async initialize(): Promise<void> {
    if (typeof window === 'undefined') return;
    if (this.initialized) return;
    
    console.log('🔧 Loading Google Identity Services script...');
    
    // Only load the script, let the demo app handle initialization
    await this.loadGoogleIdentityServices();
    
    this.initialized = true;
    console.log('✅ Google Identity Services script loaded');
  }

  /**
   * Load Google Identity Services script
   */
  private loadGoogleIdentityServices(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (document.querySelector('script[src="https://accounts.google.com/gsi/client"]')) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Google Identity Services'));
      
      document.head.appendChild(script);
    });
  }

  /**
   * Handle Google credential response
   */
  private handleCredentialResponse(response: any) {
    if (window.handleGoogleCredential) {
      window.handleGoogleCredential(response);
    }
  }

  /**
   * Create AuthMethod from Google credential response
   */
  async createAuthMethodFromCredential(credentialResponse: any): Promise<AuthMethod> {
    try {
      const userInfo = await this.verifyToken(credentialResponse.credential);
      
      const authMethod: AuthMethod = {
        type: 'google',
        identifier: userInfo.email,
        token: credentialResponse.credential,
        metadata: {
          name: userInfo.name,
          picture: userInfo.picture,
          sub: userInfo.sub,
          email: userInfo.email,
          email_verified: userInfo.email_verified,
        }
      };

      console.log('✅ Google authentication successful:', userInfo.email);
      return authMethod;
    } catch (error: any) {
      console.error('❌ Google authentication failed:', error);
      throw error;
    }
  }

  /**
   * Authenticate with Google - Real OAuth flow (deprecated, use createAuthMethodFromCredential)
   */
  async authenticate(): Promise<AuthMethod> {
    throw new Error('Direct authenticate() is deprecated. Use createAuthMethodFromCredential() instead.');
  }

  /**
   * Render Google Sign-In button
   */
  renderButton(element: Element, config: any = {}): void {
    if (!this.initialized || !window.google?.accounts?.id) {
      throw new Error('Google Identity Services not initialized');
    }

    const defaultConfig = {
      type: 'standard',
      shape: 'rectangular',
      theme: 'outline',
      text: 'signin_with',
      size: 'large',
      logo_alignment: 'left',
      width: '100%',
    };

    window.google.accounts.id.renderButton(element, { ...defaultConfig, ...config });
  }

  /**
   * Verify Google JWT token with enhanced validation
   */
  async verifyToken(token: string): Promise<any> {
    try {
      // Decode JWT without verification (for demo purposes)
      // In production, verify signature with Google's public keys
      const payload = this.decodeJWT(token);
      
      // Basic validation
      if (!payload.iss || (payload.iss !== 'https://accounts.google.com' && payload.iss !== 'accounts.google.com')) {
        throw new Error(`Invalid token issuer: ${payload.iss}`);
      }
      
      if (!payload.aud || payload.aud !== this.clientId) {
        throw new Error(`Invalid token audience. Expected: ${this.clientId}, Got: ${payload.aud}`);
      }
      
      if (!payload.exp || payload.exp < Date.now() / 1000) {
        throw new Error('Token expired');
      }

      if (!payload.sub) {
        throw new Error('Missing user ID in token');
      }

      if (!payload.email) {
        throw new Error('Missing email in token');
      }

      return payload;
    } catch (error: any) {
      throw new Error(`Token verification failed: ${error.message}`);
    }
  }

  /**
   * Decode JWT token (basic decoding)
   */
  private decodeJWT(token: string): any {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid JWT format');
      }

      const payload = parts[1];
      const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
      return JSON.parse(decoded);
    } catch (error) {
      throw new Error('Failed to decode JWT');
    }
  }

  /**
   * Generate deterministic seed from Google user ID
   */
  generateSeed(googleSub: string): string {
    return CryptoUtils.generateSeed('google', googleSub);
  }

  /**
   * Sign out from Google
   */
  signOut(): void {
    if (window.google?.accounts?.id) {
      // Google Identity Services doesn't have direct sign out
      // We'll handle this in the app level
      console.log('Google sign out requested');
    }
  }
}
