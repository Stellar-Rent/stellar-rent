import { Contract, Networks, rpc, xdr } from '@stellar/stellar-sdk';
import { Server as SorobanRpcServer } from '@stellar/stellar-sdk/rpc';
import { supabase } from '../config/supabase';
import { loggingService } from '../services/logging.service';

export interface BlockchainEvent {
  id: string;
  type: 'booking_created' | 'booking_updated' | 'booking_cancelled' | 'payment_confirmed';
  bookingId: string;
  propertyId: string;
  userId: string;
  timestamp: Date;
  blockHeight: number;
  transactionHash: string;
  data: Record<string, unknown>;
}

export interface EventListenerConfig {
  rpcUrl: string;
  contractId: string;
  networkPassphrase: string;
  pollInterval: number;
  maxRetries: number;
  retryDelay: number;
}

export class BlockchainEventListener {
  private server: SorobanRpcServer;
  private contract: Contract;
  private config: EventListenerConfig;
  private isRunning = false;
  private pollInterval: NodeJS.Timeout | null = null;
  private lastProcessedLedger = 0;
  private retryCount = 0;
  private eventCallbacks: Map<string, (event: BlockchainEvent) => Promise<void>> = new Map();

  constructor(config: EventListenerConfig) {
    this.config = config;
    this.server = new SorobanRpcServer(config.rpcUrl);
    this.contract = new Contract(config.contractId);
  }

  /**
   * Start listening for blockchain events
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('Event listener is already running');
      return;
    }

    try {
      console.log('Starting blockchain event listener...');

      // Initialize last processed ledger
      await this.initializeLastProcessedLedger();

      this.isRunning = true;
      this.pollInterval = setInterval(async () => {
        await this.pollForEvents();
      }, this.config.pollInterval);

      console.log('Blockchain event listener started successfully');
    } catch (error) {
      console.error('Failed to start event listener:', error);
      throw error;
    }
  }

  /**
   * Stop listening for blockchain events
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      console.log('Event listener is not running');
      return;
    }

    try {
      console.log('Stopping blockchain event listener...');

      this.isRunning = false;
      if (this.pollInterval) {
        clearInterval(this.pollInterval);
        this.pollInterval = null;
      }

      console.log('Blockchain event listener stopped successfully');
    } catch (error) {
      console.error('Failed to stop event listener:', error);
      throw error;
    }
  }

  /**
   * Register event callback
   */
  on(eventType: string, callback: (event: BlockchainEvent) => Promise<void>): void {
    this.eventCallbacks.set(eventType, callback);
  }

  /**
   * Initialize last processed ledger from database
   */
  private async initializeLastProcessedLedger(): Promise<void> {
    try {
      const { data: syncState } = await supabase
        .from('sync_state')
        .select('last_processed_block')
        .single();

      if (syncState?.last_processed_block) {
        this.lastProcessedLedger = syncState.last_processed_block;
      } else {
        // Get current ledger if no sync state exists
        this.lastProcessedLedger = await this.getCurrentLedger();
      }

      console.log(`Initialized event listener at ledger ${this.lastProcessedLedger}`);
    } catch (error) {
      console.warn('Could not initialize last processed ledger, starting from current:', error);
      this.lastProcessedLedger = await this.getCurrentLedger();
    }
  }

  /**
   * Get current ledger sequence
   */
  private async getCurrentLedger(): Promise<number> {
    try {
      const ledgerInfo = await this.server.getLatestLedger();
      return ledgerInfo.sequence || 0;
    } catch (error) {
      console.error('Failed to get current ledger:', error);
      return this.lastProcessedLedger;
    }
  }

