import { Horizon, Keypair, TransactionBuilder, Networks, Operation } from '@stellar/stellar-sdk';
import { SocialAuthConfig, AuthMethod, AuthResult, PhoneVerification } from './types/index.js';
import { StellarSocialAccount } from './auth/StellarSocialAccount.js';
import { GoogleAuthProvider } from './providers/GoogleAuthProvider.js';
import { FreighterProvider } from './providers/FreighterProvider.js';
import { CryptoUtils } from './utils/crypto.js';
import { DEFAULT_CONTRACT_ID } from './config.js';

export class StellarSocialSDK {
  private server: Horizon.Server;
  private contractId: string;
  private network: string;
  public googleProvider?: GoogleAuthProvider;
  private freighterProvider: FreighterProvider;

  constructor(config: SocialAuthConfig) {
    this.contractId = config.contractId || DEFAULT_CONTRACT_ID;
    this.network = config.network;
    this.server = new Horizon.Server(
      config.horizonUrl || 
      (config.network === 'testnet' 
        ? 'https://horizon-testnet.stellar.org'
        : 'https://horizon.stellar.org')
    );

    // Initialize providers
    if (config.googleClientId) {
      this.googleProvider = new GoogleAuthProvider(config.googleClientId);
    }
    this.freighterProvider = new FreighterProvider();
  }

  /**
   * Initialize SDK (load external scripts, etc.)
   */
  async initialize(): Promise<void> {
    console.log('🚀 Initializing Stellar Social SDK...');
    if (this.googleProvider) {
      await this.googleProvider.initialize();
    }
    console.log('✅ SDK initialized');
  }

  /**
   * Authenticate with Google using credential response - REAL OAuth
   */
  async authenticateWithGoogleCredential(credentialResponse: any): Promise<AuthResult> {
    try {
      console.log('🔐 Processing Google credential response...');
      
      if (!this.googleProvider) {
        throw new Error('Google provider not configured. Please provide googleClientId in config.');
      }

      // Process credential response through provider
      const authMethod = await this.googleProvider.createAuthMethodFromCredential(credentialResponse);
      
      // Use Google sub (user ID) for deterministic keypair generation
      const googleSub = authMethod.metadata?.sub;
      if (!googleSub) {
        throw new Error('Google user ID not found');
      }

      // Create deterministic keypair from Google user ID
      const keypair = CryptoUtils.generateKeypair('google', googleSub);
      const publicKey = keypair.publicKey();
      
      console.log(`🔑 Generated deterministic address for Google user: ${publicKey}`);
      console.log(`👤 Google user: ${authMethod.metadata?.name} (${authMethod.metadata?.email})`);

      // Check if account exists or create new one
      const account = await this.getOrCreateAccountWithKeypair(keypair, authMethod);

      console.log('✅ Real Google authentication successful');
      return {
        success: true,
        account
      };
    } catch (error: any) {
      console.error('❌ Google authentication failed:', error.message);
      return {
        success: false,
        error: error.message || 'Google authentication failed'
      };
    }
  }

  /**
   * Authenticate with Google - DEPRECATED, use authenticateWithGoogleCredential
   */
  async authenticateWithGoogle(): Promise<AuthResult> {
    return {
      success: false,
      error: 'Direct Google authentication is deprecated. Use authenticateWithGoogleCredential() instead.'
    };
  }

  /**
   * Authenticate with Facebook (mock for MVP)
   */
  async authenticateWithFacebook(): Promise<AuthResult> {
    try {
      console.log('🔐 Starting Facebook authentication...');
      
      const authMethod: AuthMethod = {
        type: 'facebook',
        identifier: `user${Math.floor(Math.random() * 1000)}@facebook.com`,
        token: 'mock_facebook_token',
        metadata: {
          name: 'Facebook User',
          id: 'fb_' + Math.floor(Math.random() * 1000000)
        }
      };

      const account = await this.getOrCreateAccount(authMethod);

      console.log('✅ Facebook authentication successful');
      return {
        success: true,
        account
      };
    } catch (error: any) {
      console.error('❌ Facebook authentication failed:', error.message);
      return {
        success: false,
        error: error.message || 'Facebook authentication failed'
      };
    }
  }

  /**
   * Authenticate with phone number
   */
  async authenticateWithPhone(verification: PhoneVerification): Promise<AuthResult> {
    try {
      console.log('📱 Starting phone authentication...');
      
      if (verification.verificationCode !== '123456') {
        throw new Error('Invalid verification code. Use 123456 for testing');
      }

      const authMethod: AuthMethod = {
        type: 'phone',
        identifier: CryptoUtils.hashPhone(verification.phoneNumber),
        metadata: {
          phoneNumber: verification.phoneNumber
        }
      };

      const account = await this.getOrCreateAccount(authMethod);

      console.log('✅ Phone authentication successful');
      return {
        success: true,
        account
      };
    } catch (error: any) {
      console.error('❌ Phone authentication failed:', error.message);
      return {
        success: false,
        error: error.message || 'Phone authentication failed'
      };
    }
  }

