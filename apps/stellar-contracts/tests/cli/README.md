# Stellar CLI Contract Testing Suite

This directory contains comprehensive CLI-based tests for the StellarRent smart contracts using the official Stellar CLI tools.

## Overview

This test suite replaces the broken test scripts with official Stellar CLI commands to:
- Compile contracts using `stellar contract build`
- Deploy contracts to testnet using `stellar contract deploy`
- Test contract functions using `stellar contract invoke`
- Validate contract deployment and function execution

## Test Structure

```
tests/cli/
├── README.md                 # This file
├── setup.sh                 # Environment setup and prerequisites
├── compile.sh               # Contract compilation script
├── deploy.sh                # Contract deployment to testnet
├── test-booking.sh          # Booking contract tests
├── test-property-listing.sh # Property listing contract tests
├── test-review.sh           # Review contract tests
├── integration-test.sh      # Cross-contract integration tests
├── cleanup.sh               # Test cleanup and teardown
├── utils/
│   ├── test-helpers.sh      # Common test utilities
│   ├── network-config.sh    # Network configuration
│   └── contract-addresses.sh # Contract address management
└── fixtures/
    ├── test-data.json       # Test data fixtures
    └── expected-results.json # Expected test results
```

## Prerequisites

1. **Stellar CLI**: Install the latest Stellar CLI
   ```bash
   curl -s https://get.stellar.org | bash
   ```

2. **Testnet Account**: Create a testnet account with XLM
   ```bash
   stellar keys generate --global testnet
   stellar account create --global testnet --source-key <your-key>
   ```

3. **Environment Variables**: Set up your test environment
   ```bash
   export STELLAR_NETWORK=testnet
   export STELLAR_RPC_URL=https://soroban-testnet.stellar.org:443
   export STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org
   ```

## Quick Start

1. **Setup Environment**:
   ```bash
   ./tests/cli/setup.sh
   ```

2. **Compile Contracts**:
   ```bash
   ./tests/cli/compile.sh
   ```

3. **Deploy to Testnet**:
   ```bash
   ./tests/cli/deploy.sh
   ```

4. **Run Tests**:
   ```bash
   ./tests/cli/test-booking.sh
   ./tests/cli/test-property-listing.sh
   ./tests/cli/test-review.sh
   ./tests/cli/integration-test.sh
   ```

5. **Cleanup**:
   ```bash
   ./tests/cli/cleanup.sh
   ```

## Test Categories

### 1. Unit Tests
- Contract initialization
- Function parameter validation
- Error handling
- Edge cases

### 2. Integration Tests
- Cross-contract interactions
- End-to-end workflows
- Data consistency

### 3. Security Tests
- Authorization checks
- Input validation
- Reentrancy prevention
- Access control

### 4. Performance Tests
- Gas optimization
- Transaction limits
- Concurrent operations

## Test Results

All tests output results in JSON format for easy parsing and CI/CD integration:

```json
{
  "testSuite": "booking-contract",
  "timestamp": "2024-01-15T10:30:00Z",
  "network": "testnet",
  "contractId": "CB3ILSDNHL6TWZYZJAS4L27GLHNAGW4ISW6YXIBHGHL4QYI4JPLP6W3E",
  "results": {
    "total": 15,
    "passed": 14,
    "failed": 1,
    "tests": [...]
  }
}
```

## Continuous Integration

These scripts are designed to work with CI/CD pipelines:

```yaml
# .github/workflows/contract-tests.yml
name: Contract Tests
on: [push, pull_request]
jobs:
  test-contracts:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Stellar CLI
        run: curl -s https://get.stellar.org | bash
      - name: Run Contract Tests
        run: ./tests/cli/integration-test.sh
```

## Troubleshooting

### Common Issues

1. **Network Connection**: Ensure testnet connectivity
2. **Account Balance**: Maintain sufficient XLM for transactions
3. **Contract Deployment**: Check for deployment conflicts
4. **Transaction Timeouts**: Increase timeout values for slow networks

### Debug Mode

Enable debug output:
```bash
export DEBUG=true
./tests/cli/test-booking.sh
```

## Contributing

When adding new tests:
1. Follow the existing script structure
2. Include proper error handling
3. Add test data to fixtures/
4. Update this README with new test descriptions
5. Ensure tests work in both local and CI environments

## Resources

- [Stellar CLI Documentation](https://developers.stellar.org/docs/tools/cli/stellar-cli)
- [Soroban Smart Contracts](https://developers.stellar.org/docs/build/smart-contracts)
- [Stellar Testnet](https://developers.stellar.org/docs/glossary/testnet/)
