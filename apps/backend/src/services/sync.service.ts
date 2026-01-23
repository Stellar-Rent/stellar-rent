/**
 * Sync Service
 *
 * Provides blockchain synchronization capabilities for StellarRent.
 * Polls the Stellar network for new events and processes them accordingly.
 *
 * Environment Variables:
 * - SOROBAN_RPC_URL: Soroban RPC endpoint URL
 * - SOROBAN_CONTRACT_ID: Contract ID to monitor
 * - SOROBAN_NETWORK_PASSPHRASE: Network passphrase for validation
 * - SYNC_POLL_INTERVAL: Polling interval in milliseconds (default: 5000ms)
 *
 * Features:
 * - Configurable polling intervals
 * - Network passphrase validation
 * - Comprehensive error handling and logging
 * - Manual sync triggers
 * - Status monitoring and statistics
 */

import { Contract, Networks, nativeToScVal, scValToNative } from '@stellar/stellar-sdk';
import { Server as SorobanRpcServer } from '@stellar/stellar-sdk/lib/rpc';
import { supabase } from '../config/supabase';
import { SyncError } from '../types/errors';
import { bookingService } from './booking.service';
import { loggingService } from './logging.service';

export interface SyncEvent {
  id: string;
  type:
    | 'booking_created'
    | 'booking_updated'
    | 'booking_cancelled'
    | 'payment_confirmed'
    | 'property_created'
    | 'property_updated'
    | 'escrow_created'
    | 'escrow_released';
  bookingId?: string;
  propertyId?: string;
  userId: string;
  timestamp: Date;
  data: Record<string, unknown>;
  processed: boolean;
  error?: string;
}

export interface BlockchainEventData {
  escrow_id?: string;
  property_id?: string;
  user_id?: string;
  start_date?: number;
  end_date?: number;
  total_price?: number;
  deposit?: number;
  status?: string;
  guests?: number;
}

export interface SyncStatus {
  isRunning: boolean;
  lastSyncTime: Date | null;
  totalEventsProcessed: number;
  failedEvents: number;
  currentBlockHeight: number;
  lastProcessedBlock: number;
}

export class SyncService {
  private server: SorobanRpcServer;
  private contract: Contract;
  private networkPassphrase: string;
  private pollingInterval: number;
  private isRunning = false;
  private syncInterval: NodeJS.Timeout | null = null;
  private lastProcessedBlock = 0;
  private totalEventsProcessed = 0;
  private failedEvents = 0;
  private lastSyncTime: Date | null = null;

  constructor() {
    const rpcUrl = process.env.SOROBAN_RPC_URL;
    const contractId = process.env.SOROBAN_CONTRACT_ID;
    const networkPassphrase = process.env.SOROBAN_NETWORK_PASSPHRASE || Networks.TESTNET;

    // Validate required environment variables
    if (!rpcUrl || !contractId) {
      throw new Error('Missing required environment variables for sync service');
    }

    // Validate network passphrase
    if (!this.isValidNetworkPassphrase(networkPassphrase)) {
      throw new Error(
        `Invalid network passphrase: ${networkPassphrase}. Must be a valid Stellar network passphrase.`
      );
    }

    // Read and validate polling interval from environment
    this.pollingInterval = this.getPollingInterval();

    // Store network passphrase for future use
    this.networkPassphrase = networkPassphrase;

    // Initialize Soroban RPC server and contract
    this.server = new SorobanRpcServer(rpcUrl);
    this.contract = new Contract(contractId);

    // Log network configuration for verification
    console.log(
      `🌐 Sync service initialized for network: ${this.getNetworkName(networkPassphrase)}`
    );
    console.log(`🔗 RPC URL: ${rpcUrl}`);
    console.log(`📋 Contract ID: ${contractId}`);
    console.log(`⏱️  Polling interval: ${this.pollingInterval}ms`);
  }

  /**
   * Validate that the network passphrase is a valid Stellar network passphrase
   */
  private isValidNetworkPassphrase(passphrase: string): boolean {
    // Check if it's one of the known network passphrases
    if (
      passphrase === Networks.PUBLIC ||
      passphrase === Networks.TESTNET ||
      passphrase === Networks.FUTURENET
    ) {
      return true;
    }

    // For custom networks, validate the format
    // Stellar network passphrases typically end with a semicolon and date
    if (passphrase.includes(';') && passphrase.length > 20) {
      return true;
    }

    return false;
  }

