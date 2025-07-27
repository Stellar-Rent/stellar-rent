import { v4 as uuidv4 } from 'uuid';
import type { CreateBookingInput } from '../../src/types/booking.types';

export interface TestProperty {
  id: string;
  title: string;
  description: string;
  price: number;
  address: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  amenities: string[];
  images: string[];
  bedrooms: number;
  bathrooms: number;
  max_guests: number;
  owner_id: string;
  status: string;
  security_deposit: number;
  created_at: string;
  updated_at: string;
}

export interface TestUser {
  id: string;
  email: string;
  name: string;
  password_hash: string;
  created_at: string;
  updated_at: string;
}

export interface TestBooking {
  id: string;
  property_id: string;
  user_id: string;
  dates: {
    from: string;
    to: string;
  };
  guests: number;
  total: number;
  deposit: number;
  status: string;
  escrow_address: string;
  created_at: string;
  updated_at: string;
}

export interface TestPaymentData {
  transactionHash: string;
  escrowAddress: string;
  amount: number;
  deposit: number;
}

export const generateTestUUID = (): string => uuidv4();

export const generateTransactionHash = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return `txn_${Array.from({ length: 64 }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('')}`;
};

export const generateEscrowAddress = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return `G${Array.from({ length: 55 }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('')}`;
};

export const testProperties: TestProperty[] = [
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    title: 'Luxury Beach Villa',
    description: 'Stunning oceanfront villa with panoramic views',
    price: 250.0,
    address: '123 Ocean Drive',
    city: 'Miami Beach',
    country: 'USA',
    latitude: 25.7617,
    longitude: -80.1918,
    amenities: ['wifi', 'pool', 'parking', 'kitchen', 'air-conditioning'],
    images: ['https://example.com/villa1.jpg', 'https://example.com/villa2.jpg'],
    bedrooms: 3,
    bathrooms: 2,
    max_guests: 6,
    owner_id: '550e8400-e29b-41d4-a716-446655440010',
    status: 'available',
    security_deposit: 500.0,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    title: 'Downtown Loft',
    description: 'Modern loft in the heart of the city',
    price: 150.0,
    address: '456 Main Street',
    city: 'New York',
    country: 'USA',
    latitude: 40.7128,
    longitude: -74.006,
    amenities: ['wifi', 'elevator', 'gym', 'doorman'],
    images: ['https://example.com/loft1.jpg'],
    bedrooms: 1,
    bathrooms: 1,
    max_guests: 2,
    owner_id: '550e8400-e29b-41d4-a716-446655440011',
    status: 'available',
    security_deposit: 300.0,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
  },
  {
    id: 'conflict-property-123',
    title: 'Conflict Test Property',
    description: 'Property for testing booking conflicts',
    price: 100.0,
    address: '789 Test Street',
    city: 'Test City',
    country: 'Test Country',
    latitude: 0.0,
    longitude: 0.0,
    amenities: ['wifi'],
    images: ['https://example.com/test.jpg'],
    bedrooms: 1,
    bathrooms: 1,
    max_guests: 2,
    owner_id: '550e8400-e29b-41d4-a716-446655440012',
    status: 'available',
    security_deposit: 200.0,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
  },
  {
    id: 'double-conflict-property-789',
    title: 'Double Conflict Property',
    description: 'Property for testing multiple booking conflicts',
    price: 75.0,
    address: '999 Conflict Avenue',
    city: 'Conflict City',
    country: 'Conflict Country',
    latitude: 1.0,
    longitude: 1.0,
    amenities: ['wifi', 'parking'],
    images: ['https://example.com/conflict.jpg'],
    bedrooms: 1,
    bathrooms: 1,
    max_guests: 2,
    owner_id: '550e8400-e29b-41d4-a716-446655440013',
    status: 'available',
    security_deposit: 150.0,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
  },
];

export const testUsers: TestUser[] = [
  {
    id: '550e8400-e29b-41d4-a716-446655440020',
    email: 'guest@example.com',
    name: 'John Guest',
    password_hash: '$2b$10$hashedpassword123',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440021',
    email: 'host@example.com',
    name: 'Sarah Host',
    password_hash: '$2b$10$hashedpassword456',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440022',
    email: 'unauthorized@example.com',
    name: 'Unauthorized User',
    password_hash: '$2b$10$hashedpassword789',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
  },
];

