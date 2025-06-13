export type EscrowStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export interface BookingData {
  id: string;
  property: {
    title: string;
    image: string;
  };
  dates: {
    from: Date;
    to: Date;
  };
  guests: number;
  totalAmount: number;
  transactionHash: string;
  escrowStatus: EscrowStatus;
  host: {
    name: string;
    email: string;
    phone?: string;
  };
}

export interface EscrowData {
  status: EscrowStatus;
  transactionHash: string;
  amount: number;
  lastUpdated: Date;
  estimatedConfirmationTime?: Date;
}

export interface UseBookingDetailsReturn {
  bookingData: BookingData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export interface UseEscrowStatusReturn {
  escrowData: EscrowData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}
