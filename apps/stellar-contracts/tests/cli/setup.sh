#!/bin/bash

# Stellar CLI Test Environment Setup
# This script sets up the environment for testing Stellar smart contracts

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running in debug mode
DEBUG=${DEBUG:-false}
if [ "$DEBUG" = "true" ]; then
    set -x
fi

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
CONTRACTS_DIR="$PROJECT_ROOT"
TESTS_DIR="$SCRIPT_DIR"
UTILS_DIR="$TESTS_DIR/utils"
FIXTURES_DIR="$TESTS_DIR/fixtures"

# Network configuration
STELLAR_NETWORK=${STELLAR_NETWORK:-testnet}
STELLAR_RPC_URL=${STELLAR_RPC_URL:-https://soroban-testnet.stellar.org:443}
STELLAR_HORIZON_URL=${STELLAR_HORIZON_URL:-https://horizon-testnet.stellar.org}
STELLAR_NETWORK_PASSPHRASE=${STELLAR_NETWORK_PASSPHRASE:-"Test SDF Network ; September 2015"}

log_info "Setting up Stellar CLI test environment..."
log_info "Project root: $PROJECT_ROOT"
log_info "Network: $STELLAR_NETWORK"

# Create necessary directories
log_info "Creating test directories..."
mkdir -p "$UTILS_DIR"
mkdir -p "$FIXTURES_DIR"
mkdir -p "$TESTS_DIR/logs"

# Check prerequisites
log_info "Checking prerequisites..."

# Check if Stellar CLI is installed
if ! command -v stellar &> /dev/null; then
    log_error "Stellar CLI is not installed!"
    log_info "Installing Stellar CLI..."
    curl -s https://get.stellar.org | bash
    if ! command -v stellar &> /dev/null; then
        log_error "Failed to install Stellar CLI. Please install manually."
        exit 1
    fi
fi

# Check Stellar CLI version
STELLAR_VERSION=$(stellar version 2>&1 | head -n1)
log_success "Stellar CLI installed: $STELLAR_VERSION"

# Check if we're in the right directory
if [ ! -d "$CONTRACTS_DIR" ]; then
    log_error "Contracts directory not found: $CONTRACTS_DIR"
    exit 1
fi

# Check if contracts exist
CONTRACTS=("booking" "property-listing" "review-contract")
for contract in "${CONTRACTS[@]}"; do
    if [ ! -d "$CONTRACTS_DIR/contracts/$contract" ]; then
        log_error "Contract directory not found: $CONTRACTS_DIR/contracts/$contract"
        exit 1
    fi
done

log_success "All contract directories found"

# Check for testnet account
log_info "Checking for testnet account..."

# Try to get account info (this will fail if no account is configured)
if ! stellar account info --global testnet &> /dev/null; then
    log_warning "No testnet account configured"
    log_info "To create a testnet account, run:"
    log_info "  stellar keys generate --global testnet"
    log_info "  stellar account create --global testnet --source-key <your-key>"
    log_info "  stellar account fund --global testnet <your-address>"
else
    log_success "Testnet account configured"
fi

# Create network configuration file
log_info "Creating network configuration..."
cat > "$UTILS_DIR/network-config.sh" << EOF
#!/bin/bash
# Network configuration for Stellar CLI tests

export STELLAR_NETWORK="$STELLAR_NETWORK"
export STELLAR_RPC_URL="$STELLAR_RPC_URL"
export STELLAR_HORIZON_URL="$STELLAR_HORIZON_URL"
export STELLAR_NETWORK_PASSPHRASE="$STELLAR_NETWORK_PASSPHRASE"

# Contract directories
export CONTRACTS_DIR="$CONTRACTS_DIR"
export TESTS_DIR="$TESTS_DIR"
export UTILS_DIR="$UTILS_DIR"
export FIXTURES_DIR="$FIXTURES_DIR"

# Test configuration
export DEBUG="$DEBUG"
export TEST_TIMEOUT=30
export MAX_RETRIES=3
EOF

# Create test helpers
log_info "Creating test helper utilities..."
cat > "$UTILS_DIR/test-helpers.sh" << 'EOF'
#!/bin/bash
# Common test utilities for Stellar CLI tests

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Test result tracking
TEST_RESULTS=()
TEST_COUNT=0
PASSED_COUNT=0
FAILED_COUNT=0

# Test functions
run_test() {
    local test_name="$1"
    local test_command="$2"
    local expected_result="$3"
    
    TEST_COUNT=$((TEST_COUNT + 1))
    log_info "Running test: $test_name"
    
    if eval "$test_command" > /dev/null 2>&1; then
        if [ "$expected_result" = "success" ]; then
            log_success "PASS: $test_name"
            PASSED_COUNT=$((PASSED_COUNT + 1))
            TEST_RESULTS+=("PASS:$test_name")
        else
            log_error "FAIL: $test_name (expected failure but succeeded)"
            FAILED_COUNT=$((FAILED_COUNT + 1))
            TEST_RESULTS+=("FAIL:$test_name")
        fi
    else
        if [ "$expected_result" = "failure" ]; then
            log_success "PASS: $test_name (expected failure)"
            PASSED_COUNT=$((PASSED_COUNT + 1))
            TEST_RESULTS+=("PASS:$test_name")
        else
            log_error "FAIL: $test_name"
            FAILED_COUNT=$((FAILED_COUNT + 1))
            TEST_RESULTS+=("FAIL:$test_name")
        fi
    fi
}

# Contract invocation helper
invoke_contract() {
    local contract_id="$1"
    local function_name="$2"
    local args="$3"
    
    stellar contract invoke \
        --global "$STELLAR_NETWORK" \
        --contract-id "$contract_id" \
        --function "$function_name" \
        $args
}

# Wait for transaction confirmation
wait_for_transaction() {
    local tx_hash="$1"
    local max_wait=${2:-30}
    
    log_info "Waiting for transaction confirmation: $tx_hash"
    
    for i in $(seq 1 $max_wait); do
        if stellar transaction show --global "$STELLAR_NETWORK" "$tx_hash" > /dev/null 2>&1; then
            log_success "Transaction confirmed"
            return 0
        fi
        sleep 1
    done
    
    log_error "Transaction timeout"
    return 1
}

# Generate test data
generate_test_data() {
    local data_type="$1"
    
    case "$data_type" in
        "property_id")
            echo "PROP_$(date +%s)_$$"
            ;;
        "user_id")
            echo "USER_$(date +%s)_$$"
            ;;
        "booking_id")
            echo "$(date +%s)"
            ;;
        *)
            echo "UNKNOWN_$(date +%s)_$$"
            ;;
    esac
}