  /**
   * Poll for new events
   */
  private async pollForEvents(): Promise<void> {
    if (!this.isRunning) return;

    try {
      const currentLedger = await this.getCurrentLedger();

      if (currentLedger > this.lastProcessedLedger) {
        await this.processLedgers(this.lastProcessedLedger + 1, currentLedger);
        this.lastProcessedLedger = currentLedger;
        this.retryCount = 0; // Reset retry count on success
      }
    } catch (error) {
      console.error('Error polling for events:', error);
      this.retryCount++;

      if (this.retryCount >= this.config.maxRetries) {
        console.error(`Max retries (${this.config.maxRetries}) reached, stopping event listener`);
        await this.stop();
      } else {
        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, this.config.retryDelay));
      }
    }
  }

  /**
   * Process events from a range of ledgers
   */
  private async processLedgers(fromLedger: number, toLedger: number): Promise<void> {
    for (let ledger = fromLedger; ledger <= toLedger; ledger++) {
      try {
        const events = await this.getEventsFromLedger(ledger);

        for (const event of events) {
          await this.processEvent(event);
        }
      } catch (error) {
        console.error(`Error processing ledger ${ledger}:`, error);
        // Continue with next ledger instead of failing completely
      }
    }
  }

  /**
   * Get events from a specific ledger
   */
  private async getEventsFromLedger(ledger: number): Promise<BlockchainEvent[]> {
    try {
      // Get events from the ledger using Soroban RPC client
      const eventsResponse = await this.server.getEvents({
        startLedger: ledger,
        endLedger: ledger,
        filters: [
          {
            type: 'contract',
            contractIds: [this.config.contractId],
          },
        ],
      });

      if (!eventsResponse.events || eventsResponse.events.length === 0) {
        return [];
      }

      const events: BlockchainEvent[] = [];

      for (const event of eventsResponse.events) {
        const parsedEvent = this.parseSorobanEvent(
          event as unknown as Record<string, unknown>,
          ledger
        );
        if (parsedEvent) {
          events.push(parsedEvent);
        }
      }

      return events;
    } catch (error) {
      console.error(`Failed to get events from ledger ${ledger}:`, error);
      return [];
    }
  }

  /**
   * Parse Soroban RPC event
   */
  private parseSorobanEvent(
    event: Record<string, unknown>,
    ledger: number
  ): BlockchainEvent | null {
    try {
      // Extract event data from Soroban RPC event format
      const eventType = this.determineEventType(event);
      if (!eventType) return null;

      // Parse event data from the Soroban event format
      const eventData = this.parseSorobanEventData(event);

      return {
        id: `${String(event.txHash || 'unknown')}-${event.index || 0}`,
        type: eventType as BlockchainEvent['type'],
        bookingId: String(eventData.booking_id || ''),
        propertyId: String(eventData.property_id || ''),
        userId: String(eventData.user_id || ''),
        timestamp: new Date(),
        blockHeight: ledger,
        transactionHash: String(event.txHash || 'unknown'),
        data: eventData,
      };
    } catch (error) {
      console.error('Error parsing Soroban event:', error);
      return null;
    }
  }

  /**
   * Parse Soroban event data from the event payload
   */
  private parseSorobanEventData(event: Record<string, unknown>): Record<string, unknown> {
    try {
      // Soroban events typically have a 'value' field containing the event data
      if (event.value && typeof event.value === 'object') {
        return event.value as Record<string, unknown>;
      }

      // Fallback to parsing from event.data if available
      if (event.data && typeof event.data === 'object') {
        return event.data as Record<string, unknown>;
      }

      // Return empty object if no data found
      return {};
    } catch (error) {
      console.error('Error parsing Soroban event data:', error);
      return {};
    }
  }

  /**
   * Determine event type from event data
   */
  private determineEventType(event: Record<string, unknown>): string | null {
    try {
      const eventName = (event.name ?? event.type) as string | undefined;
      switch (eventName) {
        case 'BookingCreated':
          return 'booking_created';
        case 'BookingUpdated':
          return 'booking_updated';
        case 'BookingCancelled':
          return 'booking_cancelled';
        case 'PaymentConfirmed':
          return 'payment_confirmed';
        default:
          return null;
      }
    } catch (error) {
      console.error('Error determining event type:', error);
      return null;
    }
  }

  /**
   * Process a single blockchain event
   */
  private async processEvent(event: BlockchainEvent): Promise<void> {
    try {
      const logId = await loggingService.logBlockchainOperation('processEvent', { event });

      // Store event in database
      await this.storeEvent(event);

      // Call registered callbacks
      const callback = this.eventCallbacks.get(event.type);
      if (callback) {
        await callback(event);
      }

      // Log success
      await loggingService.logBlockchainSuccess(logId, { eventId: event.id });
    } catch (error) {
      console.error(`Error processing event ${event.id}:`, error);
      await this.markEventFailed(event.id, error as Error);
      loggingService.logBlockchainError('processEvent', error as Error);
    }
  }

  /**
   * Store event in database
   */
  private async storeEvent(event: BlockchainEvent): Promise<void> {
    await supabase.from('sync_events').insert({
      event_id: event.id,
      event_type: event.type,
      booking_id: event.bookingId,
      property_id: event.propertyId,
      user_id: event.userId,
      event_data: {
        ...event.data,
        blockHeight: event.blockHeight,
        transactionHash: event.transactionHash,
        timestamp: event.timestamp.toISOString(),
      },
      processed: false,
      created_at: new Date().toISOString(),
    });
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
   * Get current status
   */
  getStatus(): {
    isRunning: boolean;
    lastProcessedLedger: number;
    retryCount: number;
    config: EventListenerConfig;
  } {
    return {
      isRunning: this.isRunning,
      lastProcessedLedger: this.lastProcessedLedger,
      retryCount: this.retryCount,
      config: this.config,
    };
  }
}

// Export factory function to create event listener
export function createEventListener(config: EventListenerConfig): BlockchainEventListener {
  return new BlockchainEventListener(config);
}
