# Blockchain Integration for StellarRent

This document provides a comprehensive overview of the blockchain integration implemented for StellarRent, including property synchronization, booking management, and state verification.

## Overview

The StellarRent blockchain integration provides:

- **Property Data Sync**: Automatic synchronization of property data with Stellar smart contracts
- **Booking Management**: Complete booking lifecycle management on-chain with escrow integration
- **State Verification**: Endpoints to verify data integrity between database and blockchain
- **Event Synchronization**: Bidirectional sync service to keep database and blockchain in sync
- **Comprehensive Testing**: Full test suite for all blockchain operations

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend       │    │   Blockchain    │
│                 │    │                  │    │                 │
│ Property Forms  │───▶│ Property Service │───▶│ Property        │
│ Booking Forms   │    │ Booking Service  │    │ Contract        │
│ Verification UI │    │ Sync Service     │    │ Booking Contract│
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              │                        │
                              ▼                        │
                       ┌──────────────────┐            │
                       │    Supabase      │            │
                       │                  │            │
                       │ - Properties     │◄───────────┘
                       │ - Bookings       │
                       │ - Sync Events    │
                       │ - Sync Logs      │
                       └──────────────────┘
```

## Implementation Details

### 1. Property Synchronization

#### Components

- **PropertyListingContract** (`src/blockchain/propertyListingContract.ts`)
- **Property Service** (`src/services/property.service.ts`)
- **Property Controller** with verification endpoint

#### Features

- Automatic blockchain sync on property creation/update
- Hash-based integrity verification
- Status synchronization (Available, Booked, Maintenance, Inactive)
- Verification endpoint: `GET /api/properties/:id/verify`

#### Process Flow

1. Property created via API → Database insert
2. Extract hash data → Generate SHA-256 hash
3. Call `createPropertyListing()` → Store on blockchain
4. Update database with `property_token` (blockchain hash)
5. Log sync event for monitoring

### 2. Booking Management

#### Components

- **BookingContract** (`src/blockchain/bookingContract.ts`)
- **Booking Service** (`src/services/booking.service.ts`)
- **TrustlessWork Integration** for escrow

#### Features

- End-to-end booking creation with blockchain sync
- Escrow integration for secure payments
- Status updates synchronized bidirectionally
- Availability checking through blockchain

#### Process Flow

1. Booking request → Validate property and dates
2. Create escrow → TrustlessWork integration
3. Create booking on blockchain → Get blockchain booking ID
4. Store in database with escrow and blockchain references
5. Handle status updates through sync service

### 3. Sync Service

#### Components

- **SyncService** (`src/services/sync.service.ts`)
- **Sync Controller** (`src/controllers/sync.controller.ts`)
- **Database tables**: `sync_state`, `sync_events`, `sync_logs`

#### Features

- Configurable polling intervals (1-300 seconds)
- Event processing for multiple contract types
- Network validation and error handling
- Admin-only access with comprehensive logging
- Manual sync triggers and statistics

#### Event Types Supported

- `booking_created`, `booking_updated`, `booking_cancelled`
- `payment_confirmed`, `escrow_created`, `escrow_released`
- `property_created`, `property_updated`

### 4. Verification Endpoints

#### Property Verification

```http
GET /api/properties/:id/verify
```

Compares database property data with blockchain hash to ensure integrity.

#### Blockchain State Verification

```http
GET /api/sync/verify
```

Admin endpoint to verify overall blockchain synchronization health.

## Configuration

### Environment Variables

```env
# Blockchain Configuration
SOROBAN_RPC_URL=https://soroban-testnet.stellar.org
SOROBAN_CONTRACT_ID=<your-contract-id>
SOROBAN_NETWORK_PASSPHRASE=Test SDF Network ; September 2015
SOROBAN_SECRET_KEY=<your-secret-key>

# Sync Service Configuration
SYNC_POLL_INTERVAL=5000  # milliseconds (1000-300000)

# Mock Mode (for testing/development)
USE_MOCK=true
```

### Admin Configuration

Set admin users for sync management:

```env
ADMIN_EMAILS=admin@stellarrent.com,admin2@stellarrent.com
ADMIN_USER_IDS=uuid1,uuid2
```

## Database Schema

### Properties Table

```sql
-- Added blockchain integration fields
ALTER TABLE properties ADD COLUMN property_token TEXT; -- Blockchain hash
```

### Bookings Table

```sql
-- Added blockchain integration fields
ALTER TABLE bookings ADD COLUMN blockchain_booking_id TEXT;
ALTER TABLE bookings ADD COLUMN escrow_address TEXT NOT NULL;
```

### Sync Tables

- **sync_state**: Tracks overall sync progress and statistics
- **sync_events**: Stores individual blockchain events for processing
- **sync_logs**: Comprehensive logging for all blockchain operations

## API Endpoints

### Property Endpoints

- `POST /api/properties` - Create property (auto-syncs with blockchain)
- `PUT /api/properties/:id` - Update property (syncs changes)
- `GET /api/properties/:id/verify` - Verify blockchain integrity

### Booking Endpoints

- `POST /api/bookings` - Create booking (blockchain + escrow)
- `PUT /api/bookings/:id/status` - Update status (syncs to blockchain)
- `POST /api/bookings/:id/cancel` - Cancel booking (handles rollback)

### Sync Management (Admin Only)

- `GET /api/sync/status` - Get sync service status
- `POST /api/sync/start` - Start sync service
- `POST /api/sync/stop` - Stop sync service
- `POST /api/sync/trigger` - Manual sync trigger
- `GET /api/sync/events` - Get sync events with pagination
- `GET /api/sync/logs` - Get sync logs with filtering
- `GET /api/sync/dashboard` - Sync dashboard data
- `GET /api/sync/verify` - Verify blockchain state
- `POST /api/sync/retry-failed` - Retry failed events
- `DELETE /api/sync/clear-old` - Clear old sync data

## Testing

### Test Files

- `tests/unit/blockchain.test.ts` - Unit tests for contract functions
- `tests/unit/sync-service.test.ts` - Sync service unit tests
- `tests/integration/blockchain-integration.test.ts` - End-to-end tests

### Running Tests

```bash
# Run all blockchain tests
bun run test:blockchain

