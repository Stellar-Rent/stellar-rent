import { StrKey } from '@stellar/stellar-sdk';
import {
  cancelBookingOnChain,
  checkBookingAvailability,
  createBookingOnChain,
  updateBookingStatusOnChain,
} from '../blockchain/bookingContract';
import { checkAvailability } from '../blockchain/soroban';
import {
  type BookingEscrowParams,
  createEscrow,
  trustlessWorkClient,
} from '../blockchain/trustlessWork';
import { supabase } from '../config/supabase';
import { loggingService } from '../services/logging.service';
import { getPropertyById } from '../services/property.service';
import type { Booking, ConflictingBooking, CreateBookingInput } from '../types/booking.types';
import { BookingError } from '../types/common.types';

export interface BlockchainServices {
  checkAvailability: (request: {
    propertyId: string;
    dates: { from: Date; to: Date };
  }) => Promise<{
    isAvailable: boolean;
    conflictingBookings?: Array<ConflictingBooking>;
  }>;
  createEscrow: (params: BookingEscrowParams) => Promise<string>;
  cancelEscrow: (escrowAddress: string) => Promise<void>;
}

export class BookingService {
  constructor(private readonly blockchainServices: BlockchainServices) {}

  async createBooking(input: CreateBookingInput) {
    // Start logging blockchain operation
    const log = await loggingService.logBlockchainOperation('createBooking', input);

    try {
      // Generate unique booking ID upfront
      const bookingId = crypto.randomUUID();

      // 1. Fetch property details and seller info
      const propertyResult = await getPropertyById(input.propertyId);
      if (!propertyResult.success || !propertyResult.data) {
        throw new BookingError('Property not found', 'PROPERTY_NOT_FOUND');
      }

      // Fetch seller's Stellar address
      const { data: sellerProfile, error: sellerError } = await supabase
        .from('profiles')
        .select('stellar_address')
        .eq('id', propertyResult.data.ownerId)
        .single();

      if (sellerError || !sellerProfile?.stellar_address) {
        throw new BookingError(
          'Property owner wallet address not found',
          'SELLER_WALLET_NOT_FOUND'
        );
      }

      // Fetch buyer's Stellar address
      const { data: buyerProfile, error: buyerError } = await supabase
        .from('profiles')
        .select('stellar_address')
        .eq('id', input.userId)
        .single();

      if (buyerError || !buyerProfile?.stellar_address) {
        throw new BookingError(
          'Buyer wallet address not found. Please connect a Stellar wallet to your account.',
          'BUYER_WALLET_NOT_FOUND'
        );
      }

      // Validate Stellar addresses
      if (!StrKey.isValidEd25519PublicKey(buyerProfile.stellar_address)) {
        throw new BookingError('Invalid buyer Stellar wallet address', 'INVALID_BUYER_WALLET');
      }

      if (!StrKey.isValidEd25519PublicKey(sellerProfile.stellar_address)) {
        throw new BookingError('Invalid seller Stellar wallet address', 'INVALID_SELLER_WALLET');
      }

      // 2. Check property availability using existing soroban utility
      const availabilityResult = await this.blockchainServices.checkAvailability({
        propertyId: input.propertyId,
        dates: {
          from: input.dates.from,
          to: input.dates.to,
        },
      });

      if (!availabilityResult.isAvailable) {
        throw new BookingError(
          'Property is not available for the selected dates',
          'UNAVAILABLE',
          availabilityResult.conflictingBookings
        );
      }

      // 3. Create escrow with complete parameters
      const escrowAddress = await this.blockchainServices.createEscrow({
        bookingId,
        buyerAddress: buyerProfile.stellar_address,
        sellerAddress: sellerProfile.stellar_address,
        propertyId: input.propertyId,
        propertyTitle: propertyResult.data.title,
        totalAmount: input.total,
        depositAmount: input.deposit,
        dates: {
          from: input.dates.from,
          to: input.dates.to,
        },
        guests: input.guests,
      });

      // 4. Create booking on blockchain
      let blockchainBookingId: string;
      try {
        blockchainBookingId = await createBookingOnChain(
          input.propertyId,
          input.userId,
          Math.floor(input.dates.from.getTime() / 1000),
          Math.floor(input.dates.to.getTime() / 1000),
          input.total.toString(),
          input.guests
        );
      } catch (blockchainError) {
        // Rollback escrow if blockchain booking fails
        try {
          await this.blockchainServices.cancelEscrow(escrowAddress);
        } catch (rollbackError) {
          await loggingService.logBlockchainError(log, {
            error: rollbackError,
            context: 'Failed to rollback escrow after blockchain booking error',
            originalError: blockchainError,
          });
        }
        throw new BookingError(
          'Failed to create booking on blockchain',
          'BLOCKCHAIN_FAIL',
          blockchainError
        );
      }

      // 5. Create booking record in database
      const { data: booking, error: dbError } = await supabase
        .from('bookings')
        .insert({
          property_id: input.propertyId,
          user_id: input.userId,
          dates: {
            from: input.dates.from.toISOString(),
            to: input.dates.to.toISOString(),
          },
          guests: input.guests,
          total: input.total,
          deposit: input.deposit,
          escrow_address: escrowAddress,
          blockchain_booking_id: blockchainBookingId,
          status: 'pending',
        })
        .select()
        .single();

      if (dbError || !booking) {
        // Rollback both escrow and blockchain booking if database fails
        try {
          await Promise.all([
            this.blockchainServices.cancelEscrow(escrowAddress),
            cancelBookingOnChain(input.propertyId, blockchainBookingId, input.userId),
          ]);
        } catch (rollbackError) {
          await loggingService.logBlockchainError(log, {
            error: rollbackError,
            context: 'Failed to rollback escrow and blockchain booking after database error',
            originalError: dbError,
          });
        }
        throw new BookingError('Failed to create booking record', 'DB_FAIL', dbError);
      }

      // Log successful operation
      await loggingService.logBlockchainSuccess(log, {
        booking,
        escrowAddress,
      });

      return {
        bookingId: booking.id,
        escrowAddress,
        status: booking.status,
      };
    } catch (error) {
      if (error instanceof BookingError) {
        throw error;
      }

      // Log and rethrow unexpected errors
      await loggingService.logBlockchainError(log, error);
      throw new BookingError('Failed to create booking', 'CREATE_FAIL', error);
    }
  }

