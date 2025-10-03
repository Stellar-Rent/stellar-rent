#!/bin/bash
# Network configuration for Stellar CLI tests

export STELLAR_NETWORK="testnet"
export STELLAR_RPC_URL="https://soroban-testnet.stellar.org:443"
export STELLAR_HORIZON_URL="https://horizon-testnet.stellar.org"
export STELLAR_NETWORK_PASSPHRASE="Test SDF Network ; September 2015"

# Contract directories
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export CONTRACTS_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
export TESTS_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
export UTILS_DIR="$SCRIPT_DIR"
export FIXTURES_DIR="$TESTS_DIR/fixtures"

# Test configuration
export DEBUG="false"
export TEST_TIMEOUT=30
export MAX_RETRIES=3