# Run specific test suites
bun test tests/unit/blockchain.test.ts
bun test tests/integration/blockchain-integration.test.ts

# Run with CLI tool
node scripts/test-blockchain-cli.js
```

### Test CLI Commands

```bash
# Full test suite
node scripts/test-blockchain-cli.js all

# Unit tests only
node scripts/test-blockchain-cli.js unit

# Integration tests only
node scripts/test-blockchain-cli.js integration
```

## Mock Mode vs Live Blockchain

### Mock Mode (Development/Testing)

```env
USE_MOCK=true
```

- Uses local hash generation and storage
- No actual blockchain calls
- Instant responses for testing
- All tests pass without external dependencies

### Live Blockchain Mode

```env
USE_MOCK=false
SOROBAN_RPC_URL=https://soroban-testnet.stellar.org
SOROBAN_CONTRACT_ID=<deployed-contract-id>
```

- Makes actual Stellar network calls
- Requires deployed smart contracts
- Network-dependent response times
- Real blockchain state verification

## Error Handling

### Graceful Degradation

- Property/booking creation continues if blockchain sync fails
- Database operations complete with warning messages
- Retry mechanisms for transient failures
- Comprehensive logging for debugging

### Rollback Mechanisms

- Failed booking creation triggers escrow cancellation
- Database rollback on critical blockchain failures
- Failed event processing marked for retry

### Monitoring

- Sync service health monitoring
- Failed event tracking and retry
- Blockchain operation logging
- Performance metrics collection

## Security Considerations

### Authentication

- JWT token validation for all endpoints
- Admin-only access for sync management
- User authorization for booking operations

### Data Validation

- Input sanitization and validation
- SQL injection prevention
- XSS protection headers
- Rate limiting on sensitive endpoints

### Blockchain Security

- Secure key management for contract interactions
- Network passphrase validation
- Transaction signing with proper keys
- Error handling to prevent information leakage

## Performance Optimization

### Caching

- Property search cache invalidation on updates
- Sync state caching for frequent requests
- Database query optimization with indexes

### Batching

- Event processing in configurable batches
- Database operations batched where possible
- Parallel processing for independent operations

### Monitoring

- Sync service performance metrics
- Database query performance tracking
- Blockchain interaction timing
- Failed operation analysis

## Deployment

### Production Checklist

- [ ] Set production Stellar network configuration
- [ ] Deploy smart contracts to mainnet
- [ ] Configure proper admin users
- [ ] Set up monitoring and alerting
- [ ] Configure backup for sync state
- [ ] Test failover scenarios
- [ ] Set reasonable polling intervals
- [ ] Enable comprehensive logging

### Environment Setup

1. Deploy Stellar contracts to target network
2. Update environment variables with contract IDs
3. Initialize database with migration scripts
4. Configure admin users for sync management
5. Start sync service and verify operation
6. Monitor initial sync and event processing

## Troubleshooting

### Common Issues

**Sync Service Won't Start**

- Check environment variables are set
- Verify network passphrase is valid
- Ensure RPC URL is accessible
- Check database connectivity

**Property Verification Fails**

- Verify property exists on blockchain
- Check hash generation consistency
- Ensure property data hasn't been modified
- Review blockchain transaction logs

**Booking Creation Fails**

- Check user wallet addresses are set
- Verify property exists and is available
- Ensure escrow creation is working
- Review blockchain booking errors

### Debug Commands

```bash
# Check sync service status
curl -H "Authorization: Bearer <admin-token>" \
  http://localhost:3000/api/sync/status

# Verify property blockchain state
curl http://localhost:3000/api/properties/:id/verify

# View recent sync events
curl -H "Authorization: Bearer <admin-token>" \
  http://localhost:3000/api/sync/events?limit=10

# Check sync logs for errors
curl -H "Authorization: Bearer <admin-token>" \
  "http://localhost:3000/api/sync/logs?status=error&limit=20"
```

## Future Enhancements

### Planned Features

- Multi-signature contract support
- Cross-chain bridge integration
- Enhanced retry mechanisms with exponential backoff
- Real-time WebSocket notifications for sync events
- Advanced blockchain analytics and reporting
- Automated contract upgrade handling

### Performance Improvements

- Event streaming instead of polling
- Optimistic blockchain updates
- Bulk processing for large datasets
- Advanced caching strategies
- Database sharding for scale

This blockchain integration provides a robust, scalable foundation for StellarRent's decentralized property management system while maintaining data integrity and user experience.