  async cancelBooking(
    bookingId: string,
    userId: string
  ): Promise<{ success: boolean; message: string }> {
    const log = await loggingService.logBlockchainOperation('cancelBooking', {
      bookingId,
      userId,
    });

    try {
      // Get booking details from database
      const { data: booking, error: fetchError } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .single();

      if (fetchError || !booking) {
        throw new BookingError('Booking not found', 'NOT_FOUND', fetchError);
      }

      // Check authorization
      if (booking.user_id !== userId) {
        throw new BookingError('Unauthorized to cancel this booking', 'UNAUTHORIZED');
      }

      // Check if booking can be cancelled
      if (booking.status === 'cancelled' || booking.status === 'completed') {
        throw new BookingError(
          `Cannot cancel booking with status: ${booking.status}`,
          'INVALID_STATUS'
        );
      }

      // Cancel booking on blockchain
      try {
        if (booking.blockchain_booking_id) {
          await cancelBookingOnChain(booking.property_id, booking.blockchain_booking_id, userId);
        }
      } catch (blockchainError) {
        console.error('Blockchain cancellation failed:', blockchainError);
        await loggingService.logBlockchainError(log, {
          error: blockchainError,
          context: 'Blockchain cancellation failed but continuing with database update',
        });
      }

      // Cancel escrow if it exists
      if (booking.escrow_address) {
        try {
          await this.blockchainServices.cancelEscrow(booking.escrow_address);
        } catch (escrowError) {
          console.error('Escrow cancellation failed:', escrowError);
          await loggingService.logBlockchainError(log, {
            error: escrowError,
            context: 'Escrow cancellation failed',
          });
        }
      }

      // Update booking status in database
      const { data: updatedBooking, error: updateError } = await supabase
        .from('bookings')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', bookingId)
        .select()
        .single();

      if (updateError) {
        throw new BookingError('Failed to update booking status', 'DB_UPDATE_FAIL', updateError);
      }

      await loggingService.logBlockchainSuccess(log, {
        booking: updatedBooking,
      });

      return {
        success: true,
        message: 'Booking cancelled successfully',
      };
    } catch (error) {
      if (error instanceof BookingError) {
        throw error;
      }

      await loggingService.logBlockchainError(log, error);
      throw new BookingError('Failed to cancel booking', 'CANCEL_FAIL', error);
    }
  }

  async updateBookingStatus(
    bookingId: string,
    newStatus: string,
    requestorId: string
  ): Promise<{ success: boolean; booking: Booking }> {
    const log = await loggingService.logBlockchainOperation('updateBookingStatus', {
      bookingId,
      newStatus,
      requestorId,
    });

    try {
      // Get booking details
      const { data: booking, error: fetchError } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .single();

      if (fetchError || !booking) {
        throw new BookingError('Booking not found', 'NOT_FOUND', fetchError);
      }

      // Update status on blockchain if blockchain booking exists
      if (booking.blockchain_booking_id) {
        try {
          await updateBookingStatusOnChain(
            booking.property_id,
            booking.blockchain_booking_id,
            newStatus,
            requestorId
          );
        } catch (blockchainError) {
          console.error('Blockchain status update failed:', blockchainError);
          await loggingService.logBlockchainError(log, {
            error: blockchainError,
            context: 'Blockchain status update failed',
          });
        }
      }

      // Update status in database
      const { data: updatedBooking, error: updateError } = await supabase
        .from('bookings')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', bookingId)
        .select()
        .single();

      if (updateError) {
        throw new BookingError('Failed to update booking status', 'DB_UPDATE_FAIL', updateError);
      }

      await loggingService.logBlockchainSuccess(log, {
        booking: updatedBooking,
      });

      return {
        success: true,
        booking: updatedBooking,
      };
    } catch (error) {
      if (error instanceof BookingError) {
        throw error;
      }

      await loggingService.logBlockchainError(log, error);
      throw new BookingError('Failed to update booking status', 'STATUS_UPDATE_FAIL', error);
    }
  }

