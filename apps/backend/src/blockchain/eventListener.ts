import { Contract, Networks, xdr } from '@stellar/stellar-sdk';
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
      const response = await fetch(`${this.config.rpcUrl}/getLatestLedger`);
      const data = await response.json();
      return data.sequence || 0;
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
      // Get transactions for the ledger
      const response = await fetch(`${this.config.rpcUrl}/getLedgerEntries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ledger: ledger,
          contractId: this.config.contractId,
        }),
      });

      const data = await response.json();

      if (!data.entries) {
        return [];
      }

      const events: BlockchainEvent[] = [];

      for (const entry of data.entries) {
        const event = await this.parseTransactionEvent(entry, ledger);
        if (event) {
          events.push(event);
        }
      }

      return events;
    } catch (error) {
      console.error(`Failed to get events from ledger ${ledger}:`, error);
      return [];
    }
  }

  /**
   * Parse transaction event from ledger entry
   */
  private async parseTransactionEvent(
    entry: Record<string, unknown>,
    ledger: number
  ): Promise<BlockchainEvent | null> {
    try {
      const entryData = entry;
      const txResultObj = entryData.txResult as Record<string, unknown> | undefined;
      if (!txResultObj || typeof txResultObj !== 'object' || !('result' in txResultObj))
        return null;
      const txResult = txResultObj.result as Record<string, unknown>;
      if (!this.isContractTransaction(txResult)) return null;
      const txHash = (entryData.txHash as string) ?? '';
      const events = this.parseContractEvents(txResult, txHash, ledger);
      return events.length > 0 ? events[0] : null;
    } catch (error) {
      console.error('Error parsing transaction event:', error);
      return null;
    }
  }

  /**
   * Check if transaction involves our contract
   */
  private isContractTransaction(txResult: Record<string, unknown>): boolean {
    try {
      const ops = txResult.operations;
      if (Array.isArray(ops)) {
        for (const op of ops) {
          if (
            typeof op === 'object' &&
            op !== null &&
            'contractId' in op &&
            (op as Record<string, unknown>).contractId === this.config.contractId
          ) {
            return true;
          }
        }
      }
      return false;
    } catch (error) {
      console.error('Error checking contract transaction:', error);
      return false;
    }
  }

  /**
   * Parse contract events from transaction result
   */
  private parseContractEvents(
    txResult: Record<string, unknown>,
    txHash: string,
    ledger: number
  ): BlockchainEvent[] {
    const events: BlockchainEvent[] = [];
    try {
      const eventArr = txResult.events;
      if (Array.isArray(eventArr)) {
        for (const event of eventArr) {
          if (typeof event === 'object' && event !== null) {
            const parsedEvent = this.parseEvent(event as Record<string, unknown>, txHash, ledger);
            if (parsedEvent) events.push(parsedEvent);
          }
        }
      }
      return events;
    } catch (error) {
      console.error('Error parsing contract events:', error);
      return [];
    }
  }

  /**
   * Parse individual event
   */
  private parseEvent(
    event: Record<string, unknown>,
    txHash: string,
    ledger: number
  ): BlockchainEvent | null {
    try {
      const eventType = this.determineEventType(event);
      if (!eventType) return null;
      // Type assertion for event.data
      const eventData = (event.data ?? {}) as Record<string, unknown>;
      return {
        id: `${txHash}-${(event as { index?: number }).index ?? 0}`,
        type: eventType as BlockchainEvent['type'],
        bookingId: eventData.booking_id ? String(eventData.booking_id) : '',
        propertyId: eventData.property_id ? String(eventData.property_id) : '',
        userId: eventData.user_id ? String(eventData.user_id) : '',
        timestamp: new Date(),
        blockHeight: ledger,
        transactionHash: txHash,
        data: eventData,
      };
    } catch (error) {
      console.error('Error parsing event:', error);
      return null;
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