  /**
   * Get a human-readable network name from the passphrase
   */
  private getNetworkName(passphrase: string): string {
    switch (passphrase) {
      case Networks.PUBLIC: {
        return 'Mainnet';
      }
      case Networks.TESTNET: {
        return 'Testnet';
      }
      case Networks.FUTURENET: {
        return 'Futurenet';
      }
      default: {
        // Extract network name from custom passphrase
        const parts = passphrase.split(';');
        if (parts.length >= 2) {
          return parts[0].trim();
        }
        return 'Custom Network';
      }
    }
  }

  /**
   * Get and validate the polling interval from environment variables
   */
  private getPollingInterval(): number {
    const envInterval = process.env.SYNC_POLL_INTERVAL;

    if (!envInterval) {
      console.log('ℹ️  No SYNC_POLL_INTERVAL set, using default: 5000ms');
      return 5000;
    }

    const parsedInterval = Number(envInterval);

    // Validate the parsed value
    if (Number.isNaN(parsedInterval) || parsedInterval < 1000 || parsedInterval > 300000) {
      console.warn(
        `⚠️  Invalid SYNC_POLL_INTERVAL value: ${envInterval}. Must be between 1000ms and 300000ms (5 minutes). Using default: 5000ms`
      );
      return 5000;
    }

    // Ensure the interval is reasonable for production use
    if (parsedInterval < 1000) {
      console.warn(
        `⚠️  SYNC_POLL_INTERVAL too low: ${parsedInterval}ms. Minimum recommended: 1000ms. Using default: 5000ms`
      );
      return 5000;
    }

    if (parsedInterval > 60000) {
      console.warn(
        `⚠️  SYNC_POLL_INTERVAL very high: ${parsedInterval}ms. This may cause delays in event processing.`
      );
    }

    console.log(`✅ Using configured polling interval: ${parsedInterval}ms`);
    return parsedInterval;
  }

  /**
   * Start the synchronization service
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('Sync service is already running');
      return;
    }

    try {
      console.log('Starting blockchain synchronization service...');

      // Initialize sync state
      await this.initializeSyncState();

      // Start polling for events
      this.isRunning = true;
      this.syncInterval = setInterval(async () => {
        await this.pollForEvents();
      }, this.pollingInterval); // Use configurable polling interval

      console.log(
        `Blockchain synchronization service started successfully (polling every ${this.pollingInterval}ms)`
      );
    } catch (error) {
      console.error('Failed to start sync service:', error);
      throw error;
    }
  }

  /**
   * Stop the synchronization service
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      console.log('Sync service is not running');
      return;
    }

    try {
      console.log('Stopping blockchain synchronization service...');

      this.isRunning = false;
      if (this.syncInterval) {
        clearInterval(this.syncInterval);
        this.syncInterval = null;
      }

      console.log('Blockchain synchronization service stopped successfully');
    } catch (error) {
      console.error('Failed to stop sync service:', error);
      throw error;
    }
  }

  /**
   * Get current sync status
   */
  getStatus(): SyncStatus {
    return {
      isRunning: this.isRunning,
      lastSyncTime: this.lastSyncTime,
      totalEventsProcessed: this.totalEventsProcessed,
      failedEvents: this.failedEvents,
      currentBlockHeight: 0, // Will be updated when we implement block height tracking
      lastProcessedBlock: this.lastProcessedBlock,
    };
  }

  /**
   * Get the current polling interval in milliseconds
   */
  getPollingIntervalMs(): number {
    return this.pollingInterval;
  }

  /**
   * Initialize sync state from database
   */
  private async initializeSyncState(): Promise<void> {
    try {
      // Get last processed block from database
      const { data: syncState } = await supabase.from('sync_state').select('*').single();

      if (syncState) {
        this.lastProcessedBlock = syncState.last_processed_block || 0;
        this.totalEventsProcessed = syncState.total_events_processed || 0;
        this.failedEvents = syncState.failed_events || 0;
        this.lastSyncTime = syncState.last_sync_time ? new Date(syncState.last_sync_time) : null;
      }

      console.log(`Initialized sync state: last block ${this.lastProcessedBlock}`);
    } catch (error) {
      console.warn('Could not initialize sync state, starting fresh:', error);
      this.lastProcessedBlock = 0;
      this.totalEventsProcessed = 0;
      this.failedEvents = 0;
      this.lastSyncTime = null;
    }
  }

