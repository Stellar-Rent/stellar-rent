import { z } from 'zod';

export interface AvailabilityRange {
  start_date: string;
  end_date: string;
  is_available: boolean;
}

export interface AvailabilityRangeInput {
  from?: string;
  to?: string;
  start_date?: string;
  end_date?: string;
  is_available?: boolean;
}

export interface CancellationPolicy {
  policy_type: string;
  refundable_until_days: number;
  refund_percentage: number;
  description?: string;
}

export interface SearchProperties {
  location?: string;
  from?: string;
  to?: string;
  guests?: number;
  minPrice?: number;
  maxPrice?: number;
  amenities?: string[];
  page?: number;
  limit?: number;
}

export interface Property {
  id: string;
  title: string;
  description: string;
  price: number;
  location: {
    address: string;
    city: string;
    country: string;
    coordinates?: { latitude: number; longitude: number };
  };
  amenities: string[];
  images: string[];
  bedrooms: number;
  bathrooms: number;
  maxGuests: number;
  ownerId: string;
  propertyToken?: string | null;
  status: 'available' | 'booked' | 'maintenance';
  availability: Array<{ from: string; to: string }>;
  securityDeposit: number;
  cancellationPolicy?: { daysBefore: number; refundPercentage: number };
  createdAt: string;
  updatedAt: string;
}

export interface FeaturedProperty {
  id: string;
  title: string;
  price: number;
  location: {
    city: string;
    country: string;
  };
  image: string | null;
  availability: { from: string; to: string }[];
}

export interface CreatePropertyInput extends Omit<Property, 'id' | 'createdAt' | 'updatedAt'> {}

export interface UpdatePropertyInput extends Partial<CreatePropertyInput> {}

export interface PropertyResponse {
  property: Property;
}

export const availabilityRangeSchema = z.object({
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().min(1, 'End date is required'),
  is_available: z.boolean(),
});

export const cancellationPolicySchema = z.object({
  policy_type: z.string().min(1, 'Policy type is required'),
  refundable_until_days: z.number().int().min(0),
  refund_percentage: z.number().min(0).max(100),
  description: z.string().optional(),
});

export const propertySchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  price: z.number().positive(),
  address: z.string().min(1),
  city: z.string().min(1),
  country: z.string().min(1),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  amenities: z.array(z.string()).default([]),
  images: z.array(z.string()).default([]),
  bedrooms: z.number().int().min(1),
  bathrooms: z.number().int().min(1),
  max_guests: z.number().int().min(1).max(20),
  owner_id: z.string().uuid(),
  status: z.enum(['available', 'booked', 'maintenance']).default('available'),
  availability: z.array(availabilityRangeSchema).default([]),
  security_deposit: z.number().min(0).default(0),
  cancellation_policy: cancellationPolicySchema.nullable().optional(),
  property_token: z.string().nullable().optional(),
});

export const searchPropertiesQuerySchema = z.object({
  city: z.string().optional(),
  country: z.string().optional(),
  min_price: z.coerce.number().min(0).optional(),
  max_price: z.coerce.number().min(0).optional(),
  bedrooms: z.coerce.number().int().min(1).optional(),
  bathrooms: z.coerce.number().int().min(1).optional(),
  max_guests: z.coerce.number().int().min(1).optional(),
  amenities: z
    .string()
    .transform((val) => val.split(','))
    .optional(),
  status: z.enum(['available', 'booked', 'maintenance']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  sort_by: z.enum(['price', 'created_at', 'title']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
  from: z.string().date('Invalid date format').optional(),
  to: z.string().date('Invalid date format').optional(),
});

export const updatePropertySchema = propertySchema.partial();
export type PropertyInput = z.infer<typeof propertySchema>;
