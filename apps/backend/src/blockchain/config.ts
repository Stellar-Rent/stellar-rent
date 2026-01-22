import { Networks, Keypair, Horizon } from '@stellar/stellar-sdk';
import { Server as SorobanRpcServer } from '@stellar/stellar-sdk/rpc';

export interface SorobanConfig {
  rpcServer: SorobanRpcServer;
  horizonServer: Horizon.Server;
  networkPassphrase: string;
  sourceKeypair: Keypair;
  contractIds: {
    booking: string;
    property: string;
  };
  fees: {
    default: string;
    booking: string;
    property: string;
  };
  timeouts: {
    transaction: number;
    confirmation: number;
  };
  retries: {
    maxAttempts: number;
    delayMs: number;
  };
  useMock: boolean;
}

// Singleton configuration
let config: SorobanConfig | null = null;

/**
 * Initialize Soroban configuration from environment variables
 * This should be called once at application startup
 */
export function initializeSorobanConfig(): SorobanConfig {
  if (config) return config;

  // Check if mock mode is enabled
  const useMock = process.env.USE_MOCK === 'true';

  // In mock mode, create a minimal config
  if (useMock) {
    config = {
      rpcServer: null as any, // Mock will override this
      horizonServer: null as any,
      networkPassphrase: Networks.TESTNET,
      sourceKeypair: null as any,
      contractIds: {
        booking: 'mock-booking-contract',
        property: 'mock-property-contract',
      },
      fees: {
        default: '10000',
        booking: '50000',
        property: '30000',
      },
      timeouts: {
        transaction: 30,
        confirmation: 60000,
      },
      retries: {
        maxAttempts: 3,
        delayMs: 1000,
      },
      useMock: true,
    };
    return config;
  }

  // Validate required environment variables
  const rpcUrl = process.env.SOROBAN_RPC_URL;
  const horizonUrl = process.env.STELLAR_HORIZON_URL || process.env.STELLAR_RPC_URL;
  const secretKey = process.env.STELLAR_SECRET_KEY;

  if (!rpcUrl) {
    throw new Error('SOROBAN_RPC_URL environment variable is required');
  }

  if (!horizonUrl) {
    throw new Error(
      'STELLAR_HORIZON_URL or STELLAR_RPC_URL environment variable is required'
    );
  }

  if (!secretKey) {
    throw new Error('STELLAR_SECRET_KEY environment variable is required');
  }

  // Initialize servers
  let rpcServer: SorobanRpcServer;
  let horizonServer: Horizon.Server;

  try {
    rpcServer = new SorobanRpcServer(rpcUrl);
  } catch (error) {
    throw new Error(
      `Failed to initialize Soroban RPC server at ${rpcUrl}: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }

  try {
    horizonServer = new Horizon.Server(horizonUrl);
  } catch (error) {
    throw new Error(
      `Failed to initialize Horizon server at ${horizonUrl}: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }

  // Initialize keypair
  let sourceKeypair: Keypair;
  try {
    sourceKeypair = Keypair.fromSecret(secretKey);
  } catch (error) {
    throw new Error(
      `Failed to parse STELLAR_SECRET_KEY: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }

  // Get contract IDs (with defaults for backward compatibility)
  const bookingContractId = process.env.SOROBAN_CONTRACT_ID || '';
  const propertyContractId =
    process.env.PROPERTY_LISTING_CONTRACT_ID || process.env.SOROBAN_CONTRACT_ID || '';

  // Build configuration
  config = {
    rpcServer,
    horizonServer,
    networkPassphrase:
      process.env.SOROBAN_NETWORK_PASSPHRASE || Networks.TESTNET,
    sourceKeypair,
    contractIds: {
      booking: bookingContractId,
      property: propertyContractId,
    },
    fees: {
      default: process.env.SOROBAN_DEFAULT_FEE || '10000',
      booking: process.env.SOROBAN_BOOKING_FEE || '50000',
      property: process.env.SOROBAN_PROPERTY_FEE || '30000',
    },
    timeouts: {
      transaction: Number.parseInt(process.env.SOROBAN_TX_TIMEOUT || '30', 10),
      confirmation: Number.parseInt(
        process.env.SOROBAN_CONFIRMATION_TIMEOUT || '60000',
        10
      ),
    },
    retries: {
      maxAttempts: Number.parseInt(process.env.SOROBAN_MAX_RETRIES || '3', 10),
      delayMs: Number.parseInt(process.env.SOROBAN_RETRY_DELAY || '1000', 10),
    },
    useMock: false,
  };

  return config;
}

/**
 * Get the Soroban configuration singleton
 * Initializes if not already initialized
 */
export function getSorobanConfig(): SorobanConfig {
  if (!config) {
    return initializeSorobanConfig();
  }
  return config;
}

/**
 * Reset the configuration (primarily for testing)
 */
export function resetSorobanConfig(): void {
  config = null;
}
