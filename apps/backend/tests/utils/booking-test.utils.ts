import type {
  TestBooking,
  TestProperty,
  TestUser,
} from '../fixtures/booking.fixtures';
import {
  generateExpiredJWT,
  generateInvalidJWT,
  generateTestJWT,
} from '../fixtures/booking.fixtures';
import { createMockBlockchainServices } from '../mocks/blockchain-integration.mock';

// Mock Supabase client - Bun style
import { afterAll, afterEach, mock } from 'bun:test';

mock.module('../../src/config/supabase', () => ({
  supabase: {
    from: mock(() => ({
      select: mock(() => ({
        eq: mock(() => ({
          single: mock(() => Promise.resolve({ data: null, error: null })),
          then: mock((callback: any) => callback({ data: [], error: null })),
        })),
        in: mock(() => Promise.resolve({ data: [], error: null })),
        match: mock(() => ({
          single: mock(() => Promise.resolve({ data: null, error: null })),
        })),
        then: mock((callback: any) => callback({ data: [], error: null })),
      })),
      insert: mock(() => ({
        select: mock(() => ({
          single: mock(() => Promise.resolve({ data: [], error: null })),
        })),
        then: mock((callback: any) => callback({ data: [], error: null })),
      })),
      update: mock(() => ({
        eq: mock(() => Promise.resolve({ data: [], error: null })),
        then: mock((callback: any) => callback({ data: [], error: null })),
      })),
      delete: mock(() => ({
        eq: mock(() => Promise.resolve({ data: [], error: null })),
        in: mock(() => Promise.resolve({ data: [], error: null })),
        then: mock((callback: any) => callback({ data: [], error: null })),
      })),
      upsert: mock(() => ({
        eq: mock(() => Promise.resolve({ data: [], error: null })),
      })),
      then: mock((callback: any) => callback({ data: [], error: null })),
    })),
    auth: {
      getUser: mock(() =>
        Promise.resolve({
          data: { user: { id: 'test-user-id', email: 'test@example.com' } },
          error: null,
        })
      ),
    },
  },
}));

import { supabase } from '../../src/config/supabase';

export interface TestSetupOptions {
  mockBlockchain?: boolean;
  setupDatabase?: boolean;
  cleanupAfterEach?: boolean;
}

export class BookingTestUtils {
  private static instance: BookingTestUtils;
  private testData: {
    properties: TestProperty[];
    users: TestUser[];
    bookings: TestBooking[];
  } = {
    properties: [],
    users: [],
    bookings: [],
  };

  private constructor() {}

  static getInstance(): BookingTestUtils {
    if (!BookingTestUtils.instance) {
      BookingTestUtils.instance = new BookingTestUtils();
    }
    return BookingTestUtils.instance;
  }

  async setupTestEnvironment(options: TestSetupOptions = {}): Promise<void> {
    const {
      mockBlockchain = true,
      setupDatabase = true,
      cleanupAfterEach = true,
    } = options;

    if (mockBlockchain) {
      this.setupBlockchainMocks();
    }

    if (setupDatabase) {
      await this.setupTestDatabase();
    }

    if (cleanupAfterEach) {
      this.setupCleanupHooks();
    }
  }

  private setupBlockchainMocks(): void {
    const mockServices = createMockBlockchainServices({
      networkDelay: 50,
      failureRate: 0,
      timeoutEnabled: false,
    });

    // Mock the blockchain services in the booking service
    mock.module('../../src/blockchain/soroban', () => ({
      checkAvailability: mockServices.checkAvailability,
    }));

    mock.module('../../src/blockchain/trustlessWork', () => ({
      createEscrow: mockServices.createEscrow,
      cancelEscrow: mockServices.cancelEscrow,
      getEscrowStatus: mockServices.getEscrowStatus,
      fundEscrow: mockServices.fundEscrow,
      releaseEscrow: mockServices.releaseEscrow,
    }));
  }

  private async setupTestDatabase(): Promise<void> {
    // Insert test properties
    for (const property of this.testData.properties) {
      const { error } = await supabase
        .from('properties')
        .upsert(property, { onConflict: 'id' });

      if (error) {
        throw new Error(`Failed to insert test property: ${error.message}`);
      }
    }

    // Insert test users
    for (const user of this.testData.users) {
      const { error } = await supabase
        .from('users')
        .upsert(user, { onConflict: 'id' });

      if (error) {
        throw new Error(`Failed to insert test user: ${error.message}`);
      }
    }

    // Insert test bookings
    for (const booking of this.testData.bookings) {
      const { error } = await supabase
        .from('bookings')
        .upsert(booking, { onConflict: 'id' });

      if (error) {
        throw new Error(`Failed to insert test booking: ${error.message}`);
      }
    }
  }

  private setupCleanupHooks(): void {
    afterEach(async () => {
      await this.cleanupTestData();
    });

    afterAll(async () => {
      await this.cleanupTestData();
    });
  }

  async cleanupTestData(): Promise<void> {
    try {
      // Clean up test bookings
      const bookingIds = this.testData.bookings.map((b) => b.id);
      if (bookingIds.length > 0) {
        await supabase.from('bookings').delete().in('id', bookingIds);
      }

      // Clean up test properties
      const propertyIds = this.testData.properties.map((p) => p.id);
      if (propertyIds.length > 0) {
        await supabase.from('properties').delete().in('id', propertyIds);
      }

      // Clean up test users
      const userIds = this.testData.users.map((u) => u.id);
      if (userIds.length > 0) {
        await supabase.from('users').delete().in('id', userIds);
      }

      // Reset test data
      this.testData = { properties: [], users: [], bookings: [] };
    } catch (error) {
      console.error('Error during test cleanup:', error);
    }
  }

