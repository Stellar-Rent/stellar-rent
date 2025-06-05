import { supabase } from '../config/supabase';
import type { BookingsResponse } from '../types/booking.types';

export const getBookingById = async (
  bookingId: string,
  requesterUserId: string
): Promise<BookingsResponse> => {
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', bookingId)
    .single();

  if (bookingError || !booking) {
    throw new Error('Booking not found');
  }

  const { data: property, error: propertyError } = await supabase
    .from('properties')
    .select('*')
    .eq('id', booking.property_id)
    .single();

  if (!property || propertyError) {
    throw new Error('Property not found');
  }
  const property_name = property.title;

  // Permission check: only the booker or the host may access booking record
  if (booking.user_id !== requesterUserId && property.owner_id !== requesterUserId) {
    throw new Error('Access denied');
  }

  const { data: hostUser, error: userError } = await supabase
    .from('users')
    .select('email')
    .eq('id', booking.user_id)
    .single();

  if (userError || !hostUser) {
    throw new Error('User (host) not found');
  }

  const hostContact = hostUser.email;

  const escrowStatus = ''; // TODO: call trustless API to get escrow status

  const bookingResponse = {
    id: booking.id,
    property: property_name,
    dates: booking.dates,
    hostContact: hostContact,
    escrowStatus,
  };

  return bookingResponse;
};
