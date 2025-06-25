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
}
