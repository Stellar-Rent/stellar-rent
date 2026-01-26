import { describe, test, expect, beforeAll } from 'bun:test';
import { getSorobanConfig, initializeSorobanConfig, resetSorobanConfig } from '../../src/blockchain/config';
import { getRecommendedFee } from '../../src/blockchain/transactionUtils';

/**
 * Testnet Integration Tests for Soroban Configuration
 *
 * These tests verify the Soroban SDK integration works correctly on testnet.
 * They should run with USE_MOCK=false
 *
 * Prerequisites:
 * - SOROBAN_RPC_URL must be set to a valid testnet RPC endpoint
 * - STELLAR_HORIZON_URL must be set to a valid testnet Horizon endpoint
 * - STELLAR_SECRET_KEY must be a funded testnet account
 * - SOROBAN_CONTRACT_ID must be a deployed booking contract
 * - PROPERTY_LISTING_CONTRACT_ID must be a deployed property contract
 */

describe('Testnet Integration - Soroban Configuration', () => {
  beforeAll(() => {
    // Reset config before tests to ensure fresh initialization
    resetSorobanConfig();

    // Verify we're not in mock mode
    if (process.env.USE_MOCK === 'true') {
      throw new Error('These tests must run with USE_MOCK=false');
    }
  });

  test('should initialize Soroban configuration from environment', () => {
    const config = initializeSorobanConfig();

    expect(config).toBeDefined();
    expect(config.rpcServer).toBeDefined();
    expect(config.horizonServer).toBeDefined();
    expect(config.sourceKeypair).toBeDefined();
    expect(config.useMock).toBe(false);
  });

  test('should have valid contract IDs configured', () => {
    const config = getSorobanConfig();

    expect(config.contractIds.booking).toBeDefined();
    expect(config.contractIds.booking.length).toBeGreaterThan(0);
    expect(config.contractIds.property).toBeDefined();
    expect(config.contractIds.property.length).toBeGreaterThan(0);
  });

  test('should have valid fee configuration', () => {
    const config = getSorobanConfig();

    expect(Number(config.fees.default)).toBeGreaterThan(0);
    expect(Number(config.fees.booking)).toBeGreaterThan(0);
    expect(Number(config.fees.property)).toBeGreaterThan(0);
  });

  test('should connect to Soroban RPC server', async () => {
    const config = getSorobanConfig();

    // Test RPC connectivity by getting network info
    const health = await config.rpcServer.getHealth();
    expect(health.status).toBe('healthy');
  }, 30000);

  test('should connect to Horizon server', async () => {
    const config = getSorobanConfig();

    // Test Horizon connectivity by loading the source account
    const account = await config.horizonServer.loadAccount(
      config.sourceKeypair.publicKey()
    );

    expect(account).toBeDefined();
    expect(account.accountId()).toBe(config.sourceKeypair.publicKey());
  }, 30000);

  test('should fetch dynamic fee recommendation from network', async () => {
    const config = getSorobanConfig();

    const recommendedFee = await getRecommendedFee(
      config.rpcServer,
      config.fees.default
    );

    expect(recommendedFee).toBeDefined();
    expect(Number(recommendedFee)).toBeGreaterThan(0);
  }, 30000);

  test('should have valid network passphrase', () => {
    const config = getSorobanConfig();

    // Should be testnet passphrase
    expect(config.networkPassphrase).toContain('Test SDF Network');
  });

  test('should have valid timeout configuration', () => {
    const config = getSorobanConfig();

    expect(config.timeouts.transaction).toBeGreaterThan(0);
    expect(config.timeouts.confirmation).toBeGreaterThan(0);
    expect(config.timeouts.confirmation).toBeGreaterThan(config.timeouts.transaction * 1000);
  });

  test('should have valid retry configuration', () => {
    const config = getSorobanConfig();

    expect(config.retries.maxAttempts).toBeGreaterThanOrEqual(1);
    expect(config.retries.delayMs).toBeGreaterThan(0);
  });
});

describe('Testnet Integration - Network Queries', () => {
  test('should query fee stats from network', async () => {
    const config = getSorobanConfig();

    const feeStats = await config.rpcServer.getFeeStats();

    expect(feeStats).toBeDefined();
    expect(feeStats.sorobanInclusionFee).toBeDefined();
    expect(feeStats.sorobanInclusionFee.min).toBeDefined();
    expect(feeStats.sorobanInclusionFee.mode).toBeDefined();
    expect(feeStats.sorobanInclusionFee.max).toBeDefined();
  }, 30000);

  test('should query latest ledger from network', async () => {
    const config = getSorobanConfig();

    const latestLedger = await config.rpcServer.getLatestLedger();

    expect(latestLedger).toBeDefined();
    expect(latestLedger.sequence).toBeGreaterThan(0);
    expect(latestLedger.protocolVersion).toBeGreaterThan(0);
  }, 30000);

  test('should load account from Horizon', async () => {
    const config = getSorobanConfig();

    const account = await config.horizonServer.loadAccount(
      config.sourceKeypair.publicKey()
    );

    expect(account).toBeDefined();
    expect(account.balances).toBeDefined();
    expect(account.balances.length).toBeGreaterThan(0);
  }, 30000);
});
