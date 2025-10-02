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
import { Server as SorobanRpcServer } from '@stellar/stellar-sdk/rpc';
import { supabase } from '../config/supabase';
import { loggingService } from './logging.service';

export interface SyncEvent {
  id: string;
  type: 'booking_created' | 'booking_updated' | 'booking_cancelled' | 'payment_confirmed';
  bookingId: string;
  propertyId: string;
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
      console.error('Error polling for events:', error);
      this.failedEvents++;
      loggingService.logBlockchainError('pollForEvents', error as Error);
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
          await new Promise(resolve => setTimeout(resolve, retryDelay));
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
      // This is a simplified implementation
      // In a real scenario, you'd query the Stellar network for contract events
      const contractId = process.env.SOROBAN_CONTRACT_ID;

      // For now, we'll return an empty array
      // TODO: Implement actual event querying from Stellar network
      return [];
    } catch (error) {
      console.error('Failed to get contract events:', error);
      return [];
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
        default:
          console.warn(`Unknown event type: ${event.type as string}`);
      }

      // Mark event as processed
      await this.markEventProcessed(event.id as string);

      await loggingService.logBlockchainSuccess(logId, { eventId: event.id as string });
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
    await supabase
      .from('bookings')
      .update({
        status: this.mapBlockchainStatus(eventData.status || ''),
        updated_at: new Date().toISOString(),
      })
      .eq('escrow_address', eventData.escrow_id || '');
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
   * Store sync event in database
   */
  private async storeSyncEvent(event: Record<string, unknown>): Promise<void> {
    await supabase.from('sync_events').insert({
      event_id: event.id as string,
      event_type: event.type as string,
      booking_id: event.bookingId as string,
      property_id: event.propertyId as string,
      user_id: event.userId as string,
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