  /**
   * Poll for new blockchain events
   */
  private async pollForEvents(): Promise<void> {
    if (!this.isRunning) return;

    try {
      const logId = await loggingService.logBlockchainOperation('pollForEvents', {});

      // Get current block height
      const currentBlockHeight = await this.getCurrentBlockHeight();

      // Process events from last processed block to current
      await this.processEventsFromBlock(this.lastProcessedBlock + 1, currentBlockHeight);

      // Update last processed block
      this.lastProcessedBlock = currentBlockHeight;
      this.lastSyncTime = new Date();

      // Update sync state in database
      await this.updateSyncState();

      loggingService.logBlockchainSuccess(logId, {
        processedBlock: currentBlockHeight,
        eventsProcessed: this.totalEventsProcessed,
      });
    } catch (error) {
      this.failedEvents++;

      // Log the error using loggingService for proper error serialization
      const errorLog = await loggingService.logBlockchainOperation('pollForEvents', {
        lastProcessedBlock: this.lastProcessedBlock,
      });
      await loggingService.logBlockchainError(errorLog, {
        error,
        context: 'Failed to poll for blockchain events',
      });

      // Re-throw as SyncError to propagate to callers
      throw new SyncError('Failed to poll for blockchain events', 'POLL_EVENTS_FAIL', error);
    }
  }

