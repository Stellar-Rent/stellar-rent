import { createClient } from '@supabase/supabase-js';
import type { AvailabilityRange, CancellationPolicy } from '../types/property.types';

// Define your database types
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string;
          created_at: string;
          password_hash: string;
        };
        Insert: {
          email: string;
          name: string;
          password_hash: string;
        };
        Update: {
          email?: string;
          name?: string;
          password_hash?: string;
        };
      };

      properties: {
        Row: {
          id: string;
          title: string;
          description: string;
          price: number;
          address: string;
          city: string;
          country: string;
          latitude: number | null;
          longitude: number | null;
          amenities: string[];
          images: string[];
          bedrooms: number;
          bathrooms: number;
          max_guests: number;
          owner_id: string;
          status: 'available' | 'booked' | 'maintenance';
          availability: AvailabilityRange[];
          security_deposit: number;
          cancellation_policy: CancellationPolicy | null;
          property_token: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          price: number;
          address: string;
          city: string;
          country: string;
          latitude?: number | null;
          longitude?: number | null;
          amenities?: string[];
          images?: string[];
          bedrooms: number;
          bathrooms: number;
          max_guests: number;
          owner_id: string;
          status?: 'available' | 'booked' | 'maintenance';
          availability?: AvailabilityRange[];
          security_deposit?: number;
          cancellation_policy?: CancellationPolicy | null;
          property_token?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['properties']['Insert']>;
      };
    };
  };
};

if (!process.env.SUPABASE_URL) {
  throw new Error('Missing SUPABASE_URL environment variable');
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
}

export const supabase = createClient<Database>(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    db: {
      schema: 'public',
    },
  }
);
