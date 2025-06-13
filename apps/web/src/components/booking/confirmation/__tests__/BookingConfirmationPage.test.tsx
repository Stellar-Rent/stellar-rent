import type { BookingData } from '@/types/booking';
/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import { BookingConfirmationPage } from '../BookingConfirmationPage';

jest.mock('@/hooks/useEscrowStatus', () => ({
  useEscrowStatus: () => ({
    escrowData: {
      status: 'pending',
      lastUpdated: new Date(),
    },
    loading: false,
  }),
  getEstimatedTimeToNextStatus: () => '~5 minutes until confirmation',
}));

const mockBookingData: BookingData = {
  id: 'BK123456789',
  property: {
    title: 'Luxury Beachfront Villa',
    image: '/images/property-placeholder.jpg',
  },
  dates: {
    from: new Date('2024-03-15'),
    to: new Date('2024-03-20'),
  },
  guests: 2,
  totalAmount: 750,
  transactionHash: 'ABC123DEF456GHI789JKL012MNO345PQR678STU901VWX234YZ',
  escrowStatus: 'pending' as const,
  host: {
    name: 'John Smith',
    email: 'john.smith@example.com',
    phone: '+1 (555) 123-4567',
  },
};

describe('BookingConfirmationPage', () => {
  it('renders booking confirmation with success message', () => {
    render(<BookingConfirmationPage bookingData={mockBookingData} />);

    expect(screen.getByText('Booking Confirmed!')).toBeInTheDocument();
    expect(screen.getByText(/Your booking has been successfully processed/)).toBeInTheDocument();
  });

  it('displays booking details correctly', () => {
    render(<BookingConfirmationPage bookingData={mockBookingData} />);

    expect(screen.getByText('BK123456789')).toBeInTheDocument();
    expect(screen.getByText('Luxury Beachfront Villa')).toBeInTheDocument();
    expect(screen.getByText('2 guests')).toBeInTheDocument();
    expect(screen.getByText('$750')).toBeInTheDocument();
  });

  it('displays host contact information', () => {
    render(<BookingConfirmationPage bookingData={mockBookingData} />);

    expect(screen.getByText('John Smith')).toBeInTheDocument();
    expect(screen.getByText('john.smith@example.com')).toBeInTheDocument();
    expect(screen.getByText('+1 (555) 123-4567')).toBeInTheDocument();
  });

  it('shows escrow status information', () => {
    render(<BookingConfirmationPage bookingData={mockBookingData} />);

    expect(screen.getByText('Payment Status')).toBeInTheDocument();
    expect(screen.getByText('Payment Pending')).toBeInTheDocument();
  });

  it('displays navigation actions', () => {
    render(<BookingConfirmationPage bookingData={mockBookingData} />);

    expect(screen.getByText('View My Bookings')).toBeInTheDocument();
    expect(screen.getByText('Browse More Properties')).toBeInTheDocument();
  });
});
