# StellarRent Backend

A decentralized P2P rental platform built on the Stellar blockchain.

## Quick Start

```bash
# Install dependencies
bun install

# Set up your environment variables in .env
cp .env.example .env  # Then edit .env with your values

# Start development server
bun run dev

# Run tests
bun test
```

## Running with Docker

```bash
# Make sure you have Docker Desktop running
# and .env file configured (see Environment Variables section)

# Build and start the container
cd apps/backend
docker-compose up --build -d

# Check container status
docker ps

# View logs
docker logs stellarrent-backend

# Stop the container
docker-compose down

# For development with live reload
docker-compose up

# Run commands inside the container
docker exec -it stellarrent-backend bun test
```

The application will be available at `http://localhost:3000`. You can verify it's running by checking the health endpoint:
```bash
curl http://localhost:3000/health
```

## Database Setup

1. Create your own Supabase project at [supabase.com](https://supabase.com)
2. Get your project credentials from Project Settings > API
3. Add them to your `.env` file:
   ```env
   SUPABASE_URL=your_development_project_url
   SUPABASE_SERVICE_ROLE_KEY=your_development_service_role_key
   ```
4. Run migrations:
   ```bash
   cd database
   ./migrate.sh
   ```

This setup ensures:
- ✅ Isolated development environment
- ✅ Safe testing of database changes
- ✅ Clear tracking of schema changes

### Creating New Migrations

When making database changes:
1. Create a new migration file:
   ```bash
   cd database/migrations
   touch "$(date +%s)_description.sql"
   ```
2. Follow the migration template:
   ```sql
   -- Migration: description
   -- Description: What this migration does
   -- Created at: YYYY-MM-DD
   
   -- Record this migration
   INSERT INTO migrations (name) VALUES ('description');
   
   -- Your changes here
   CREATE TABLE IF NOT EXISTS example (...);
   
   -- Rollback instructions (comment out)
   -- DROP TABLE IF EXISTS example;
   ```
3. Test in your development environment first
4. Include in your PR with:
   - Description of changes
   - Rollback instructions
   - Testing steps

### Checking Migration Status

```sql
-- List applied migrations
SELECT name, executed_at 
FROM migrations 
ORDER BY executed_at;

-- Check pending migrations
SELECT m.name 
FROM (
  SELECT unnest(ARRAY[
    '00001_initial_schema',
    '00002_storage_and_rls',
    '00003_triggers'
    -- Add new migrations here
  ]) AS name
) m 
LEFT JOIN migrations am ON m.name = am.name 
WHERE am.name IS NULL;
```

## Testing

The project uses a structured testing approach:

```
tests/
├── unit/           # Unit tests for individual components
├── integration/    # Integration tests between components
├── api/            # API endpoint tests
└── scripts/        # Test helper scripts
```

Run tests:
```bash
# Run all tests
bun test

# Run specific test suite
bun test tests/unit
bun test tests/integration
bun test tests/api

# Run specific test file
bun test tests/unit/location.test.ts
```

## Environment Variables

All environment variables should be in the `.env` file:

```env
# Database
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Application
JWT_SECRET=your_jwt_secret
CORS_ORIGIN=http://localhost:3001
```

## API Documentation

### Authentication
- `POST /auth/login` - Login user
- `POST /auth/register` - Register new user

### Profile
- `GET /api/profile` - Get user profile
- `PATCH /api/profile` - Update profile
- `DELETE /api/profile` - Delete account
- `POST /api/profile/avatar` - Upload avatar

### Properties
- `GET /api/properties` - List properties
- `POST /api/properties` - Create property
- `GET /api/properties/:id` - Get property
- `PUT /api/properties/:id` - Update property
- `DELETE /api/properties/:id` - Delete property

### Locations
- `GET /api/locations/autocomplete` - Get location suggestions
- `GET /api/locations/popular` - Get popular locations
- `GET /api/locations/health` - Service health check

### Bookings
- `GET /api/bookings/:id` - Get booking
- `POST /api/bookings` - Create booking
- `PATCH /api/bookings/:id` - Update booking
- `DELETE /api/bookings/:id` - Delete booking

## Project Structure

```
apps/backend/
├── src/
│   ├── controllers/    # Request handlers
│   ├── middleware/     # Express middleware
│   ├── routes/        # API routes
│   ├── services/      # Business logic
│   └── types/         # TypeScript types
├── tests/
│   ├── unit/         # Unit tests
│   ├── integration/  # Integration tests
│   ├── api/          # API tests
│   └── scripts/      # Test helpers
├── database/
│   └── migrations/   # Database migrations
└── docker/          # Docker configuration
```

## Security Features

- JWT authentication
- Row Level Security (RLS) in Supabase
- Rate limiting
- Input validation with Zod
- CORS protection
- File upload restrictions

## Contributing

1. Create a feature branch
2. Make your changes
3. Add tests
4. Create a pull request