  /**
   * Get current block height from Stellar network
   */
  private async getCurrentBlockHeight(): Promise<number> {
    const maxRetries = Number.parseInt(process.env.SYNC_MAX_RETRIES || '3', 10);
    const retryDelay = Number.parseInt(process.env.SYNC_RETRY_DELAY || '1000', 10);

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const currentLedger = await this.server.getLatestLedger();
        return currentLedger.sequence || 0;
      } catch (error) {
        console.error(`Attempt ${attempt} failed to get current block height:`, error);
        if (attempt < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
        }
      }
    }

    console.warn('All retries failed. Returning last known block.');
    return this.lastProcessedBlock;
  }

  /**
   * Process events from a specific block range
   */
  private async processEventsFromBlock(fromBlock: number, toBlock: number): Promise<void> {
    if (fromBlock > toBlock) return;

    try {
      // Get contract events for the block range
      const events = await this.getContractEvents(fromBlock, toBlock);

      for (const event of events) {
        await this.processEvent(event);
        this.totalEventsProcessed++;
      }
    } catch (error) {
      console.error(`Error processing events from blocks ${fromBlock}-${toBlock}:`, error);
      throw error;
    }
  }

  /**
   * Get contract events from Stellar network
   */
  private async getContractEvents(
    fromBlock: number,
    toBlock: number
  ): Promise<Record<string, unknown>[]> {
    try {
      const contractId = process.env.SOROBAN_CONTRACT_ID;
      if (!contractId) {
        console.warn('No contract ID configured, skipping event polling');
        return [];
      }

      // Query events from Stellar network using RPC
      const eventsPromise = this.server.getEvents({
        startLedger: fromBlock,
        endLedger: toBlock,
        filters: [
          {
            type: 'contract',
            contractIds: [contractId],
          },
        ],
        limit: 100, // Process in batches
      });

      const eventsResponse = (await Promise.race([
        eventsPromise,
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Event query timeout')), 30000)
        ),
      ])) as { events?: unknown[] };

      const events = eventsResponse?.events || [];

      // Transform Stellar events into our format
      return events.map((event: unknown) => {
        const stellarEvent = event as {
          ledger: number;
          ledgerClosedAt: string;
          id: string;
          topic?: string[];
          value?: Record<string, unknown>;
          txHash: string;
          contractId: string;
        };

        return {
          id: `${stellarEvent.ledger}-${stellarEvent.ledgerClosedAt}-${stellarEvent.id}`,
          type: this.mapStellarEventType(stellarEvent.topic?.[0] || 'unknown'),
          blockNumber: stellarEvent.ledger,
          timestamp: new Date(stellarEvent.ledgerClosedAt),
          data: this.parseStellarEventData(stellarEvent),
          txHash: stellarEvent.txHash,
          contractId: stellarEvent.contractId,
        };
      });
    } catch (error) {
      // Log the error using loggingService
      const errorLog = await loggingService.logBlockchainOperation('getContractEvents', {
        fromBlock,
        toBlock,
      });
      await loggingService.logBlockchainError(errorLog, {
        error,
        context: 'Failed to query blockchain events',
      });

      // Re-throw as SyncError for proper error handling
      throw new SyncError('Failed to get contract events', 'GET_EVENTS_FAIL', {
        error,
        fromBlock,
        toBlock,
      });
    }
  }

  /**
   * Map Stellar event topic to our event types
   */
  private mapStellarEventType(topic: string): string {
    const eventMap: Record<string, string> = {
      booking_created: 'booking_created',
      booking_updated: 'booking_updated',
      booking_cancelled: 'booking_cancelled',
      payment_confirmed: 'payment_confirmed',
      property_created: 'property_created',
      property_updated: 'property_updated',
      escrow_created: 'escrow_created',
      escrow_released: 'escrow_released',
    };

    return eventMap[topic] || 'unknown';
  }

  /**
   * Parse Stellar event data into our format
   */
  private parseStellarEventData(event: {
    value?: Record<string, unknown>;
  }): BlockchainEventData {
    try {
      // Parse event data based on contract event structure
      const eventData = event.value || {};

      return {
        escrow_id: eventData.escrow_id as string,
        property_id: eventData.property_id as string,
        user_id: eventData.user_id as string,
        start_date: eventData.start_date ? Number(eventData.start_date) : undefined,
        end_date: eventData.end_date ? Number(eventData.end_date) : undefined,
        total_price: eventData.total_price ? Number(eventData.total_price) : undefined,
        deposit: eventData.deposit ? Number(eventData.deposit) : undefined,
        status: eventData.status as string,
        guests: eventData.guests ? Number(eventData.guests) : undefined,
      };
    } catch (error) {
      // Log parsing error but return empty object to allow sync to continue
      // This is intentionally not re-thrown as parsing failures shouldn't stop sync
      // Note: Using fire-and-forget logging since this method is synchronous
      loggingService
        .logBlockchainOperation('parseStellarEventData', {
          event: event.value,
        })
        .then((errorLog) => {
          loggingService.logBlockchainError(errorLog, {
            error,
            context: 'Failed to parse event data - returning empty object',
          });
        })
        .catch(() => {
          // Ignore logging failures to prevent cascading errors
        });
      return {};
    }
  }

  /**
   * Process a single blockchain event
   */
  private async processEvent(event: Record<string, unknown>): Promise<void> {
    try {
      const logId = await loggingService.logBlockchainOperation('processEvent', { event });

      // Store event in database for tracking
      await this.storeSyncEvent(event);

      // Process based on event type
      switch (event.type as string) {
        case 'booking_created':
          await this.handleBookingCreated(event);
          break;
        case 'booking_updated':
          await this.handleBookingUpdated(event);
          break;
        case 'booking_cancelled':
          await this.handleBookingCancelled(event);
          break;
        case 'payment_confirmed':
          await this.handlePaymentConfirmed(event);
          break;
        case 'property_created':
          await this.handlePropertyCreated(event);
          break;
        case 'property_updated':
          await this.handlePropertyUpdated(event);
          break;
        case 'escrow_created':
          await this.handleEscrowCreated(event);
          break;
        case 'escrow_released':
          await this.handleEscrowReleased(event);
          break;
        default:
          console.warn(`Unknown event type: ${event.type as string}`);
      }

      // Mark event as processed
      await this.markEventProcessed(event.id as string);

      await loggingService.logBlockchainSuccess(logId, {
        eventId: event.id as string,
      });
    } catch (error) {
      console.error(`Error processing event ${event.id as string}:`, error);
      await this.markEventFailed(event.id as string, error as Error);
      throw error;
    }
  }

  /**
   * Handle booking creation event
   */
  private async handleBookingCreated(event: Record<string, unknown>): Promise<void> {
    const eventData = event.data as BlockchainEventData;
    const { data: existingBooking } = await supabase
      .from('bookings')
      .select('*')
      .eq('escrow_address', eventData.escrow_id || '')
      .single();

    if (existingBooking) {
      // Update existing booking with blockchain data
      await supabase
        .from('bookings')
        .update({
          status: this.mapBlockchainStatus(eventData.status || ''),
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingBooking.id);
    } else {
      // Create new booking record
      await supabase.from('bookings').insert({
        property_id: eventData.property_id || '',
        user_id: eventData.user_id || '',
        dates: {
          from: new Date((eventData.start_date || 0) * 1000).toISOString(),
          to: new Date((eventData.end_date || 0) * 1000).toISOString(),
        },
        guests: eventData.guests || 1,
        total: eventData.total_price || 0,
        deposit: eventData.deposit || 0,
        escrow_address: eventData.escrow_id || '',
        status: this.mapBlockchainStatus(eventData.status || ''),
      });
    }
  }

  /**
   * Handle booking update event
   */
  private async handleBookingUpdated(event: Record<string, unknown>): Promise<void> {
    const eventData = event.data as BlockchainEventData;

    if (eventData.escrow_id && eventData.status) {
      // Use the enhanced booking service sync function
      try {
        await bookingService.syncBookingFromBlockchain(
          eventData.escrow_id,
          this.mapBlockchainStatus(eventData.status),
          eventData as unknown as Record<string, unknown>
        );
      } catch (error) {
        // Log and use fallback to direct database update
        const errorLog = await loggingService.logBlockchainOperation('handleBookingUpdated', {
          escrowId: eventData.escrow_id,
          status: eventData.status,
        });
        await loggingService.logBlockchainError(errorLog, {
          error,
          context: 'Failed to sync booking from blockchain event - using fallback',
        });
        // Fallback to direct database update
        await supabase
          .from('bookings')
          .update({
            status: this.mapBlockchainStatus(eventData.status),
            updated_at: new Date().toISOString(),
          })
          .eq('escrow_address', eventData.escrow_id);
      }
    }
  }

  /**
   * Handle booking cancellation event
   */
  private async handleBookingCancelled(event: Record<string, unknown>): Promise<void> {
    const eventData = event.data as BlockchainEventData;
    await supabase
      .from('bookings')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('escrow_address', eventData.escrow_id || '');
  }

  /**
   * Handle payment confirmation event
   */
  private async handlePaymentConfirmed(event: Record<string, unknown>): Promise<void> {
    const eventData = event.data as BlockchainEventData;
    await supabase
      .from('bookings')
      .update({
        status: 'confirmed',
        updated_at: new Date().toISOString(),
      })
      .eq('escrow_address', eventData.escrow_id || '');
  }

  /**
   * Handle property creation event
   */
  private async handlePropertyCreated(event: Record<string, unknown>): Promise<void> {
    const eventData = event.data as BlockchainEventData;

    // Log the event for audit purposes
    await supabase.from('sync_logs').insert({
      operation: 'handle_property_created',
      status: 'success',
      message: 'Property creation event processed from blockchain',
      data: {
        property_id: eventData.property_id,
        user_id: eventData.user_id,
        event_id: event.id,
      },
    });

    // Property should already exist in database from API call
    // This event confirms blockchain sync was successful
    console.log(`Property creation confirmed on blockchain: ${eventData.property_id}`);
  }

  /**
   * Handle property update event
   */
  private async handlePropertyUpdated(event: Record<string, unknown>): Promise<void> {
    const eventData = event.data as BlockchainEventData;

    // Log the event for audit purposes
    await supabase.from('sync_logs').insert({
      operation: 'handle_property_updated',
      status: 'success',
      message: 'Property update event processed from blockchain',
      data: {
        property_id: eventData.property_id,
        user_id: eventData.user_id,
        event_id: event.id,
      },
    });

    console.log(`Property update confirmed on blockchain: ${eventData.property_id}`);
  }

  /**
   * Handle escrow creation event
   */
  private async handleEscrowCreated(event: Record<string, unknown>): Promise<void> {
    const eventData = event.data as BlockchainEventData;

    // Update booking with escrow creation confirmation
    await supabase
      .from('bookings')
      .update({
        status: 'pending',
        updated_at: new Date().toISOString(),
      })
      .eq('escrow_address', eventData.escrow_id || '');

    // Log the event
    await supabase.from('sync_logs').insert({
      operation: 'handle_escrow_created',
      status: 'success',
      message: 'Escrow creation event processed from blockchain',
      data: {
        escrow_id: eventData.escrow_id,
        property_id: eventData.property_id,
        user_id: eventData.user_id,
        total_price: eventData.total_price,
      },
    });
  }

  /**
   * Handle escrow release event
   */
  private async handleEscrowReleased(event: Record<string, unknown>): Promise<void> {
    const eventData = event.data as BlockchainEventData;

    // Update booking to completed status when escrow is released
    await supabase
      .from('bookings')
      .update({
        status: 'completed',
        updated_at: new Date().toISOString(),
      })
      .eq('escrow_address', eventData.escrow_id || '');

    // Log the event
    await supabase.from('sync_logs').insert({
      operation: 'handle_escrow_released',
      status: 'success',
      message: 'Escrow release event processed from blockchain',
      data: {
        escrow_id: eventData.escrow_id,
        property_id: eventData.property_id,
        user_id: eventData.user_id,
      },
    });
  }

  /**
   * Map blockchain status to database status
   */
  private mapBlockchainStatus(blockchainStatus: string): string {
    const statusMap: Record<string, string> = {
      Pending: 'pending',
      Confirmed: 'confirmed',
      Completed: 'completed',
      Cancelled: 'cancelled',
    };
    return statusMap[blockchainStatus] || 'pending';
  }

  /**
   * Process sync event atomically using PostgreSQL RPC function
   * This ensures event logging, status updates, and marking as processed
   * all happen in a single transaction to prevent inconsistent states.
   */
  async processEventAtomic(
    eventId: string,
    eventType: string,
    bookingId: string | null,
    propertyId: string | null,
    userId: string,
    eventData: Record<string, unknown>,
    newStatus?: string
  ): Promise<{ success: boolean; syncEventId?: string; error?: string }> {
    const log = await loggingService.logBlockchainOperation('processEventAtomic', {
      eventId,
      eventType,
      bookingId,
      newStatus,
    });

    try {
      const { data, error } = await supabase.rpc('process_sync_event_atomic', {
        p_event_id: eventId,
        p_event_type: eventType,
        p_booking_id: bookingId,
        p_property_id: propertyId,
        p_user_id: userId,
        p_event_data: eventData,
        p_new_status: newStatus || null,
      });

      if (error) {
        await loggingService.logBlockchainError(log, { error, context: 'RPC call failed' });
        throw new SyncError('Failed to process event atomically', 'ATOMIC_PROCESS_FAIL', error);
      }

      if (!data.success) {
        if (data.error === 'DUPLICATE_EVENT') {
          // Duplicate events are not errors, just skip them
          await loggingService.logBlockchainSuccess(log, { skipped: true, reason: 'duplicate' });
          return { success: true, error: 'DUPLICATE_EVENT' };
        }
        throw new SyncError(`Atomic processing failed: ${data.error}`, data.error, data);
      }

      await loggingService.logBlockchainSuccess(log, { syncEventId: data.sync_event_id });
      return { success: true, syncEventId: data.sync_event_id };
    } catch (error) {
      if (error instanceof SyncError) {
        throw error;
      }
      await loggingService.logBlockchainError(log, { error, context: 'processEventAtomic' });
      throw new SyncError('Failed to process event atomically', 'ATOMIC_PROCESS_FAIL', error);
    }
  }

  /**
   * Store sync event in database
   */
  private async storeSyncEvent(event: Record<string, unknown>): Promise<void> {
    const eventData = event.data as BlockchainEventData;
    await supabase.from('sync_events').insert({
      event_id: event.id as string,
      event_type: event.type as string,
      booking_id: eventData.escrow_id || (event.bookingId as string) || null,
      property_id: eventData.property_id || (event.propertyId as string) || null,
      user_id: eventData.user_id || (event.userId as string),
      event_data: event.data,
      processed: false,
      created_at: new Date().toISOString(),
    });
  }

  /**
   * Mark event as processed
   */
  private async markEventProcessed(eventId: string): Promise<void> {
    await supabase
      .from('sync_events')
      .update({
        processed: true,
        processed_at: new Date().toISOString(),
      })
      .eq('event_id', eventId);
  }

  /**
   * Mark event as failed
   */
  private async markEventFailed(eventId: string, error: Error): Promise<void> {
    await supabase
      .from('sync_events')
      .update({
        processed: false,
        error: error.message,
        processed_at: new Date().toISOString(),
      })
      .eq('event_id', eventId);
  }

  /**
   * Update sync state in database
   */
  private async updateSyncState(): Promise<void> {
    const { error } = await supabase.from('sync_state').upsert({
      id: 1, // Single row for sync state
      last_processed_block: this.lastProcessedBlock,
      total_events_processed: this.totalEventsProcessed,
      failed_events: this.failedEvents,
      last_sync_time: this.lastSyncTime?.toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (error) {
      console.error('Failed to update sync state:', error);
    }
  }

  /**
   * Manual sync trigger
   */
  async triggerManualSync(): Promise<void> {
    console.log('Manual sync triggered');
    await this.pollForEvents();
  }

  /**
   * Get sync statistics
   */
  async getSyncStats(): Promise<Record<string, unknown>> {
    const { data: events } = await supabase
      .from('sync_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    const { data: failedEvents } = await supabase
      .from('sync_events')
      .select('*')
      .eq('processed', false)
      .not('error', 'is', null);

    return {
      totalEvents: events?.length || 0,
      failedEvents: failedEvents?.length || 0,
      lastEvent: events?.[0],
      status: this.getStatus(),
    };
  }
}

// Export singleton instance
export const syncService = new SyncService();
