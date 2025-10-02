#!/bin/bash
# Network configuration for Stellar CLI tests

export STELLAR_NETWORK="testnet"
export STELLAR_RPC_URL="https://soroban-testnet.stellar.org:443"
export STELLAR_HORIZON_URL="https://horizon-testnet.stellar.org"
export STELLAR_NETWORK_PASSPHRASE="Test SDF Network ; September 2015"

# Contract directories
export CONTRACTS_DIR="/Users/ew/month2/stellar-rent/apps/stellar-rent/apps/stellar-contracts"
export TESTS_DIR="/Users/ew/month2/stellar-rent/apps/stellar-rent/apps/stellar-contracts/tests/cli"
export UTILS_DIR="/Users/ew/month2/stellar-rent/apps/stellar-rent/apps/stellar-contracts/tests/cli/utils"
export FIXTURES_DIR="/Users/ew/month2/stellar-rent/apps/stellar-rent/apps/stellar-contracts/tests/cli/fixtures"

# Test configuration
export DEBUG="false"
export TEST_TIMEOUT=30
export MAX_RETRIES=3