# Print test summary
print_test_summary() {
    echo
    log_info "Test Summary"
    log_info "============"
    log_info "Total tests: $TEST_COUNT"
    log_success "Passed: $PASSED_COUNT"
    if [ $FAILED_COUNT -gt 0 ]; then
        log_error "Failed: $FAILED_COUNT"
    else
        log_success "Failed: $FAILED_COUNT"
    fi
    
    if [ $FAILED_COUNT -gt 0 ]; then
        echo
        log_error "Failed tests:"
        for result in "${TEST_RESULTS[@]}"; do
            if [[ $result == FAIL:* ]]; then
                log_error "  - ${result#FAIL:}"
            fi
        done
    fi
    
    return $FAILED_COUNT
}

# Cleanup function
cleanup() {
    log_info "Cleaning up test environment..."
    # Add cleanup logic here
}

# Set up signal handlers
trap cleanup EXIT
EOF

# Create contract address management
log_info "Creating contract address management..."
cat > "$UTILS_DIR/contract-addresses.sh" << 'EOF'
#!/bin/bash
# Contract address management for tests

CONTRACT_ADDRESSES_FILE="$TESTS_DIR/contract-addresses.json"

# Initialize contract addresses file if it doesn't exist
init_contract_addresses() {
    if [ ! -f "$CONTRACT_ADDRESSES_FILE" ]; then
        cat > "$CONTRACT_ADDRESSES_FILE" << 'JSON'
{
  "booking": null,
  "property-listing": null,
  "review-contract": null,
  "deployment_timestamp": null,
  "network": "testnet"
}
JSON
    fi
}

# Get contract address
get_contract_address() {
    local contract_name="$1"
    init_contract_addresses
    
    jq -r ".$contract_name" "$CONTRACT_ADDRESSES_FILE"
}