export const testBookings: TestBooking[] = [
  {
    id: '550e8400-e29b-41d4-a716-446655440030',
    property_id: '550e8400-e29b-41d4-a716-446655440001',
    user_id: '550e8400-e29b-41d4-a716-446655440020',
    dates: {
      from: '2024-06-01T00:00:00Z',
      to: '2024-06-03T00:00:00Z',
    },
    guests: 2,
    total: 1000.0,
    deposit: 200.0,
    status: 'pending',
    escrow_address: 'GABC123456789012345678901234567890123456789012345678901234567890',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440031',
    property_id: '550e8400-e29b-41d4-a716-446655440002',
    user_id: '550e8400-e29b-41d4-a716-446655440020',
    dates: {
      from: '2024-07-01T00:00:00Z',
      to: '2024-07-03T00:00:00Z',
    },
    guests: 1,
    total: 300.0,
    deposit: 60.0,
    status: 'confirmed',
    escrow_address: 'GDEF987654321098765432109876543210987654321098765432109876543210',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440032',
    property_id: '550e8400-e29b-41d4-a716-446655440001',
    user_id: '550e8400-e29b-41d4-a716-446655440021',
    dates: {
      from: '2024-08-01T00:00:00Z',
      to: '2024-08-07T00:00:00Z',
    },
    guests: 4,
    total: 1750.0,
    deposit: 350.0,
    status: 'completed',
    escrow_address: 'GHIJ555666777888999000111222333444555666777888999000111222333',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
  },
];

export const testPaymentData: TestPaymentData[] = [
  {
    transactionHash: 'txn_1234567890123456789012345678901234567890123456789012345678901234',
    escrowAddress: 'GABC123456789012345678901234567890123456789012345678901234567890',
    amount: 1000.0,
    deposit: 200.0,
  },
  {
    transactionHash: 'txn_9876543210987654321098765432109876543210987654321098765432109876',
    escrowAddress: 'GDEF987654321098765432109876543210987654321098765432109876543210',
    amount: 300.0,
    deposit: 60.0,
  },
];

export const createValidBookingInput = (
  overrides: Partial<CreateBookingInput> = {}
): CreateBookingInput => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);

  return {
    propertyId: '550e8400-e29b-41d4-a716-446655440001',
    userId: '550e8400-e29b-41d4-a716-446655440020',
    dates: {
      from: tomorrow,
      to: nextWeek,
    },
    guests: 2,
    total: 1000.0,
    deposit: 200.0,
    ...overrides,
  };
};

export const createInvalidBookingInput = (): CreateBookingInput => {
  return {
    propertyId: 'invalid-property-id',
    userId: '550e8400-e29b-41d4-a716-446655440020',
    dates: {
      from: new Date('2023-01-01'),
      to: new Date('2023-01-02'),
    },
    guests: -1,
    total: -100,
    deposit: -50,
  };
};

export const createConflictBookingInput = (): CreateBookingInput => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);

  return {
    propertyId: 'conflict-property-123',
    userId: '550e8400-e29b-41d4-a716-446655440020',
    dates: {
      from: tomorrow,
      to: nextWeek,
    },
    guests: 2,
    total: 100.0,
    deposit: 20.0,
  };
};

export const createDoubleConflictBookingInput = (): CreateBookingInput => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);

  return {
    propertyId: 'double-conflict-property-789',
    userId: '550e8400-e29b-41d4-a716-446655440020',
    dates: {
      from: tomorrow,
      to: nextWeek,
    },
    guests: 2,
    total: 75.0,
    deposit: 15.0,
  };
};

export const generateTestJWT = (userId: string, email: string): string => {
  const jwt = require('jsonwebtoken');
  const secret = process.env.JWT_SECRET || 'test-secret-key';
  return jwt.sign({ id: userId, email }, secret, { expiresIn: '1h' });
};

export const generateExpiredJWT = (userId: string, email: string): string => {
  const jwt = require('jsonwebtoken');
  const secret = process.env.JWT_SECRET || 'test-secret-key';
  return jwt.sign({ id: userId, email }, secret, { expiresIn: '-1h' });
};

export const generateInvalidJWT = (): string => {
  return 'invalid.jwt.token';
};

// Test function to verify escrow address format
export const testEscrowAddressFormat = (): void => {
  const testAddress = generateEscrowAddress();
  if (testAddress.length !== 56 || !testAddress.startsWith('G')) {
    throw new Error(`Invalid escrow address format: ${testAddress}`);
  }

  // Test the hardcoded addresses in test fixtures
  for (const booking of testBookings) {
    if (booking.escrow_address.length !== 56 || !booking.escrow_address.startsWith('G')) {
      throw new Error(`Invalid escrow address in test fixture: ${booking.escrow_address}`);
    }
  }

  for (const payment of testPaymentData) {
    if (payment.escrowAddress.length !== 56 || !payment.escrowAddress.startsWith('G')) {
      throw new Error(`Invalid escrow address in payment fixture: ${payment.escrowAddress}`);
    }
  }
};
