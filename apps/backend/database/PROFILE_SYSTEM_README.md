# Profile System Setup Guide

## Overview
This document explains how to set up and test the User Profile System (PR #68) for the Stellar Rent application.

## Database Setup Required

### 1. Execute Updated setup.sql
The profile system requires a new `profiles` table. You MUST run the updated `setup.sql` file in your Supabase SQL Editor:

```sql
-- The setup.sql file now includes:
-- ✅ profiles table creation
-- ✅ RLS policies for profiles
-- ✅ Storage bucket for avatars
-- ✅ Proper indexes and triggers
```

### 2. New Table Structure
The `profiles` table includes:
- `user_id` (Primary Key, references auth.users)
- `name` (User's display name)
- `avatar_url` (Profile picture URL)
- `phone` (Phone number)
- `address` (JSONB - street, city, country, postal_code)
- `preferences` (JSONB - notifications, newsletter, language)
- `social_links` (JSONB - facebook, twitter, instagram)
- `verification_status` (unverified/pending/verified)
- `last_active` (Timestamp)
- `created_at` / `updated_at` (Auto-managed)

### 3. Storage Buckets
Two storage buckets are configured:
- `property-images` (existing)
- `avatars` (new for profile pictures)

## API Endpoints

### Profile CRUD Operations
- `GET /api/profile` - Get user profile
- `PATCH /api/profile` - Update user profile  
- `DELETE /api/profile` - Delete user account
- `POST /api/profile/avatar` - Upload profile picture

### Authentication Required
All profile endpoints require authentication via Bearer token.

## Testing the System

### 1. Start the Backend
```bash
cd apps/backend
bun dev
```

### 2. Run Profile Tests
```bash
./apps/backend/test_profile_crud.sh
```

### 3. Manual Testing Examples

#### Register a User
```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User",
    "phone": "+1234567890",
    "address": {
      "street": "123 Test St",
      "city": "Test City", 
      "country": "Test Country",
      "postal_code": "12345"
    }
  }' \
  http://localhost:3000/api/auth/register
```

#### Get Profile
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/profile
```

#### Update Profile
```bash
curl -X PATCH -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Updated Name",
    "preferences": {
      "notifications": false,
      "language": "es"
    }
  }' \
  http://localhost:3000/api/profile
```

## Current Implementation Status

### ✅ Completed Features
- [x] Basic CRUD operations (Create, Read, Update, Delete)
- [x] User authentication integration
- [x] Profile data validation
- [x] Avatar upload functionality
- [x] Database schema with proper relationships
- [x] RLS security policies
- [x] TypeScript type definitions
- [x] Error handling

### ❌ Missing Features (from Issue #44)
- [ ] Email verification system
- [ ] Phone number verification
- [ ] Two-factor authentication (2FA)
- [ ] Profile completion percentage
- [ ] Verification badges
- [ ] Login history tracking
- [ ] Device management
- [ ] Integration with booking system
- [ ] Integration with property management
- [ ] Advanced notification preferences
- [ ] Social media verification

## Recommendation

**The current implementation provides a solid foundation with working CRUD operations.** 

### For Merging:
- ✅ Basic profile system works correctly
- ✅ Database schema is properly designed
- ✅ Security policies are in place
- ✅ Code follows project patterns

### Next Steps:
1. **Merge this PR** to establish the basic profile system
2. **Create separate issues** for the missing advanced features:
   - Email/Phone verification system
   - Two-factor authentication
   - Profile completion tracking
   - Integration with other systems
   - Advanced notification system

This approach allows the project to have a working profile system immediately while planning the advanced features for future development cycles.

## Files Modified/Added
- `apps/backend/src/routes/profile.routes.ts` - Profile routes
- `apps/backend/src/controllers/profile.controller.ts` - Profile controllers  
- `apps/backend/src/services/profile.service.ts` - Profile business logic
- `apps/backend/src/types/userProfile.ts` - TypeScript definitions
- `apps/backend/database/setup.sql` - Updated with profiles table
- `apps/backend/src/middleware/multer.ts` - File upload handling 