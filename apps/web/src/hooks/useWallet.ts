import { useState, useEffect } from 'react';

interface WalletState {
  isConnected: boolean;
  publicKey: string | null;
  network: string | null;
}

export function useWallet() {
  const [walletState, setWalletState] = useState<WalletState>({
    isConnected: false,
    publicKey: null,
    network: null,
  });

  useEffect(() => {
    // Check if Freighter is installed
    const checkFreighter = async () => {
      if (typeof window !== 'undefined' && window.freighterApi) {
        try {
          const isConnected = await window.freighterApi.isConnected();
          if (isConnected) {
            const publicKey = await window.freighterApi.getPublicKey();
            const network = await window.freighterApi.getNetwork();
            setWalletState({
              isConnected: true,
              publicKey,
              network,
            });
          }
        } catch (error) {
          console.error('Error checking Freighter connection:', error);
        }
      }
    };

    checkFreighter();
  }, []);

  const connect = async () => {
    if (typeof window === 'undefined' || !window.freighterApi) {
      throw new Error('Freighter wallet not found');
    }

    try {
      await window.freighterApi.connect();
      const publicKey = await window.freighterApi.getPublicKey();
      const network = await window.freighterApi.getNetwork();
      setWalletState({
        isConnected: true,
        publicKey,
        network,
      });
    } catch (error) {
      console.error('Error connecting to Freighter:', error);
      throw error;
    }
  };

  const disconnect = async () => {
    if (typeof window === 'undefined' || !window.freighterApi) {
      return;
    }

    try {
      await window.freighterApi.disconnect();
      setWalletState({
        isConnected: false,
        publicKey: null,
        network: null,
      });
    } catch (error) {
      console.error('Error disconnecting from Freighter:', error);
    }
  };

  return {
    ...walletState,
    connect,
    disconnect,
  };
}

// Add Freighter types to the window object
declare global {
  interface Window {
    freighterApi?: {
      isConnected: () => Promise<boolean>;
      connect: () => Promise<void>;
      disconnect: () => Promise<void>;
      getPublicKey: () => Promise<string>;
      getNetwork: () => Promise<string>;
      signTransaction: (transaction: string) => Promise<string>;
    };
  }
} 