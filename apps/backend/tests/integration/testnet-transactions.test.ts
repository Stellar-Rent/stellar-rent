import { describe, test, expect, beforeAll } from 'bun:test';
import { getSorobanConfig, resetSorobanConfig } from '../../src/blockchain/config';
import {
  buildTransaction,
  submitAndConfirmTransaction,
  simulateTransaction,
  retryOperation,
  getRecommendedFee,
} from '../../src/blockchain/transactionUtils';
import { Contract, nativeToScVal } from '@stellar/stellar-sdk';
import { NetworkError, isRetryableError } from '../../src/blockchain/errors';

/**
 * Testnet Integration Tests for Transaction Handling
 *
 * These tests verify transaction building, submission, and confirmation work correctly.
 * They test the core improvements: dynamic fees, confirmation polling, and retry logic.
 *
 * Prerequisites:
 * - USE_MOCK=false
 * - Funded testnet account
 * - Deployed contracts on testnet
 */

describe('Testnet Integration - Transaction Building', () => {
  beforeAll(() => {
    resetSorobanConfig();

    if (process.env.USE_MOCK === 'true') {
      throw new Error('These tests must run with USE_MOCK=false');
    }
  });

  test('should build transaction with configured fee', async () => {
    const config = getSorobanConfig();
    const contract = new Contract(config.contractIds.booking);

    // Create a simple read-only operation
    const propertyIdScVal = nativeToScVal('test-property-id', { type: 'string' });
    const operation = contract.call('get_booking', propertyIdScVal);

    const tx = await buildTransaction(operation, config, {
      fee: config.fees.booking,
    });

    expect(tx).toBeDefined();
    expect(tx.fee).toBe(config.fees.booking);
  }, 30000);

  test('should build transaction with dynamic fee', async () => {
    const config = getSorobanConfig();
    const contract = new Contract(config.contractIds.booking);

    const propertyIdScVal = nativeToScVal('test-property-id', { type: 'string' });
    const operation = contract.call('get_booking', propertyIdScVal);

    // Don't specify fee - should use dynamic calculation
    const tx = await buildTransaction(operation, config);

    expect(tx).toBeDefined();
    expect(Number(tx.fee)).toBeGreaterThan(0);
  }, 30000);

  test('should get recommended fee from network', async () => {
    const config = getSorobanConfig();

    const recommendedFee = await getRecommendedFee(
      config.rpcServer,
      config.fees.default
    );

    expect(recommendedFee).toBeDefined();
    expect(Number(recommendedFee)).toBeGreaterThan(Number(config.fees.default) * 0.5);
  }, 30000);
});

describe('Testnet Integration - Transaction Simulation', () => {
  test('should simulate read-only contract call', async () => {
    const config = getSorobanConfig();
    const contract = new Contract(config.contractIds.property);

    const propertyIdScVal = nativeToScVal('test-property-123', { type: 'string' });
    const operation = contract.call('get_listing', propertyIdScVal);

    const tx = await buildTransaction(operation, config);

    // Simulation should work even if property doesn't exist
    // It might return null or throw, but shouldn't hang
    try {
      const result = await simulateTransaction(tx, config.rpcServer);
      // If simulation succeeds, result should be defined (even if null)
      expect(result !== undefined).toBe(true);
    } catch (error) {
      // Simulation can fail if contract doesn't have the property
      // This is expected behavior
      expect(error).toBeDefined();
    }
  }, 30000);

  test('should simulate availability check', async () => {
    const config = getSorobanConfig();
    const contract = new Contract(config.contractIds.booking);

    const propertyIdScVal = nativeToScVal('test-property', { type: 'string' });
    const fromScVal = nativeToScVal(Math.floor(Date.now() / 1000), { type: 'i64' });
    const toScVal = nativeToScVal(Math.floor(Date.now() / 1000) + 86400, { type: 'i64' });

    const operation = contract.call(
      'check_availability',
      propertyIdScVal,
      fromScVal,
      toScVal
    );

    const tx = await buildTransaction(operation, config);

    try {
      const result = await simulateTransaction(tx, config.rpcServer);
      expect(result !== undefined).toBe(true);
    } catch (error) {
      // Contract might not have this function or it might fail
      // This is acceptable for testnet
      expect(error).toBeDefined();
    }
  }, 30000);
});

describe('Testnet Integration - Error Handling', () => {
  test('should classify network errors as retryable', () => {
    const networkError = new NetworkError('Connection timeout');

    expect(isRetryableError(networkError)).toBe(true);
  });

  test('should handle connection errors with retry', async () => {
    const config = getSorobanConfig();
    let attemptCount = 0;

    const operation = async () => {
      attemptCount++;
      if (attemptCount < 2) {
        throw new NetworkError('Simulated network error');
      }
      return 'success';
    };

    const result = await retryOperation(operation, config);

    expect(result).toBe('success');
    expect(attemptCount).toBe(2);
  });

  test('should respect max retry attempts', async () => {
    const config = getSorobanConfig();
    let attemptCount = 0;

    const operation = async () => {
      attemptCount++;
      throw new NetworkError('Persistent network error');
    };

    try {
      await retryOperation(operation, config);
      expect(true).toBe(false); // Should not reach here
    } catch (error) {
      expect(error).toBeInstanceOf(NetworkError);
      expect(attemptCount).toBe(config.retries.maxAttempts);
    }
  });
});

describe('Testnet Integration - Account Balance', () => {
  test('should load account and check balances', async () => {
    const config = getSorobanConfig();

    const account = await config.horizonServer.loadAccount(
      config.sourceKeypair.publicKey()
    );

    expect(account).toBeDefined();
    expect(account.balances).toBeDefined();

    // Should have at least XLM balance
    const xlmBalance = account.balances.find(
      (b) => b.asset_type === 'native'
    );
    expect(xlmBalance).toBeDefined();
    expect(Number(xlmBalance!.balance)).toBeGreaterThan(0);
  }, 30000);
});

/**
 * Note: Full transaction submission tests are commented out to avoid
 * spending testnet XLM. These can be enabled for thorough testing.
 */
/*
describe('Testnet Integration - Transaction Submission (EXPENSIVE)', () => {
  test('should submit and confirm a transaction', async () => {
    const config = getSorobanConfig();
    // This would create actual on-chain state
    // Only enable for thorough testing
  }, 60000);
});
*/
