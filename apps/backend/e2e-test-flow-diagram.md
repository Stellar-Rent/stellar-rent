# Flujo de Tests E2E - Stellar Rent

## Arquitectura de Testing

```
┌─────────────────────────────────────────────────────────────────┐
│                    STELLAR RENT TESTING                        │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   FRONTEND      │    │    BACKEND      │    │   BLOCKCHAIN    │
│   (Next.js)     │    │   (Express)     │    │   (Stellar)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   PLAYWRIGHT    │    │   BUN TESTS     │    │   SOROBAN       │
│   E2E TESTS     │    │   INTEGRATION   │    │   CONTRACTS     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Flujo de Tests E2E Completos

### 1. **Frontend E2E (Playwright)**
```
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND E2E FLOW                           │
└─────────────────────────────────────────────────────────────────┘

User Journey:
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Landing   │───▶│  Property   │───▶│   Booking   │───▶│   Payment   │
│    Page     │    │   Search    │    │   Form      │    │   Process   │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │                   │
       ▼                   ▼                   ▼                   ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Navigation │    │   Filters   │    │ Validation  │    │  Wallet     │
│   Tests     │    │   Tests     │    │   Tests     │    │ Connection  │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

### 2. **Backend Integration Tests (Bun)**
```
┌─────────────────────────────────────────────────────────────────┐
│                   BACKEND INTEGRATION FLOW                     │
└─────────────────────────────────────────────────────────────────┘

API Testing:
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Auth      │───▶│  Property   │───▶│   Booking   │───▶│   Payment   │
│  Endpoints  │    │  Endpoints  │    │  Endpoints  │    │  Endpoints  │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │                   │
       ▼                   ▼                   ▼                   ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Wallet     │    │  Location   │    │  Database   │    │ Blockchain  │
│  Auth       │    │  Services   │    │  Operations │    │ Integration │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

### 3. **Full E2E Flow (Frontend + Backend + Blockchain)**
```
┌─────────────────────────────────────────────────────────────────┐
│                    COMPLETE E2E FLOW                           │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────┐
│   User Action   │
│  (Frontend)     │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │───▶│    Backend      │───▶│   Blockchain    │
│   Validation    │    │   Processing    │    │   Execution     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
          │                       │                       │
          ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   UI Updates    │    │   Database      │    │   Transaction   │
│   & Feedback    │    │   Changes       │    │   Confirmation  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
          │                       │                       │
          └───────────────────────┼───────────────────────┘
                                  ▼
                        ┌─────────────────┐
                        │   Final State   │
                        │   Verification  │
                        └─────────────────┘
```

## Test Categories

### **Frontend E2E Tests (Playwright)**
- ✅ **Navigation Tests**: Menu, routing, page loads
- ✅ **Property Search**: Filters, pagination, results
- ✅ **Booking Flow**: Form validation, date selection
- ✅ **Payment Integration**: Wallet connection, transaction flow
- ✅ **User Authentication**: Login, logout, session management

### **Backend Integration Tests (Bun)**
- ⚠️ **API Endpoints**: CRUD operations, validation
- ⚠️ **Authentication**: JWT, wallet auth, authorization
- ⚠️ **Database Operations**: Supabase integration, transactions
- ⚠️ **Blockchain Integration**: Soroban contracts, escrow
- ⚠️ **Error Handling**: Network failures, validation errors

### **Cross-System Tests**
- ❌ **End-to-End Booking**: Complete user journey
- ❌ **Payment Confirmation**: Frontend → Backend → Blockchain
- ❌ **Real-time Updates**: WebSocket, notifications
- ❌ **Concurrent Operations**: Race conditions, locking

## Current Status

### ✅ **Working**
- Frontend E2E tests (Playwright)
- Basic backend unit tests
- Wallet authentication tests

### ⚠️ **Partially Working**
- Backend integration tests (mixed Jest/Bun)
- Payment confirmation tests
- Location service tests

### ❌ **Broken**
- Complex integration tests (booking-integration.test.ts)
- Supertest-based tests
- Tests with Jest/Bun mixing

## Next Steps

1. **Fix Supertest Issue**: Replace with Bun's native fetch
2. **Complete Jest → Bun Migration**: Remove all Jest references
3. **Simplify Complex Mocks**: Reduce Supabase mock complexity
4. **Implement Missing E2E**: Complete booking-flow.int.test.ts
5. **Add Cross-System Tests**: Frontend + Backend + Blockchain integration

