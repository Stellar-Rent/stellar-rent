declare global {
  var testUtils: {
    generateUUID: () => string;
    generateTransactionHash: () => string;
    generateEscrowAddress: () => string;
    waitForCondition: (condition: () => boolean, timeoutMs?: number) => Promise<boolean>;
    simulateDelay: (ms: number) => Promise<void>;
  };
  var fetch: jest.Mock;
}

export {};
