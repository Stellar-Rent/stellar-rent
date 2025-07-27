import type { AvailabilityRequest, AvailabilityResponse } from '../../src/blockchain/soroban';
import type { BookingEscrowParams } from '../../src/blockchain/trustlessWork';

export interface MockBlockchainConfig {
  networkDelay?: number;
  failureRate?: number;
  timeoutEnabled?: boolean;
}

export class MockBlockchainServices {
  private config: MockBlockchainConfig;
  private escrowCounter = 0;
  private transactionCounter = 0;

  constructor(config: MockBlockchainConfig = {}) {
    this.config = {
      networkDelay: 100,
      failureRate: 0.1,
      timeoutEnabled: false,
      ...config,
    };
  }

  private async simulateNetworkDelay(): Promise<void> {
    if (this.config.networkDelay) {
      await new Promise((resolve) => setTimeout(resolve, this.config.networkDelay));
    }
  }

  private shouldFail(): boolean {
    return Math.random() < (this.config.failureRate || 0);
  }

  private generateEscrowAddress(): string {
    this.escrowCounter++;
    return `G${this.generateRandomString(55)}`;
  }

  private generateTransactionHash(): string {
    this.transactionCounter++;
    return `txn_${this.generateRandomString(64)}`;
  }

  private generateRandomString(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    return Array.from({ length }, () =>
      chars.charAt(Math.floor(Math.random() * chars.length))
    ).join('');
  }

  async checkAvailability(request: AvailabilityRequest): Promise<AvailabilityResponse> {
    await this.simulateNetworkDelay();

    if (this.shouldFail()) {
      throw new Error('Soroban network error: Contract simulation failed');
    }

    if (this.config.timeoutEnabled) {
      throw new Error('Soroban timeout: Transaction simulation exceeded time limit');
    }

    // Simulate realistic availability logic
    const { propertyId, dates } = request;
    const startDate = dates.from.getTime();
    const endDate = dates.to.getTime();

    // Mock conflicting bookings for specific scenarios
    const conflictingBookings = this.getMockConflictingBookings(propertyId, startDate, endDate);

    return {
      isAvailable: conflictingBookings.length === 0,
      conflictingBookings,
    };
  }

  async createEscrow(params: BookingEscrowParams): Promise<string> {
    await this.simulateNetworkDelay();

    if (this.shouldFail()) {
      throw new Error('Trustless Work API error: Failed to create escrow');
    }

    if (params.totalAmount <= 0) {
      throw new Error('Invalid escrow amount: Amount must be greater than zero');
    }

    if (params.depositAmount > params.totalAmount) {
      throw new Error('Invalid deposit: Deposit cannot exceed total amount');
    }

    return this.generateEscrowAddress();
  }

  async cancelEscrow(escrowAddress: string): Promise<void> {
    await this.simulateNetworkDelay();

    if (!escrowAddress || escrowAddress.length !== 56 || !escrowAddress.startsWith('G')) {
      throw new Error('Invalid escrow address provided');
    }

    if (this.shouldFail()) {
      throw new Error('Trustless Work API error: Failed to cancel escrow');
    }

    // Simulate successful cancellation
    return Promise.resolve();
  }

  async getEscrowStatus(escrowId: string): Promise<{
    escrowId: string;
    status: string;
    amount: string;
    funded: string;
    buyer: string;
    seller: string;
    createdAt: string;
    updatedAt: string;
  }> {
    await this.simulateNetworkDelay();

    if (this.shouldFail()) {
      throw new Error('Trustless Work API error: Failed to retrieve escrow status');
    }

    return {
      escrowId,
      status: 'funded',
      amount: '1000000000',
      funded: '1000000000',
      buyer: 'GABC123456789',
      seller: 'GDEF987654321',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  async fundEscrow(
    escrowId: string,
    amount: string
  ): Promise<{ success: boolean; txHash?: string }> {
    await this.simulateNetworkDelay();

    if (this.shouldFail()) {
      throw new Error('Trustless Work API error: Failed to fund escrow');
    }

    return {
      success: true,
      txHash: this.generateTransactionHash(),
    };
  }

  async releaseEscrow(
    escrowId: string,
    amount: string
  ): Promise<{ success: boolean; txHash?: string }> {
    await this.simulateNetworkDelay();

    if (this.shouldFail()) {
      throw new Error('Trustless Work API error: Failed to release escrow');
    }

    return {
      success: true,
      txHash: this.generateTransactionHash(),
    };
  }

  private getMockConflictingBookings(
    propertyId: string,
    startDate: number,
    endDate: number
  ): Array<{
    bookingId: string;
    dates: { from: Date; to: Date };
  }> {
    // Simulate specific conflict scenarios
    if (propertyId === 'conflict-property-123') {
      return [
        {
          bookingId: 'conflict-booking-456',
          dates: {
            from: new Date(startDate - 86400000), // 1 day before
            to: new Date(startDate + 86400000), // 1 day after
          },
        },
      ];
    }

    if (propertyId === 'double-conflict-property-789') {
      return [
        {
          bookingId: 'conflict-booking-001',
          dates: {
            from: new Date(startDate),
            to: new Date(endDate),
          },
        },
        {
          bookingId: 'conflict-booking-002',
          dates: {
            from: new Date(startDate - 43200000), // 12 hours before
            to: new Date(startDate + 43200000), // 12 hours after
          },
        },
      ];
    }

    return [];
  }
}

export const createMockBlockchainServices = (config?: MockBlockchainConfig) => {
  const mockServices = new MockBlockchainServices(config);

  return {
    checkAvailability: jest
      .fn()
      .mockImplementation((request: AvailabilityRequest) =>
        mockServices.checkAvailability(request)
      ),
    createEscrow: jest
      .fn()
      .mockImplementation((params: BookingEscrowParams) => mockServices.createEscrow(params)),
    cancelEscrow: jest
      .fn()
      .mockImplementation((escrowAddress: string) => mockServices.cancelEscrow(escrowAddress)),
    getEscrowStatus: jest
      .fn()
      .mockImplementation((escrowId: string) => mockServices.getEscrowStatus(escrowId)),
    fundEscrow: jest
      .fn()
      .mockImplementation((escrowId: string, amount: string) =>
        mockServices.fundEscrow(escrowId, amount)
      ),
    releaseEscrow: jest
      .fn()
      .mockImplementation((escrowId: string, amount: string) =>
        mockServices.releaseEscrow(escrowId, amount)
      ),
  };
};

export const mockBlockchainServices = createMockBlockchainServices();
