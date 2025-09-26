// tests/mocks/blockchain.mocks.ts
// Jest mock for TrustlessWork blockchain client to avoid real network calls

// Export a single mocked instance with jest.fn methods so tests can control behavior
export const mockedTrustlessWork = {
  // Core escrow methods from TrustlessWorkClient
  createEscrow: jest.fn<Promise<unknown>, unknown[]>(),
  getEscrowStatus: jest.fn<Promise<unknown>, unknown[]>(),
  fundEscrow: jest.fn<Promise<unknown>, unknown[]>(),
  releaseEscrow: jest.fn<Promise<unknown>, unknown[]>(),
  cancelEscrow: jest.fn<Promise<unknown>, unknown[]>(),

  // Convenience verification hook for tests (payment/tx verification)
  // Some tests may expect to toggle this result
  verifyTransaction: jest.fn<Promise<boolean>, unknown[]>(),
};

// Mock the real module that lives at apps/backend/src/blockchain/trustlessWork.ts
// so all consumers get our mocked behaviors
jest.mock('../../src/blockchain/trustlessWork', () => {
  const mock = mockedTrustlessWork;

  return {
    // Class constructor returns the mocked instance
    TrustlessWorkClient: jest.fn().mockImplementation(() => mock),

    // Named exports proxy to the mocked instance methods if referenced directly
    trustlessWorkClient: mock,
    createEscrow: (...args: unknown[]) => mock.createEscrow(...args),
    getEscrowStatus: (...args: unknown[]) => mock.getEscrowStatus(...args),
    fundEscrow: (...args: unknown[]) => mock.fundEscrow(...args),
    releaseEscrow: (...args: unknown[]) => mock.releaseEscrow(...args),
    cancelEscrow: (...args: unknown[]) => mock.cancelEscrow(...args),
  };
});

// Mock Soroban verification to avoid hitting Horizon/network in integration tests
export const mockedSoroban = {
  verifyStellarTransaction: jest.fn<Promise<boolean>, unknown[]>(),
};

jest.mock('../../src/blockchain/soroban', () => {
  const soroban = jest.requireActual('../../src/blockchain/soroban');
  const mock = mockedSoroban;
  return {
    __esModule: true,
    ...soroban,
    verifyStellarTransaction: (...args: unknown[]) => mock.verifyStellarTransaction(...args),
  };
});
