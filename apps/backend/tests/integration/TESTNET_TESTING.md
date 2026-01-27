# Testnet Integration Testing Guide

## Overview

These integration tests verify the Soroban contract integration works correctly on Stellar testnet with `USE_MOCK=false`. They test the core improvements from PR #195:

- ✅ Centralized configuration
- ✅ Dynamic fee calculation
- ✅ Transaction confirmation polling
- ✅ Retry logic with exponential backoff
- ✅ Error handling and classification

## Prerequisites

### 1. Environment Setup

Create a `.env.test` file or update your `.env` with testnet configuration:

```bash
# Must be false for testnet tests
USE_MOCK=false

# Stellar Testnet Configuration
SOROBAN_RPC_URL=https://soroban-testnet.stellar.org
STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org
SOROBAN_NETWORK_PASSPHRASE=Test SDF Network ; September 2015

# Funded Testnet Account
STELLAR_SECRET_KEY=S... # Your testnet secret key

# Deployed Contracts on Testnet
SOROBAN_CONTRACT_ID=C... # Booking contract ID
PROPERTY_LISTING_CONTRACT_ID=C... # Property contract ID

# Fee Configuration
SOROBAN_DEFAULT_FEE=10000
SOROBAN_BOOKING_FEE=50000
SOROBAN_PROPERTY_FEE=30000

# Transaction Configuration
SOROBAN_TX_TIMEOUT=30
SOROBAN_CONFIRMATION_TIMEOUT=60000
SOROBAN_MAX_RETRIES=3
SOROBAN_RETRY_DELAY=1000
```

### 2. Testnet Account Setup

1. **Generate a testnet keypair** (if you don't have one):
   ```bash
   stellar keys generate --network testnet
   ```

2. **Fund your testnet account** using the friendbot:
   ```bash
   curl "https://friendbot.stellar.org?addr=YOUR_PUBLIC_KEY"
   ```

3. **Verify your account** has XLM:
   ```bash
   stellar account --address YOUR_PUBLIC_KEY --network testnet
   ```

### 3. Deploy Contracts (if not already deployed)

Deploy the booking and property contracts to testnet:

```bash
cd apps/stellar-contracts

# Deploy booking contract
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/booking_contract.wasm \
  --source YOUR_SECRET_KEY \
  --network testnet

# Deploy property contract
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/property_listing_contract.wasm \
  --source YOUR_SECRET_KEY \
  --network testnet
```

## Running Tests

### Run All Integration Tests

```bash
cd apps/backend
bun test tests/integration/testnet-*.test.ts
```

### Run Specific Test Suites

```bash
# Test configuration and network connectivity
bun test tests/integration/testnet-soroban.test.ts

# Test transaction building and submission
bun test tests/integration/testnet-transactions.test.ts

# Test contract calls and confirmation
bun test tests/integration/testnet-confirmation.test.ts
```

### Run with Increased Timeout (for slow networks)

```bash
bun test tests/integration/testnet-*.test.ts --timeout 60000
```

## Test Coverage

### testnet-soroban.test.ts

Tests configuration and basic connectivity:
- ✅ Configuration initialization
- ✅ Contract ID validation
- ✅ Fee configuration
- ✅ RPC server connectivity
- ✅ Horizon server connectivity
- ✅ Dynamic fee fetching
- ✅ Network passphrase validation
- ✅ Timeout and retry configuration

### testnet-transactions.test.ts

Tests transaction handling:
- ✅ Transaction building with configured fees
- ✅ Transaction building with dynamic fees
- ✅ Recommended fee calculation
- ✅ Contract call simulation
- ✅ Error classification
- ✅ Retry logic
- ✅ Account balance queries

### testnet-confirmation.test.ts

Tests contract interactions:
- ✅ Booking availability checks
- ✅ Property listing queries
- ✅ Date validation
- ✅ USDC balance queries
- ✅ Retry on network errors
- ✅ Configuration validation

## Expected Results

### Successful Tests

All tests should pass when:
- Testnet account is funded (has XLM)
- RPC and Horizon endpoints are reachable
- Contracts are deployed (or tests gracefully handle missing contracts)

### Common Issues

#### "Account not found"
- **Cause**: Testnet account not funded
- **Fix**: Fund account with friendbot

#### "Contract not found"
- **Cause**: Contract IDs in .env don't point to deployed contracts
- **Fix**: Deploy contracts or update contract IDs

#### "Connection timeout"
- **Cause**: Network issues or RPC endpoint down
- **Fix**: Check internet connection, try different RPC endpoint

#### "Transaction failed: ERROR"
- **Cause**: Contract error or insufficient XLM for fees
- **Fix**: Check account balance, verify contract is working

## Test Strategy

These tests use a **graceful degradation** approach:

1. **Configuration tests** - Must pass (validate environment setup)
2. **Network connectivity tests** - Must pass (validate RPC/Horizon access)
3. **Read-only operations** - Should pass (simulate transactions)
4. **Write operations** - Commented out (avoid spending testnet XLM)

## CI/CD Integration

To run these tests in CI/CD:

1. **Set up secrets** in GitHub Actions:
   ```yaml
   env:
     USE_MOCK: false
     SOROBAN_RPC_URL: ${{ secrets.SOROBAN_RPC_URL }}
     STELLAR_SECRET_KEY: ${{ secrets.STELLAR_SECRET_KEY }}
     SOROBAN_CONTRACT_ID: ${{ secrets.SOROBAN_CONTRACT_ID }}
     PROPERTY_LISTING_CONTRACT_ID: ${{ secrets.PROPERTY_LISTING_CONTRACT_ID }}
   ```

2. **Add test job** to workflow:
   ```yaml
   test-testnet:
     runs-on: ubuntu-latest
     steps:
       - uses: actions/checkout@v3
       - uses: oven-sh/setup-bun@v1
       - run: bun install
       - run: bun test tests/integration/testnet-*.test.ts
   ```

## Monitoring

After running tests, verify:

1. **Transaction success rate** - Should be high (>95%)
2. **Confirmation time** - Should be under 30 seconds
3. **Retry frequency** - Should be low (retries only on transient failures)
4. **Fee costs** - Should be reasonable (dynamic fees adjust to network)

## Troubleshooting

### Enable Verbose Logging

```bash
DEBUG=stellar:* bun test tests/integration/testnet-*.test.ts
```

### Check Account Balance

```bash
stellar account --address $(stellar keys address --source YOUR_SECRET_KEY) --network testnet
```

### Verify Contract Deployment

```bash
stellar contract invoke \
  --id YOUR_CONTRACT_ID \
  --source-account YOUR_SECRET_KEY \
  --network testnet \
  -- get_listing --property_id "test"
```

## Next Steps

After testnet tests pass:

1. ✅ Run full test suite: `bun test`
2. ✅ Verify existing functionality still works
3. ✅ Deploy to staging environment
4. ✅ Monitor transaction metrics
5. ✅ Deploy to production
