// db/init.ts
import { Client } from 'pg';

export const initializeDatabase = async () => {
  const client = new Client({
    connectionString: process.env.SUPABASE_DB_URL, // Your Supabase DB connection string
  });

  try {
    await client.connect();

    await client.query(`
      CREATE TABLE IF NOT EXISTS public.profiles (
        user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        avatar_url TEXT,
        phone TEXT,
        address JSONB,
        preferences JSONB,
        social_links JSONB,
        verification_status TEXT CHECK (verification_status IN ('unverified', 'pending', 'verified')) DEFAULT 'unverified',
        last_active TIMESTAMPTZ DEFAULT now()
      );
    `);

    console.log('✅ profiles table is ready.');
  } catch (error) {
    console.error('❌ Failed to initialize DB:', error);
  } finally {
    await client.end();
  }
};
