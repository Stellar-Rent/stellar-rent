import {
  checkAvailability,
  type AvailabilityRequest,
} from '../blockchain/soroban';
import { createEscrow } from '../blockchain/trustlessWork';
import { supabase } from '../config/supabase';
import type { CreateBookingInput } from '../types/booking.types';

export async function createBooking(data: CreateBookingInput) {
  const availabilityRequest: AvailabilityRequest = {
    propertyId: data.propertyId,
    dates: {
      from: data.dates.from,
      to: data.dates.to,
    },
  };
  const isAvailable = await checkAvailability(availabilityRequest);
  if (!isAvailable) {
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    const err: any = new Error(
      'Property is not available for the selected dates'
    );
    err.code = 'UNAVAILABLE';
    throw err;
  }
  let escrowAddress: string;
  try {
    escrowAddress = await createEscrow({
      buyerAddress: data.userId,
      propertyId: data.propertyId,
      totalAmount: data.total,
      depositAmount: data.deposit,
      dates: data.dates,
      bookingId: '',
      sellerAddress: '',
      guests: 0,
      propertyTitle: '',
    });
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  } catch (_err: any) {
    throw { status: 500, message: 'Failed to create escrow' };
  }

  const { error, data: booking } = await supabase
    .from('bookings')
    .insert({
      property_id: data.propertyId,
      user_id: data.userId,
      dates: data.dates,
      guests: data.guests,
      total: data.total,
      deposit: data.deposit,
      escrow_address: escrowAddress,
      status: 'pending',
    })
    .select()
    .single();

  if (error)
    throw { status: 500, message: 'Database error', detail: error.message };

  return {
    bookingId: booking.id,
    escrowAddress,
    status: booking.status,
  };
}
