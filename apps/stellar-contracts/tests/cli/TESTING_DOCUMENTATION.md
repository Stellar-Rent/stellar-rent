# Smart Contract Testing Documentation

## Overview

This document describes the comprehensive CLI-based testing system for Stellar smart contracts in the StellarRent platform. The testing system replaces broken test scripts with official Stellar CLI commands and provides a robust framework for testing smart contracts on the Stellar testnet.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Test Architecture](#test-architecture)
3. [Test Scripts](#test-scripts)
4. [Running Tests](#running-tests)
5. [Test Results](#test-results)
6. [CI/CD Integration](#cicd-integration)
7. [Troubleshooting](#troubleshooting)
8. [Contributing](#contributing)

## Quick Start

### Prerequisites

1. **Stellar CLI**: Install the latest Stellar CLI
   ```bash
   curl -s https://get.stellar.org | bash
   ```

2. **Dependencies**: Install required utilities
   ```bash
   # macOS
   brew install jq bc
   
   # Ubuntu/Debian
   sudo apt-get install jq bc
   ```

3. **Testnet Account**: Create and fund a testnet account
   ```bash
   stellar keys generate --global testnet
   stellar account create --global testnet --source-key <your-key>
   stellar account fund --global testnet <your-address>
   ```

### Running Tests

#### Option 1: Interactive Menu
```bash
cd apps/stellar-contracts
./tests/cli/test.sh
```

#### Option 2: Command Line
```bash
cd apps/stellar-contracts
./tests/cli/run-all-tests.sh
```

#### Option 3: NPM Scripts
```bash
cd apps/stellar-contracts
npm run test:all
```

## Test Architecture

### Directory Structure

```
tests/cli/
├── README.md                 # This documentation
├── setup.sh                 # Environment setup
├── compile.sh               # Contract compilation
├── deploy.sh                # Contract deployment
├── test-booking.sh          # Booking contract tests
├── test-property-listing.sh # Property listing tests
├── test-review.sh           # Review contract tests
├── integration-test.sh      # Cross-contract tests
├── cleanup.sh               # Test cleanup
├── run-all-tests.sh         # Master test runner
├── test.sh                  # Developer-friendly interface
├── utils/
│   ├── test-helpers.sh      # Common utilities
│   ├── network-config.sh    # Network configuration
│   └── contract-addresses.sh # Address management
└── fixtures/
    ├── test-data.json       # Test data
    └── expected-results.json # Expected results
```

### Test Categories

1. **Unit Tests**: Individual contract function testing
2. **Integration Tests**: Cross-contract interaction testing
3. **Security Tests**: Authorization and validation testing
4. **Performance Tests**: Load and stress testing
5. **End-to-End Tests**: Complete user journey testing

## Test Scripts

### Core Scripts

#### `setup.sh`
- Configures test environment
- Checks prerequisites
- Creates necessary directories
- Sets up network configuration

#### `compile.sh`
- Compiles all contracts using `stellar contract build`
- Validates WASM file creation
- Checks file sizes and integrity
- Creates build information

#### `deploy.sh`
- Deploys contracts to Stellar testnet
- Initializes contracts
- Stores contract addresses
- Verifies deployment

#### `test-booking.sh`
Tests the booking contract functions:
- ✅ Contract initialization
- ✅ Booking creation
- ✅ Availability checking
- ✅ Booking cancellation
- ✅ Status updates
- ✅ Escrow integration
- ✅ Error handling
- ✅ Edge cases

#### `test-property-listing.sh`
Tests the property listing contract functions:
- ✅ Property creation
- ✅ Property updates
- ✅ Status management
- ✅ Authorization checks
- ✅ Data integrity
- ✅ Error handling

#### `test-review.sh`
Tests the review contract functions:
- ✅ Review submission
- ✅ Rating validation
- ✅ Duplicate prevention
- ✅ Reputation scoring
- ✅ Data retrieval
- ✅ Error handling

#### `integration-test.sh`
Tests cross-contract interactions:
- ✅ Complete property listing workflow
- ✅ Complete booking workflow
- ✅ Complete review workflow
- ✅ Multi-user scenarios
- ✅ Conflict prevention
- ✅ Data consistency
- ✅ Error handling
- ✅ Performance under load

### Utility Scripts

#### `test-helpers.sh`
Common utilities for all test scripts:
- Test result tracking
- Contract invocation helpers
- Transaction confirmation waiting
- Test data generation
- Summary reporting

#### `network-config.sh`
Network configuration management:
- Environment variables
- Network settings
- Directory paths
- Test configuration

#### `contract-addresses.sh`
Contract address management:
- Address storage and retrieval
- Deployment tracking
- Address validation
- Status reporting

## Running Tests

### Individual Test Scripts

```bash
# Setup environment
./tests/cli/setup.sh

# Compile contracts
./tests/cli/compile.sh

# Deploy to testnet
./tests/cli/deploy.sh

# Test individual contracts
./tests/cli/test-booking.sh
./tests/cli/test-property-listing.sh
./tests/cli/test-review.sh

# Run integration tests
./tests/cli/integration-test.sh

# Cleanup
./tests/cli/cleanup.sh
```

### Master Test Runner

```bash
# Run all tests
./tests/cli/run-all-tests.sh

# Run with verbose output
./tests/cli/run-all-tests.sh --verbose

# Skip certain phases
./tests/cli/run-all-tests.sh --skip-setup --skip-cleanup

# Continue on errors
./tests/cli/run-all-tests.sh --continue-on-error
```

### Developer Interface

```bash
# Interactive menu
./tests/cli/test.sh

# Command line options
./tests/cli/test.sh --all
./tests/cli/test.sh --test-booking
./tests/cli/test.sh --integration
./tests/cli/test.sh --cleanup
```

### NPM Scripts

```bash
# All tests
npm run test:all

# Individual phases
npm run test:setup
npm run test:compile
npm run test:deploy
npm run test:booking
npm run test:property
npm run test:review
npm run test:integration
npm run test:cleanup

# Interactive interface
npm run test
```

## Test Results

### Output Format

All tests generate JSON reports with the following structure:

```json
{
  "test_timestamp": "2024-01-15T10:30:00Z",
  "contract_id": "CB3ILSDNHL6TWZYZJAS4L27GLHNAGW4ISW6YXIBHGHL4QYI4JPLP6W3E",
  "network": "testnet",
  "test_summary": {
    "total_tests": 25,
    "passed": 24,
    "failed": 1
  },
  "test_data": {
    "property_id": "PROP_TEST_123",
    "user_id": "USER_TEST_456",
    "booking_id": "789"
  },
  "test_results": [
    {
      "test": "Create booking",
      "status": "PASS"
    },
    {
      "test": "Invalid dates",
      "status": "FAIL"
    }
  ]
}
```

### Report Locations

- Individual test reports: `tests/cli/logs/*-test-report-*.json`
- Integration test reports: `tests/cli/logs/integration-test-report-*.json`
- Master test reports: `tests/cli/logs/master-test-report-*.json`
- Cleanup reports: `tests/cli/logs/cleanup-report-*.json`

### Contract Addresses

Contract addresses are stored in `tests/cli/contract-addresses.json`:

```json
{
  "booking": "CB3ILSDNHL6TWZYZJAS4L27GLHNAGW4ISW6YXIBHGHL4QYI4JPLP6W3E",
  "property_listing": "PROPERTY_CONTRACT_ID",
  "review_contract": "REVIEW_CONTRACT_ID",
  "deployment_timestamp": "2024-01-15T10:30:00Z",
  "network": "testnet"
}
```

## CI/CD Integration

### GitHub Actions

The testing system includes a comprehensive GitHub Actions workflow (`.github/workflows/contract-tests.yml`) that:

1. **Runs on**: Push to main/develop branches, pull requests, manual triggers
2. **Tests**: All three contracts in parallel
3. **Includes**: Integration tests, security tests, performance tests
4. **Generates**: Comprehensive test reports
5. **Uploads**: Test artifacts for review

### Workflow Jobs

1. **test-contracts**: Tests individual contracts in parallel
2. **integration-tests**: Cross-contract interaction tests
3. **security-tests**: Security-focused testing
4. **performance-tests**: Performance and load testing
5. **generate-report**: Consolidates all test results

### Local CI/CD

```bash
# Run tests locally with CI/CD configuration
export STELLAR_NETWORK=testnet
export VERBOSE=true
./tests/cli/run-all-tests.sh
```

## Troubleshooting

### Common Issues

#### 1. Stellar CLI Not Found
```bash
# Install Stellar CLI
curl -s https://get.stellar.org | bash

# Add to PATH
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

#### 2. Testnet Account Issues
```bash
# Generate new keypair
stellar keys generate --global testnet

# Create account
stellar account create --global testnet --source-key <your-key>

# Fund account
stellar account fund --global testnet <your-address>
```

#### 3. Contract Deployment Failures
```bash
# Check account balance
stellar account info --global testnet

# Fund if needed
stellar account fund --global testnet <your-address>

# Check network connectivity
stellar network --global testnet
```

#### 4. Test Failures
```bash
# Run with verbose output
VERBOSE=true ./tests/cli/test-booking.sh

# Check test logs
ls -la tests/cli/logs/

# Review specific test report
cat tests/cli/logs/booking-test-report-*.json
```

### Debug Mode

Enable debug output for detailed information:

```bash
export DEBUG=true
./tests/cli/test-booking.sh
```

### Network Issues

If experiencing network connectivity issues:

```bash
# Check RPC endpoint
curl -s https://soroban-testnet.stellar.org:443

# Check Horizon endpoint
curl -s https://horizon-testnet.stellar.org

# Test Stellar CLI connectivity
stellar network --global testnet
```

## Contributing

### Adding New Tests

1. **Create test script**: Follow existing script patterns
2. **Add to master runner**: Update `run-all-tests.sh`
3. **Update documentation**: Add test description
4. **Test locally**: Verify all tests pass
5. **Submit PR**: Include test results

### Test Script Template

```bash
#!/bin/bash

# Test Script Template
set -e

# Load configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/utils/network-config.sh"
source "$SCRIPT_DIR/utils/test-helpers.sh"
source "$SCRIPT_DIR/utils/contract-addresses.sh"

# Test configuration
TEST_LOG="$TESTS_DIR/logs/your-test-$(date +%Y%m%d-%H%M%S).log"

log_info "Starting Your Test..."

# Your test logic here
run_test "Test name" "test command" "expected_result"

# Print summary
print_test_summary
```

### Best Practices

1. **Use helper functions**: Leverage `test-helpers.sh` utilities
2. **Generate test data**: Use dynamic test data generation
3. **Handle errors gracefully**: Provide clear error messages
4. **Create reports**: Generate JSON test reports
5. **Clean up**: Remove temporary files and data
6. **Document tests**: Include test descriptions and expected outcomes

## Resources

- [Stellar CLI Documentation](https://developers.stellar.org/docs/tools/cli/stellar-cli)
- [Soroban Smart Contracts](https://developers.stellar.org/docs/build/smart-contracts)
- [Stellar Testnet](https://developers.stellar.org/docs/glossary/testnet/)
- [GitHub Actions](https://docs.github.com/en/actions)

---

**Building the future of decentralized property rentals on Stellar! 🏠✨**