  /**
   * Sync booking status from blockchain event
   */
  async syncBookingFromBlockchain(
    blockchainBookingId: string,
    newStatus: string,
    eventData?: Record<string, unknown>
  ): Promise<{ success: boolean; booking?: Booking }> {
    const log = await loggingService.logBlockchainOperation('syncBookingFromBlockchain', {
      blockchainBookingId,
      newStatus,
      eventData,
    });

    try {
      // Find booking by blockchain ID
      const { data: booking, error: fetchError } = await supabase
        .from('bookings')
        .select('*')
        .eq('blockchain_booking_id', blockchainBookingId)
        .single();

      if (fetchError || !booking) {
        await loggingService.logBlockchainError(log, {
          error: new Error('Booking not found for blockchain ID'),
          context: { blockchainBookingId },
        });
        return { success: false };
      }

      // Only update if status actually changed
      if (booking.status === newStatus) {
        await loggingService.logBlockchainSuccess(log, {
          message: 'Status already up to date',
          booking: booking.id,
        });
        return { success: true, booking };
      }

      // Update booking status
      const { data: updatedBooking, error: updateError } = await supabase
        .from('bookings')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', booking.id)
        .select()
        .single();

      if (updateError) {
        throw new BookingError(
          'Failed to update booking from blockchain event',
          'DB_UPDATE_FAIL',
          updateError
        );
      }

      // Log successful sync
      await supabase.from('sync_logs').insert({
        operation: 'booking_status_synced',
        status: 'success',
        message: 'Booking status synced from blockchain event',
        data: {
          booking_id: booking.id,
          blockchain_booking_id: blockchainBookingId,
          old_status: booking.status,
          new_status: newStatus,
          event_data: eventData,
        },
      });

      await loggingService.logBlockchainSuccess(log, {
        booking: updatedBooking,
      });

      return { success: true, booking: updatedBooking };
    } catch (error) {
      if (error instanceof BookingError) {
        throw error;
      }

      await loggingService.logBlockchainError(log, error);
      throw new BookingError('Failed to sync booking from blockchain', 'SYNC_FAIL', error);
    }
  }
}

// Implementation of BlockchainServices following codebase patterns
const blockchainServices: BlockchainServices = {
  async checkAvailability(request: {
    propertyId: string;
    dates: { from: Date; to: Date };
  }) {
    try {
      // Use existing availability check utility
      const availabilityResult = await checkAvailability({
        propertyId: request.propertyId,
        dates: request.dates,
      });

      return availabilityResult;
    } catch (error) {
      console.error('Availability check failed:', error);
      throw new BookingError(
        'Failed to check property availability',
        'AVAILABILITY_CHECK_FAIL',
        error
      );
    }
  },

  async createEscrow(params: BookingEscrowParams): Promise<string> {
    try {
      // Validate required parameters
      if (!params.bookingId || !params.buyerAddress || !params.sellerAddress) {
        throw new Error('Missing required escrow parameters');
      }

      const escrowAddress = await createEscrow(params);
      return escrowAddress;
    } catch (error) {
      console.error('Escrow creation failed:', error);
      throw new BookingError('Failed to create booking escrow', 'ESCROW_CREATE_FAIL', error);
    }
  },

  async cancelEscrow(escrowAddress: string): Promise<void> {
    try {
      await trustlessWorkClient.cancelEscrow(escrowAddress, 'Booking cancelled');
    } catch (error) {
      console.error('Escrow cancellation failed:', error);
      throw new BookingError('Failed to cancel booking escrow', 'ESCROW_CANCEL_FAIL', error);
    }
  },
};

// Export the booking service with implemented blockchain services
export const bookingService = new BookingService(blockchainServices);

// Existing utility functions for payment confirmation and booking retrieval
export async function confirmBookingPayment(bookingId: string, transactionHash: string) {
  try {
    const { data: existingBooking, error: fetchError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (fetchError || !existingBooking) {
      throw new BookingError('Booking not found or failed to retrieve', 'NOT_FOUND', fetchError);
    }

    const { data, error } = await supabase
      .from('bookings')
      .update({
        status: 'confirmed',
        payment_transaction_hash: transactionHash,
        paid_at: new Date().toISOString(),
      })
      .eq('id', bookingId)
      .select()
      .single();

    if (error || !data) {
      throw new BookingError('Failed to confirm booking status update', 'CONFIRM_FAIL', error);
    }
    return data;
  } catch (error) {
    if (error instanceof BookingError) {
      throw error;
    }
    throw new BookingError('Confirmation error', 'CONFIRM_FAIL', error);
  }
}

export async function getBookingById(id: string) {
  const { data, error } = await supabase.from('bookings').select('*').eq('id', id).single();

  if (error || !data) {
    throw new BookingError('Booking not found', 'NOT_FOUND', error);
  }

  return data;
}
