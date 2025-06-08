import { supabase } from '../config/supabase';
import type { Booking, ConfirmPaymentInput, ConfirmPaymentResponse } from '../types/booking.types';

// MOCK: Stellar SDK integration - Replace with actual Stellar SDK when available
const mockStellarVerification = async (transactionHash: string): Promise<boolean> => {
  // TODO: Replace with actual Stellar SDK integration

  console.log(`[MOCK] Verifying Stellar transaction: ${transactionHash}`);

  return transactionHash.length === 64;
};

// MOCK: Trustless Work integration - Replace with actual API calls when available
const mockTrustlessWorkNotification = async (
  bookingId: string,
  escrowAddress: string
): Promise<void> => {
  // TODO: Replace with actual Trustless Work API integration

  console.log(
    `[MOCK] Notifying Trustless Work for booking ${bookingId} with escrow ${escrowAddress}`
  );
  console.log('[MOCK] Trustless Work: Payment confirmed, escrow will be managed accordingly');
};

export const confirmBookingPayment = async (
  bookingId: string,
  userId: string,
  input: ConfirmPaymentInput
): Promise<ConfirmPaymentResponse> => {
  try {
    // 1. Fetch the booking and verify ownership
    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .eq('user_id', userId) // Ensure user owns this booking
      .single();

    if (fetchError || !booking) {
      throw new Error('Booking not found or you do not have permission to confirm this booking');
    }

    if (booking.status !== 'pending') {
      throw new Error(`Cannot confirm payment for booking with status: ${booking.status}`);
    }

    // 2. MOCK: Verify transaction on Stellar blockchain
    const isTransactionValid = await mockStellarVerification(input.transactionHash);

    if (!isTransactionValid) {
      throw new Error('Invalid or failed Stellar transaction');
    }

    // 3. Update booking status and transaction hash
    const { data: updatedBooking, error: updateError } = await supabase
      .from('bookings')
      .update({
        status: 'confirmed',
        transaction_hash: input.transactionHash,
        updated_at: new Date().toISOString(),
      })
      .eq('id', bookingId)
      .select()
      .single();

    if (updateError || !updatedBooking) {
      throw new Error('Failed to update booking status');
    }

    // 4. MOCK: Notify Trustless Work for escrow management
    if (booking.escrow_address) {
      await mockTrustlessWorkNotification(bookingId, booking.escrow_address);
    }

    // 5. Log the successful payment confirmation
    console.log(`Payment confirmed for booking ${bookingId} by user ${userId}`);

    return {
      bookingId: updatedBooking.id,
      status: updatedBooking.status,
      message: 'Payment confirmed successfully',
    };
  } catch (error) {
    console.error('Error confirming booking payment:', error);
    throw error;
  }
};

// Helper function to get booking by ID (for testing and future use)
export const getBookingById = async (bookingId: string): Promise<Booking | null> => {
  const { data: booking, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', bookingId)
    .single();

  if (error || !booking) {
    return null;
  }

  return booking;
};