  /**
   * Connect Freighter wallet
   */
  async connectFreighter(): Promise<AuthResult> {
    try {
      console.log('🦊 Connecting to Freighter wallet...');
      
      const authMethod = await this.freighterProvider.connect();
      const account = await this.loadExistingAccount(authMethod.identifier);
      
      if (account) {
        console.log('✅ Connected to existing Freighter account');
        return {
          success: true,
          account
        };
      }

      const newAccount = await this.getOrCreateAccount(authMethod);

      console.log('✅ Freighter wallet connected');
      return {
        success: true,
        account: newAccount
      };
    } catch (error: any) {
      console.error('❌ Freighter connection failed:', error.message);
      return {
        success: false,
        error: error.message || 'Freighter connection failed'
      };
    }
  }

  /**
   * Get or create account for auth method
   */
  private async getOrCreateAccount(authMethod: AuthMethod): Promise<StellarSocialAccount> {
    let keypair: Keypair;

    if (authMethod.type === 'freighter') {
      keypair = Keypair.fromPublicKey(authMethod.identifier);
    } else {
      keypair = CryptoUtils.generateKeypair(authMethod.type, authMethod.identifier);
    }

    const publicKey = keypair.publicKey();
    console.log(`🔑 Generated address: ${publicKey}`);

    try {
      await this.server.loadAccount(publicKey);
      console.log('📋 Loading existing account:', publicKey);
      
      const accountData = {
        publicKey,
        authMethods: [authMethod],
        createdAt: Date.now(),
        recoveryContacts: []
      };

      return new StellarSocialAccount(
        accountData,
        this.server,
        this.contractId,
        this.network,
        authMethod.type !== 'freighter' ? keypair : undefined
      );

    } catch (error) {
      console.log('🔨 Creating new account for:', authMethod.type);
      return await this.createNewAccount(keypair, authMethod);
    }
  }

  /**
   * Get or create account with specific keypair
   */
  private async getOrCreateAccountWithKeypair(
    keypair: Keypair, 
    authMethod: AuthMethod
  ): Promise<StellarSocialAccount> {
    const publicKey = keypair.publicKey();

    try {
      await this.server.loadAccount(publicKey);
      console.log('📋 Loading existing account:', publicKey);
      
      const accountData = {
        publicKey,
        authMethods: [authMethod],
        createdAt: Date.now(),
        recoveryContacts: []
      };

      return new StellarSocialAccount(
        accountData,
        this.server,
        this.contractId,
        this.network,
        keypair
      );

    } catch (error) {
      console.log('🔨 Creating new account for Google user:', authMethod.metadata?.email);
      return await this.createNewAccountWithKeypair(keypair, authMethod);
    }
  }

  /**
   * Create new Stellar account
   */
  private async createNewAccount(
    keypair: Keypair, 
    authMethod: AuthMethod
  ): Promise<StellarSocialAccount> {
    const publicKey = keypair.publicKey();

    if (this.network === 'testnet') {
      console.log('💰 Funding testnet account...');
      await this.fundTestnetAccount(publicKey);
      console.log('⏳ Waiting for account creation...');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    const accountData = {
      publicKey,
      authMethods: [authMethod],
      createdAt: Date.now(),
      recoveryContacts: []
    };

    const account = new StellarSocialAccount(
      accountData,
      this.server,
      this.contractId,
      this.network,
      authMethod.type !== 'freighter' ? keypair : undefined
    );

    await account.initializeWithContract();
    return account;
  }

  /**
   * Create new account with specific keypair
   */
  private async createNewAccountWithKeypair(
    keypair: Keypair, 
    authMethod: AuthMethod
  ): Promise<StellarSocialAccount> {
    const publicKey = keypair.publicKey();

    if (this.network === 'testnet') {
      console.log('💰 Funding testnet account...');
      await this.fundTestnetAccount(publicKey);
      console.log('⏳ Waiting for account creation...');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    const accountData = {
      publicKey,
      authMethods: [authMethod],
      createdAt: Date.now(),
      recoveryContacts: []
    };

    const account = new StellarSocialAccount(
      accountData,
      this.server,
      this.contractId,
      this.network,
      keypair
    );

    await account.initializeWithContract();
    return account;
  }

  /**
   * Fund testnet account using friendbot
   */
  private async fundTestnetAccount(publicKey: string): Promise<void> {
    if (this.network !== 'testnet') return;

    try {
      const response = await fetch(`https://friendbot.stellar.org?addr=${publicKey}`);
      if (!response.ok) {
        throw new Error('Friendbot funding failed');
      }
      console.log('✅ Account funded with testnet XLM');
    } catch (error: any) {
      console.warn('⚠️ Friendbot funding failed:', error.message);
    }
  }

  /**
   * Load existing account if it exists
   */
  private async loadExistingAccount(publicKey: string): Promise<StellarSocialAccount | null> {
    try {
      await this.server.loadAccount(publicKey);
      
      const accountData = {
        publicKey,
        authMethods: [],
        createdAt: Date.now(),
        recoveryContacts: []
      };

      return new StellarSocialAccount(
        accountData,
        this.server,
        this.contractId,
        this.network
      );
    } catch (error) {
      return null;
    }
  }
}

// Export all types and classes
export * from './types/index.js';
export { StellarSocialAccount } from './auth/StellarSocialAccount.js';
export { DEFAULT_CONTRACT_ID } from './config.js';