# Set contract address
set_contract_address() {
    local contract_name="$1"
    local address="$2"
    
    init_contract_addresses
    
    # Update the JSON file
    jq --arg name "$contract_name" --arg addr "$address" \
       '.($name) = $addr' "$CONTRACT_ADDRESSES_FILE" > "$CONTRACT_ADDRESSES_FILE.tmp" && \
    mv "$CONTRACT_ADDRESSES_FILE.tmp" "$CONTRACT_ADDRESSES_FILE"
}

# Update deployment timestamp
update_deployment_timestamp() {
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    
    init_contract_addresses
    
    jq --arg ts "$timestamp" '.deployment_timestamp = $ts' \
       "$CONTRACT_ADDRESSES_FILE" > "$CONTRACT_ADDRESSES_FILE.tmp" && \
    mv "$CONTRACT_ADDRESSES_FILE.tmp" "$CONTRACT_ADDRESSES_FILE"
}

# Check if all contracts are deployed
all_contracts_deployed() {
    init_contract_addresses
    
    local booking=$(get_contract_address "booking")
    local property=$(get_contract_address "property-listing")
    local review=$(get_contract_address "review-contract")
    
    if [ "$booking" != "null" ] && [ "$property" != "null" ] && [ "$review" != "null" ]; then
        return 0
    else
        return 1
    fi
}

# Print contract addresses
print_contract_addresses() {
    init_contract_addresses
    
    echo "Contract Addresses:"
    echo "==================="
    echo "Booking Contract: $(get_contract_address "booking")"
    echo "Property Listing Contract: $(get_contract_address "property-listing")"
    echo "Review Contract: $(get_contract_address "review-contract")"
    echo "Deployed: $(jq -r '.deployment_timestamp' "$CONTRACT_ADDRESSES_FILE")"
}
EOF

# Create test data fixtures
log_info "Creating test data fixtures..."
cat > "$FIXTURES_DIR/test-data.json" << 'EOF'
{
  "test_properties": [
    {
      "id": "PROP_TEST_001",
      "data_hash": "hash123456789",
      "owner": "GALAXY_TEST_OWNER_001"
    },
    {
      "id": "PROP_TEST_002", 
      "data_hash": "hash987654321",
      "owner": "GALAXY_TEST_OWNER_002"
    }
  ],
  "test_users": [
    {
      "id": "USER_TEST_001",
      "did": "did:stellar:test:user001"
    },
    {
      "id": "USER_TEST_002",
      "did": "did:stellar:test:user002"
    }
  ],
  "test_bookings": [
    {
      "property_id": "PROP_TEST_001",
      "user_id": "USER_TEST_001",
      "start_date": 1704067200,
      "end_date": 1704153600,
      "total_price": 1000000000
    }
  ],
  "test_reviews": [
    {
      "booking_id": "BOOKING_001",
      "reviewer_did": "did:stellar:test:user001",
      "target_did": "did:stellar:test:user002",
      "rating": 5,
      "comment": "Excellent property!"
    }
  ]
}
EOF

# Create expected results
log_info "Creating expected test results..."
cat > "$FIXTURES_DIR/expected-results.json" << 'EOF'
{
  "booking_contract": {
    "initialize": "success",
    "create_booking": "success",
    "check_availability": "success",
    "cancel_booking": "success",
    "get_booking": "success",
    "update_status": "success",
    "invalid_dates": "failure",
    "invalid_price": "failure",
    "unauthorized_cancel": "failure"
  },
  "property_listing_contract": {
    "create_listing": "success",
    "update_listing": "success",
    "update_status": "success",
    "get_listing": "success",
    "duplicate_listing": "failure",
    "unauthorized_update": "failure"
  },
  "review_contract": {
    "submit_review": "success",
    "get_reviews": "success",
    "get_reputation": "success",
    "invalid_rating": "failure",
    "duplicate_review": "failure"
  }
}
EOF

# Make scripts executable
chmod +x "$UTILS_DIR"/*.sh

log_success "Environment setup completed!"
log_info "Next steps:"
log_info "1. Configure your testnet account: stellar keys generate --global testnet"
log_info "2. Compile contracts: ./tests/cli/compile.sh"
log_info "3. Deploy contracts: ./tests/cli/deploy.sh"
log_info "4. Run tests: ./tests/cli/test-booking.sh"

echo
log_info "Environment variables set:"
log_info "STELLAR_NETWORK=$STELLAR_NETWORK"
log_info "STELLAR_RPC_URL=$STELLAR_RPC_URL"
log_info "STELLAR_HORIZON_URL=$STELLAR_HORIZON_URL"
