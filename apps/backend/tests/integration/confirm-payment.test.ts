import { beforeEach, describe, expect, it, mock } from 'bun:test';
import type { Response } from 'express';
import type { AuthRequest } from '../../src/types/auth.types';

const mockGetBookingById = mock(() => Promise.resolve({}));
const mockVerifyStellarTransaction = mock(() => Promise.resolve(true));
const mockConfirmBookingPayment = mock(() => Promise.resolve({}));

mock.module('../../src/services/booking.service', () => ({
  getBookingById: mockGetBookingById,
  confirmBookingPayment: mockConfirmBookingPayment,
}));

mock.module('../../src/blockchain/soroban', () => ({
  verifyStellarTransaction: mockVerifyStellarTransaction,
  checkAvailability: mock(() => Promise.resolve({ isAvailable: true })),
  getAccountUSDCBalance: mock(() => Promise.resolve('0')),
}));

import { confirmPayment } from '../../src/controllers/booking.controller';

describe('confirmPayment Controller', () => {
  let req: Partial<AuthRequest>;
  let res: Partial<Response>;
  let _next: (...args: any[]) => any;

  beforeEach(() => {
    mockGetBookingById.mockClear();
    mockVerifyStellarTransaction.mockClear();
    mockConfirmBookingPayment.mockClear();

    mockGetBookingById.mockResolvedValue({
      id: 'test-booking-id',
      total: 100,
      escrow_address: 'test-escrow-address',
      status: 'pending',
    } as any);
    mockVerifyStellarTransaction.mockResolvedValue(true);
    mockConfirmBookingPayment.mockResolvedValue({
      id: 'test-booking-id',
      total: 100,
      escrow_address: 'test-escrow-address',
      status: 'confirmed',
    } as any);

    req = {
      user: {
        id: 'test-user-id',
        app_metadata: {} as any,
        user_metadata: {} as any,
        aud: '',
        created_at: '',
      },
      body: {
        bookingId: 'test-booking-id',
        transactionHash: 'test-transaction-hash',
        sourcePublicKey: 'test-source-public-key',
      },
    };
    res = {
      status: mock(() => res) as any,
      json: mock(() => {}) as any,
    };
    _next = mock(() => {}) as any;
  });

  it('should confirm payment successfully and return 200', async () => {
    await confirmPayment(req as AuthRequest, res as Response);

    expect(mockGetBookingById).toHaveBeenCalledWith('test-booking-id');
    expect(mockVerifyStellarTransaction).toHaveBeenCalledWith(
      'test-transaction-hash',
      'test-source-public-key',
      'test-escrow-address',
      '100',
      'USDC'
    );
    expect(mockConfirmBookingPayment).toHaveBeenCalledWith(
      'test-booking-id',
      'test-transaction-hash'
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: {
        id: 'test-booking-id',
        total: 100,
        escrow_address: 'test-escrow-address',
        status: 'confirmed',
      },
      message: 'Booking confirmed successfully',
    });
  });

  it('should return 401 if user ID is missing', async () => {
    req.user = undefined;
    await confirmPayment(req as AuthRequest, res as Response);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'User authentication required' });
    expect(mockGetBookingById).not.toHaveBeenCalled();
  });

  it('should return 400 if bookingId is missing', async () => {
    req.body.bookingId = undefined;
    await confirmPayment(req as AuthRequest, res as Response);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'bookingId is required' });
    expect(mockGetBookingById).not.toHaveBeenCalled();
  });

  it('should return 400 if transactionHash is missing', async () => {
    req.body.transactionHash = undefined;
    await confirmPayment(req as AuthRequest, res as Response);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'transactionHash is required' });
    expect(mockGetBookingById).not.toHaveBeenCalled();
  });

  it('should return 400 if sourcePublicKey is missing', async () => {
    req.body.sourcePublicKey = undefined;
    await confirmPayment(req as AuthRequest, res as Response);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'sourcePublicKey is required' });
    expect(mockGetBookingById).not.toHaveBeenCalled();
  });

  it('should return 404 if booking is not found', async () => {
    mockGetBookingById.mockResolvedValue(null);
    await confirmPayment(req as AuthRequest, res as Response);
    expect(mockGetBookingById).toHaveBeenCalledWith('test-booking-id');
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Booking not found' });
    expect(mockVerifyStellarTransaction).not.toHaveBeenCalled();
    expect(mockConfirmBookingPayment).not.toHaveBeenCalled();
  });

  it('should return 500 if booking is missing escrow address', async () => {
    const mockBookingWithoutEscrow = {
      id: 'test-booking-id',
      total: 100,
      escrow_address: undefined,
      status: 'pending',
    };
    mockGetBookingById.mockResolvedValue(mockBookingWithoutEscrow as any);
    await confirmPayment(req as AuthRequest, res as Response);
    expect(mockGetBookingById).toHaveBeenCalledWith('test-booking-id');
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Booking missing escrow address' });
    expect(mockVerifyStellarTransaction).not.toHaveBeenCalled();
    expect(mockConfirmBookingPayment).not.toHaveBeenCalled();
  });

  it('should return 400 if Stellar transaction verification fails', async () => {
    mockVerifyStellarTransaction.mockRejectedValue(
      new Error('Transaction verification failed: Invalid signature')
    );
    await confirmPayment(req as AuthRequest, res as Response);
    expect(mockGetBookingById).toHaveBeenCalledWith('test-booking-id');
    expect(mockVerifyStellarTransaction).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Transaction verification failed',
      details: [{ message: 'Transaction verification failed: Invalid signature' }],
    });
    expect(mockConfirmBookingPayment).not.toHaveBeenCalled();
  });

  it('should return 400 if confirmBookingPayment fails with a specific message', async () => {
    mockConfirmBookingPayment.mockRejectedValue(
      new Error('Cannot confirm booking: Already confirmed')
    );
    await confirmPayment(req as AuthRequest, res as Response);
    expect(mockGetBookingById).toHaveBeenCalledWith('test-booking-id');
    expect(mockVerifyStellarTransaction).toHaveBeenCalled();
    expect(mockConfirmBookingPayment).toHaveBeenCalledWith(
      'test-booking-id',
      'test-transaction-hash'
    );
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Cannot confirm booking: Already confirmed',
    });
  });

  it('should return 500 for other unexpected errors during payment confirmation', async () => {
    mockConfirmBookingPayment.mockRejectedValue(new Error('Database connection lost'));
    await confirmPayment(req as AuthRequest, res as Response);
    expect(mockGetBookingById).toHaveBeenCalledWith('test-booking-id');
    expect(mockVerifyStellarTransaction).toHaveBeenCalled();
    expect(mockConfirmBookingPayment).toHaveBeenCalledWith(
      'test-booking-id',
      'test-transaction-hash'
    );
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Failed to confirm payment',
      details: [{ message: 'Internal server error' }],
    });
  });
});
