# 🗄️ Database Setup - StellarRent

This guide explains how to properly configure the Supabase database for the StellarRent project.

## 🚀 Quick Setup

### 1. Access Supabase Dashboard
1. Go to [supabase.com](https://supabase.com)
2. Sign in to your account
3. Select your StellarRent project
4. Navigate to **SQL Editor** in the sidebar

### 2. Execute the Setup Script
1. Copy the entire content of [`setup.sql`](./setup.sql)
2. Paste it into the Supabase SQL Editor
3. Click **"Run"** to execute

That's it! Your database will be fully configured.

## 📋 What Does the Script Create?

### **Main Tables**
- **`users`** - Registered user information
- **`properties`** - Property listings on the platform

### **Optimizations**
- **Indexes** for fast queries
- **Constraints** for data validation
- **Triggers** to automatically update timestamps

### **Storage**
- **Bucket `property-images`** for property images

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
DELETE FROM storage.buckets WHERE name = 'property-images';

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