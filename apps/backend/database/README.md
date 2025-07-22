# StellarRent Database Setup

This document explains how to set up the database for StellarRent development.

## Quick Setup (Recommended)

### Option 1: Use Supabase Dashboard (EASIEST)

1. **Open your Supabase project dashboard**
2. **Go to SQL Editor** (in the left sidebar)
3. **Create a new query**
4. **Copy and paste the entire content from `correct_setup.sql`**
5. **Click "Run"**
6. **Verify tables were created** in the Table Editor

✅ This creates all required tables with the correct structure.

### Option 2: Use Migration Script (Advanced)

⚠️ **Requirements:**
- You need `SUPABASE_URL` in the PostgreSQL format: `postgresql://postgres:[PASSWORD]@[PROJECT-REF].supabase.co:5432/postgres`
- You need `SUPABASE_SERVICE_ROLE_KEY` from your Supabase dashboard

```bash
cd apps/backend/database
./migrate.sh
```

## Database Structure

After setup, you should have these tables:

### Core Tables
- **`users`** - Main user records (required for auth)
  - `id`, `email`, `name`, `password_hash`, `created_at`, `updated_at`
- **`profiles`** - Extended user profiles
  - `user_id` (FK to users), `name`, `avatar_url`, `phone`, etc.
- **`properties`** - Property listings
- **`bookings`** - Booking records

### Wallet Tables  
- **`wallet_challenges`** - For Stellar wallet authentication
- **`wallet_users`** - Links wallet addresses to users

## Important Notes

### For Contributors

1. **Always use `correct_setup.sql`** - This file contains the correct, tested database schema
2. **Don't use individual migration files directly** - They may have inconsistencies
3. **The backend expects specific table structures** - Don't modify table schemas without updating the backend code

### Schema Requirements

The backend specifically requires:
- `users` table with `password_hash` column
- `profiles` table with foreign key to `users.id`
- `wallet_challenges` table for Stellar wallet auth

### Troubleshooting

**Error: "Could not find the 'password_hash' column"**
- Solution: Run `correct_setup.sql` to recreate tables with correct structure

**Error: "relation does not exist"** 
- Solution: Database setup incomplete, run `correct_setup.sql`

**Migration script fails**
- Solution: Use Supabase Dashboard method instead

## Development Workflow

1. **New project**: Run `correct_setup.sql` in Supabase Dashboard
2. **Schema changes**: Update `correct_setup.sql` and document changes
3. **Production**: Use proper migration files (not covered here)

## Files in this directory

- **`correct_setup.sql`** - ✅ USE THIS - Complete, tested database setup
- **`setup.sql`** - ❌ Outdated, has inconsistencies  
- **`migrate.sh`** - Migration script (advanced users only)
- **`migrations/`** - Individual migration files (reference only)

## Environment Variables Required

For the migration script (not needed for Supabase Dashboard method):

```env
SUPABASE_URL=postgresql://postgres:[PASSWORD]@[PROJECT-REF].supabase.co:5432/postgres
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

Get these from your Supabase Dashboard → Project Settings → API