  addTestProperty(property: TestProperty): void {
    this.testData.properties.push(property);
  }

  addTestUser(user: TestUser): void {
    this.testData.users.push(user);
  }

  addTestBooking(booking: TestBooking): void {
    this.testData.bookings.push(booking);
  }

  generateAuthToken(userId: string, email: string): string {
    return generateTestJWT(userId, email);
  }

  generateExpiredToken(userId: string, email: string): string {
    return generateExpiredJWT(userId, email);
  }

  generateInvalidToken(): string {
    return generateInvalidJWT();
  }

  async simulateConcurrentRequests<T>(
    requestFn: () => Promise<T>,
    count = 2
  ): Promise<T[]> {
    const requests = Array.from({ length: count }, () => requestFn());
    return Promise.all(requests);
  }

  async simulateRaceCondition<T>(
    requestFn: () => Promise<T>,
    delayMs = 100
  ): Promise<T[]> {
    const delayedRequest = async (): Promise<T> => {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      return requestFn();
    };

    return Promise.all([requestFn(), delayedRequest()]);
  }

  async waitForDatabaseUpdate(
    table: string,
    condition: Record<string, unknown>,
    timeoutMs = 5000
  ): Promise<boolean> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutMs) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .match(condition)
        .single();

      if (data && !error) {
        return true;
      }

      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    return false;
  }

  async verifyBookingStatus(
    bookingId: string,
    expectedStatus: string,
    timeoutMs = 5000
  ): Promise<boolean> {
    return this.waitForDatabaseUpdate(
      'bookings',
      { id: bookingId, status: expectedStatus },
      timeoutMs
    );
  }

  async verifyEscrowAddress(
    bookingId: string,
    expectedEscrowAddress: string
  ): Promise<boolean> {
    const { data, error } = await supabase
      .from('bookings')
      .select('escrow_address')
      .eq('id', bookingId)
      .single();

    if (error || !data) {
      return false;
    }

    return data.escrow_address === expectedEscrowAddress;
  }

  async getBookingById(bookingId: string): Promise<TestBooking> {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (error) {
      throw new Error(`Failed to retrieve booking: ${error.message}`);
    }

    return data;
  }

  async createTestBooking(
    bookingData: Partial<TestBooking>
  ): Promise<TestBooking> {
    const defaultBooking: TestBooking = {
      id: `test-booking-${Date.now()}`,
      property_id: '550e8400-e29b-41d4-a716-446655440001',
      user_id: '550e8400-e29b-41d4-a716-446655440020',
      dates: {
        from: new Date(Date.now() + 86400000).toISOString(),
        to: new Date(Date.now() + 172800000).toISOString(),
      },
      guests: 2,
      total: 1000.0,
      deposit: 200.0,
      status: 'pending',
      escrow_address:
        'GABC123456789012345678901234567890123456789012345678901234567890',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const booking = { ...defaultBooking, ...bookingData };

    const { data, error } = await supabase
      .from('bookings')
      .insert(booking)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create test booking: ${error.message}`);
    }

    this.addTestBooking(booking);
    return data;
  }

  async deleteTestBooking(bookingId: string): Promise<void> {
    const { error } = await supabase
      .from('bookings')
      .delete()
      .eq('id', bookingId);

    if (error) {
      console.error('Failed to delete test booking:', error);
    }

    this.testData.bookings = this.testData.bookings.filter(
      (b) => b.id !== bookingId
    );
  }

  setupMockBlockchainFailure(
    failureType: 'availability' | 'escrow' | 'network'
  ): void {
    const mockServices = createMockBlockchainServices({
      networkDelay: 100,
      failureRate: 1.0, // Always fail
      timeoutEnabled: failureType === 'network',
    });

    if (failureType === 'availability') {
      mockServices.checkAvailability.mockRejectedValue(
        new Error('Soroban network error: Contract simulation failed')
      );
    } else if (failureType === 'escrow') {
      mockServices.createEscrow.mockRejectedValue(
        new Error('Trustless Work API error: Failed to create escrow')
      );
    }

    // Apply the mock services to override the actual blockchain service imports
    mock.module('../../src/blockchain/soroban', () => ({
      checkAvailability: mockServices.checkAvailability,
    }));

    mock.module('../../src/blockchain/trustlessWork', () => ({
      createEscrow: mockServices.createEscrow,
      cancelEscrow: mockServices.cancelEscrow,
      getEscrowStatus: mockServices.getEscrowStatus,
      fundEscrow: mockServices.fundEscrow,
      releaseEscrow: mockServices.releaseEscrow,
    }));
  }

  setupMockBlockchainSuccess(): void {
    const mockServices = createMockBlockchainServices({
      networkDelay: 50,
      failureRate: 0,
      timeoutEnabled: false,
    });

    // Apply the mock services to override the actual blockchain service imports
    mock.module('../../src/blockchain/soroban', () => ({
      checkAvailability: mockServices.checkAvailability,
    }));

    mock.module('../../src/blockchain/trustlessWork', () => ({
      createEscrow: mockServices.createEscrow,
      cancelEscrow: mockServices.cancelEscrow,
      getEscrowStatus: mockServices.getEscrowStatus,
      fundEscrow: mockServices.fundEscrow,
      releaseEscrow: mockServices.releaseEscrow,
    }));
  }

  resetBlockchainMocks(): void {
    // Bun doesn't need resetModules - mocks are isolated per test
    this.setupBlockchainMocks();
  }
}

export const bookingTestUtils = BookingTestUtils.getInstance();
