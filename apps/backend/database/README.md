# 🗄️ Database Setup - StellarRent

This guide explains how to properly configure the Supabase database for the StellarRent project.

## 🚀 Quick Setup

There are two ways to set up your database:

### Option 1: Using Migration Script (Recommended)

1. Run the migration script:
   ```bash
   cd database
   ./migrate.sh
   ```

### Option 2: Manual Setup via SQL Editor (Alternative)

If the migration script fails, you can set up the database manually:

1. Go to [supabase.com](https://supabase.com)
2. Sign in to your account
3. Select your StellarRent project
4. Navigate to **SQL Editor** in the sidebar
5. Copy the entire content of [`setup.sql`](./setup.sql)
6. Paste it into the Supabase SQL Editor
7. Click **"Run"** to execute

Both methods will create the same database structure.

## 📋 What Does the Setup Create?

### **Main Tables**
- **`users`** - Registered user information
- **`profiles`** - User profile information
- **`properties`** - Property listings on the platform
- **`bookings`** - Booking records with Stellar payment integration

### **Optimizations**
- **Indexes** for fast queries
- **Constraints** for data validation
- **Triggers** to automatically update timestamps

### **Storage**
- **Bucket `property-images`** for property images
- **Bucket `profile-avatars`** for profile images

### **Security**
- **Row Level Security (RLS)** enabled
- **Policies** to control data access
- **Database-level validations**

## 🔧 Required Environment Variables

After setting up the DB, you need these variables in your `.env`:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### Where to Find the Keys?

1. In your Supabase dashboard
2. Go to **Settings** → **API**
3. Copy the values:
   - **Project URL** → `SUPABASE_URL`
   - **anon public** → `SUPABASE_ANON_KEY`
   - **service_role** → `SUPABASE_SERVICE_ROLE_KEY`

## 📊 Table Structure

### **Table `users`**
```sql
- id (uuid, PK)
- email (text, unique)
- name (text)
- password_hash (text)
- created_at (timestamp)
- updated_at (timestamp)
```

### **Table `profiles`**
```sql
- user_id (uuid, PK)
- name (text)
- avatar_url (text)
- phone (text)
- address (JSON object)
- preferences (JSON object)
- social_links (JSON object)
- verification_status (text)
- last_active (timestamp)
```

### **Table `properties`**
```sql
- id (uuid, PK)
- title (text)
- description (text)
- price (decimal)
- address (text)
- city (text)
- country (text)
- latitude (decimal, optional)
- longitude (decimal, optional)
- amenities (text[])
- images (text[])
- bedrooms (integer)
- bathrooms (integer)
- max_guests (integer)
- owner_id (uuid, FK → users.id)
- status (enum: available|booked|maintenance)
- availability (jsonb)
- security_deposit (decimal)
- cancellation_policy (jsonb, optional)
- property_token (text, optional)
- created_at (timestamp)
- updated_at (timestamp)
```

### **Table `bookings`**
```sql
- id (uuid, PK)
- user_id (uuid, FK → users.id)
- property_id (uuid, FK → properties.id)
- amount (decimal)
- status (enum: pending|confirmed|cancelled)
- start_date (date)
- end_date (date)
- escrow_address (text, optional)
- transaction_hash (varchar, optional)
- created_at (timestamp)
- updated_at (timestamp)
```

## 🧪 Verify Configuration

Run these commands to verify everything is working:

```bash
# Verify tables
curl -X GET http://localhost:3000/properties/amenities

# Should return:
# {"success":true,"data":["wifi","kitchen",...]}
```

## 🔄 Reset Script (Development Only)

If you need to reset the DB during development:

```sql
-- ⚠️ WARNING: This deletes ALL data
DROP TABLE IF EXISTS public.properties CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DELETE FROM storage.buckets WHERE name = 'property-images';
DELETE FROM storage.buckets WHERE name = 'profile-avatars';

-- Then run setup.sql again
```

## 🆘 Common Issues

### **Error: "relation does not exist"**
- **Solution**: Run the complete `setup.sql` script

### **Error: "permission denied"**
- **Solution**: Verify you have admin permissions in Supabase

### **Error: "bucket already exists"**
- **Solution**: Normal, the script uses `ON CONFLICT` to prevent errors

### **Authentication not working**
- **Solution**: Check environment variables in `.env`

## 📝 Notes for Contributors

1. **Always use** `IF NOT EXISTS` in your migrations
2. **Never modify** `setup.sql` without documenting changes
3. **Add indexes** for new frequent queries
4. **Test migrations** in development environment first

## 🔗 Useful Links

- [Supabase Documentation](https://supabase.com/docs)
- [SQL Reference](https://supabase.com/docs/guides/database/overview)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Storage Guide](https://supabase.com/docs/guides/storage)

## 🎯 Next Steps

After configuring the DB:

1. ✅ Run `bun run dev` in the backend
2. ✅ Test endpoints with the `test_endpoints.sh` script
3. ✅ Verify authentication
4. ✅ Create your first property via API

Your database is ready for development! 🚀

# Database Documentation

## Schema Overview

### Properties Table
This table stores property information including location data used by the autocomplete feature.

```sql
CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  city VARCHAR(100) NOT NULL,
  country VARCHAR(100) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'available',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for location search performance
CREATE INDEX idx_properties_location ON properties (city, country);
CREATE INDEX idx_properties_status ON properties (status);
```

## Location Search Optimization
- The `idx_properties_location` index improves performance for location-based queries
- Case-insensitive search is implemented using `ILIKE`
- Results are limited and paginated for better performance
- Deduplication is handled at the application level

## API Endpoints

### GET /api/locations/autocomplete
Returns location suggestions based on user input.

Query Parameters:
- `query` (required): Search string (1-100 characters)
- `limit` (optional): Maximum results (1-50, default: 20)

### GET /api/locations/popular
Returns most frequently used locations.

Query Parameters:
- `limit` (optional): Maximum results (1-20, default: 10)

### GET /api/locations/health
Health check endpoint for the location service.

## Security Considerations
- Input validation using Zod
- Rate limiting implemented
- SQL injection prevention using parameterized queries
- Maximum query length restrictions