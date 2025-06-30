import type { AvailabilityRequest, AvailabilityResponse } from '../blockchain/soroban';
import type { BookingEscrowParams } from '../blockchain/trustlessWork';
import { supabase } from '../config/supabase';
import { loggingService } from '../services/logging.service';
import type { CreateBookingInput } from '../types/booking.types';
import { BookingError } from '../types/common.types';

export interface BlockchainServices {
  checkAvailability: (request: AvailabilityRequest) => Promise<AvailabilityResponse>;
  createEscrow: (params: BookingEscrowParams) => Promise<string>;
  cancelEscrow: (escrowAddress: string) => Promise<void>;
}

export class BookingService {
  constructor(private readonly blockchainServices: BlockchainServices) {}

  async createBooking(input: CreateBookingInput) {
    // Log the start of blockchain operation
    const logId = loggingService.logBlockchainOperation('createBooking', input);

    try {
      // Check property availability
      const availabilityResult = await this.blockchainServices.checkAvailability({
        propertyId: input.propertyId,
        dates: input.dates,
      });

      if (!availabilityResult.isAvailable) {
        throw new BookingError(
          'Property is not available for the selected dates',
          'UNAVAILABLE',
          availabilityResult.conflictingBookings
        );
      }

      // Create escrow
      const escrowAddress = await this.blockchainServices.createEscrow({
        buyerAddress: input.userId,
        propertyId: input.propertyId,
        totalAmount: input.total,
        depositAmount: input.deposit,
        dates: input.dates,
        bookingId: '',
        sellerAddress: '',
        guests: input.guests,
        propertyTitle: '',
      });

      // Create booking record in database
      const { data: booking, error: dbError } = await supabase
        .from('bookings')
        .insert({
          property_id: input.propertyId,
          user_id: input.userId,
          dates: input.dates,
          guests: input.guests,
          total: input.total,
          deposit: input.deposit,
          escrow_address: escrowAddress,
          status: 'pending',
        })
        .select()
        .single();

      if (dbError || !booking) {
        // Attempt to cancel escrow if database operation fails
        try {
          await this.blockchainServices.cancelEscrow(escrowAddress);
        } catch (rollbackError) {
          loggingService.logBlockchainError(logId, {
            error: rollbackError as Error,
            context: 'Failed to rollback escrow after database error',
            originalError: dbError,
          });
        }

        throw new BookingError('Failed to create booking record', 'DB_FAIL', dbError);
      }

      // Log successful operation
      loggingService.logBlockchainSuccess(logId, { booking, escrowAddress });

      return {
        bookingId: booking.id,
        escrowAddress,
        status: booking.status,
      };
    } catch (error) {
      if (error instanceof BookingError) {
        throw error;
      }

      // Log and rethrow other errors
      loggingService.logBlockchainError(logId, error as Error);
      throw new BookingError('Failed to create escrow', 'ESCROW_FAIL', (error as Error).message);
    }
  }

  async getBookingById(bookingId: string, userId: string) {
    // Fetch booking from database
    const { data: booking, error } = await supabase
      .from('bookings')
      .select('*, property:properties(*)')
      .eq('id', bookingId)
      .single();

    if (error || !booking) {
      throw new Error('Booking not found');
    }

    // Check if user has permission to access this booking
    if (booking.user_id !== userId && booking.property.user_id !== userId) {
      throw new Error('Access denied');
    }

    // Transform to expected format
    return {
      id: booking.id,
      propertyId: booking.property_id,
      userId: booking.user_id,
      dates: {
        from: new Date(booking.dates.from),
        to: new Date(booking.dates.to),
      },
      guests: booking.guests,
      total: booking.total,
      deposit: booking.deposit,
      escrowAddress: booking.escrow_address,
      status: booking.status,
      createdAt: new Date(booking.created_at),
      updatedAt: new Date(booking.updated_at),
    };
  }

  async confirmBookingPayment(bookingId: string, userId: string, input: { transactionHash: string, amount: number }) {
    // Fetch booking from database
    const { data: booking, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (error || !booking) {
      throw new Error('Booking not found');
    }

    // Check if user is authorized to confirm this payment
    if (booking.user_id !== userId) {
      throw new Error('You do not have permission to confirm payment for this booking');
    }

    // Check booking status allows payment confirmation
    if (booking.status !== 'pending') {
      throw new Error(`Cannot confirm payment for booking with status: ${booking.status}`);
    }

    // Validate payment amount matches booking total
    if (input.amount !== booking.total) {
      throw new Error(`Payment amount ${input.amount} does not match booking total ${booking.total}`);
    }

    // Log blockchain operation
    const logId = loggingService.logBlockchainOperation('confirmPayment', { bookingId, ...input });

    try {
      // Update booking status in blockchain
      // Use the previously added updateBookingStatus function from blockchain/bookingContract
      // Assuming we have a way to call it with relevant info
      
      // For now, just log and update in database
      const { data: updatedBooking, error: updateError } = await supabase
        .from('bookings')
        .update({
          status: 'confirmed',
          updated_at: new Date().toISOString(),
          payment_transaction_hash: input.transactionHash,
        })
        .eq('id', bookingId)
        .select()
        .single();

      if (updateError || !updatedBooking) {
        throw new Error('Failed to update booking status');
      }

      // Log successful operation
      loggingService.logBlockchainSuccess(logId, { updatedBooking });

      return {
        success: true,
        booking: {
          id: updatedBooking.id,
          status: updatedBooking.status,
        },
      };
    } catch (error) {
      // Log and rethrow error
      loggingService.logBlockchainError(logId, error as Error);
      throw error;
    }
  }
}
