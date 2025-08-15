# Booking Controller - Payment Confirmation Test Suite

## Overview

This comprehensive test suite validates the `confirmPayment` endpoint functionality in the booking controller. The tests ensure robust handling of payment confirmation requests through various scenarios including successful cases, input validation, error conditions, and edge cases.

## Key Test Categories

### 1. Core Functionality Tests
- Successful payment confirmation (200 OK response)
- Correct parameter passing to service layers
- Proper response structure including success message

### 2. Authentication & Validation
- User authentication requirements (401 Unauthorized)
- Mandatory field validation (400 Bad Request):
  - bookingId
  - transactionHash  
  - sourcePublicKey

### 3. Error Scenario Coverage
- Booking not found (404)
- Missing escrow address (500)
- Transaction verification failures (400)
- Database operation errors (500)
- Specific business rule violations (400)

## Technical Implementation

### Mocked Dependencies
- **Booking Service**:
  - `getBookingById` mock
  - `confirmBookingPayment` mock

- **Blockchain Service**:
  - `verifyStellarTransaction` mock
  - Supporting method mocks

### Test Architecture
- Module-level mock configuration
- Isolated test cases with beforeEach setup
- Comprehensive assertion checks:
  - HTTP status codes
  - Response body structure
  - Error message formats
  - Service call verification

## Quality Assurance

### Verification Points
- Correct status codes for all scenarios
- Proper error messaging
- Accurate parameter passing between layers
- Complete transaction lifecycle validation
- Edge case handling

### Test Execution
```bash
bun test tests/integraton/confirm-payment.test