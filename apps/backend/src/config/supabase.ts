import { createClient } from '@supabase/supabase-js';

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
      bookings: {
        Row: {
          id: string;
          user_id: string;
          property_id: string;
          amount: number;
          currency: string;
          status: 'pending' | 'confirmed' | 'cancelled';
          start_date: string;
          end_date: string;
          escrow_address?: string;
          transaction_hash?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          property_id: string;
          amount: number;
          currency: string;
          status?: 'pending' | 'confirmed' | 'cancelled';
          start_date: string;
          end_date: string;
          escrow_address?: string;
          transaction_hash?: string;
        };
        Update: {
          amount?: number;
          currency?: string;
          status?: 'pending' | 'confirmed' | 'cancelled';
          start_date?: string;
          end_date?: string;
          escrow_address?: string;
          transaction_hash?: string;
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
