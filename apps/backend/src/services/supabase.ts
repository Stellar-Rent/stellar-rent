//supabase table structure

// create extension if not exists "uuid-ossp";

// create table users (
//   id uuid primary key default uuid_generate_v4(),
//   email text unique not null,
//   password text not null,
//   name text not null,
//   created_at timestamp with time zone default now()
// );
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL as string;
const supabaseKey = process.env.SUPABASE_KEY as string;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase credentials');
}
export const supabase = createClient(supabaseUrl, supabaseKey);
