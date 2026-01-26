import {
  isConnected,
  requestAccess,
  getNetwork,
  signTransaction,
} from '@stellar/freighter-api';
import { AuthMethod } from '../types';

export class FreighterProvider {
  /**
   * Check if Freighter is installed
   */
  async isInstalled(): Promise<boolean> {
    try {
      const result = await isConnected();
      // Handle both old and new API response formats
      return typeof result === 'boolean' ? result : result.isConnected;
    } catch {
      return false;
    }
  }

  /**
   * Connect to Freighter wallet
   */
  async connect(): Promise<AuthMethod> {
    const installed = await this.isInstalled();
    if (!installed) {
      throw new Error('Freighter wallet not installed. Please install from https://freighter.app');
    }

    try {
      const accessResult = await requestAccess();
      // Handle both old and new API response formats
      const publicKey = typeof accessResult === 'string'
        ? accessResult
        : accessResult.address;

      if (!publicKey) {
        throw new Error('User denied access or no public key returned');
      }

      return {
        type: 'freighter',
        identifier: publicKey,
        metadata: {
          walletType: 'freighter',
          connected: true
        }
      };
    } catch (error) {
      throw new Error(`Failed to connect to Freighter: ${error}`);
    }
  }

  /**
   * Get current network from Freighter
   */
  async getNetworkName(): Promise<string> {
    const installed = await this.isInstalled();
    if (!installed) {
      throw new Error('Freighter not installed');
    }

    const result = await getNetwork();
    // Handle both old and new API response formats
    return typeof result === 'string' ? result : result.network;
  }

  /**
   * Sign transaction with Freighter
   */
  async signTx(transaction: string, opts?: { network?: string; networkPassphrase?: string }): Promise<string> {
    const installed = await this.isInstalled();
    if (!installed) {
      throw new Error('Freighter not installed');
    }

    const result = await signTransaction(transaction, opts);
    // Handle both old and new API response formats
    return typeof result === 'string' ? result : result.signedTxXdr;
  }
}