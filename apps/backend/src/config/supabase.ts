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
      profiles: {
        Row: {
          id: string;
          user_id: string;
          name?: string;
          avatar_url?: string;
          phone?: string;
          address?: string;
          preferences?: Record<string, unknown>;
          social_links?: Record<string, unknown>;
          verification_status: 'verified' | 'unverified' | 'pending';
          last_active: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name?: string;
          avatar_url?: string;
          phone?: string;
          address?: string;
          preferences?: Record<string, unknown>;
          social_links?: Record<string, unknown>;
          verification_status?: 'verified' | 'unverified' | 'pending';
          last_active?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          avatar_url?: string;
          phone?: string;
          address?: string;
          preferences?: Record<string, unknown>;
          social_links?: Record<string, unknown>;
          verification_status?: 'verified' | 'unverified' | 'pending';
          last_active?: string;
          updated_at?: string;
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

      bookings: {
        Row: {
          id: string;
          user_id: string;
          property_id: string;
          amount: number;
          status: 'pending' | 'confirmed' | 'cancelled';
          start_date: string;
          end_date: string;
          escrow_address: string | null;
          transaction_hash: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          property_id: string;
          amount: number;
          status?: 'pending' | 'confirmed' | 'cancelled';
          start_date: string;
          end_date: string;
          escrow_address?: string;
          transaction_hash?: string;
        };
        Update: {
          amount?: number;
          status?: 'pending' | 'confirmed' | 'cancelled';
          start_date?: string;
          end_date?: string;
          escrow_address?: string;
          transaction_hash?: string;
          updated_at?: string;
        };
      };
      //===================
      // Wallet challenge schema
      //===================
      wallet_challenges: {
        Row: {
          id: string;
          public_key: string;
          challenge: string;
          expires_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          public_key: string;
          challenge: string;
          expires_at: string;
          created_at?: string;
        };
        Update: {
          expires_at?: string;
        };
      };
      wallet_users: {
        Row: {
          id: string;
          public_key: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          public_key: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          updated_at?: string;
        };
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
