#!/bin/bash

# Stellar Contract Deployment Script
# Deploys all smart contracts to testnet using stellar contract deploy

set -e

# Load configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/utils/network-config.sh"
source "$SCRIPT_DIR/utils/test-helpers.sh"
source "$SCRIPT_DIR/utils/contract-addresses.sh"

# Configuration
CONTRACTS=("booking" "property-listing" "review-contract")
WASM_DIR="$CONTRACTS_DIR/target/wasm32-unknown-unknown/release"
DEPLOYMENT_LOG="$TESTS_DIR/logs/deployment-$(date +%Y%m%d-%H%M%S).log"

log_info "Starting contract deployment to $STELLAR_NETWORK..."
log_info "WASM directory: $WASM_DIR"
log_info "Deployment log: $DEPLOYMENT_LOG"

# Create logs directory
mkdir -p "$TESTS_DIR/logs"

# Check if contracts are compiled
log_info "Checking if contracts are compiled..."
for contract in "${CONTRACTS[@]}"; do
    wasm_name=$(echo "$contract" | sed 's/-/_/g')
    wasm_file="$WASM_DIR/${wasm_name}.wasm"
    if [ ! -f "$wasm_file" ]; then
        log_error "Contract not compiled: $wasm_file"
        log_info "Please run: ./tests/cli/compile.sh"
        exit 1
    fi
    log_success "✓ $contract.wasm found"
done

# Check testnet account
log_info "Checking testnet account..."
if ! stellar keys ls | grep -q "testnet-key"; then
    log_error "No testnet account configured!"
    log_info "Please configure your testnet account:"
    log_info "  stellar keys generate --global testnet"
    log_info "  stellar account create --global testnet --source-key <your-key>"
    log_info "  stellar account fund --global testnet <your-address>"
    exit 1
fi

# Get account info
ACCOUNT_ID=$(stellar keys address testnet-key)
log_success "Using account: $ACCOUNT_ID"

log_success "Account configured: $ACCOUNT_ID"
log_info "Proceeding with deployment..."

# Initialize contract addresses
init_contract_addresses

# Deploy each contract
log_info "Starting contract deployment..."
for contract in "${CONTRACTS[@]}"; do
    log_info "Deploying contract: $contract"
    
    wasm_name=$(echo "$contract" | sed 's/-/_/g')
    wasm_file="$WASM_DIR/${wasm_name}.wasm"
    contract_name=$(echo "$contract" | sed 's/-/_/g')
    
    # Deploy contract
    log_info "Running: stellar contract deploy --source-account testnet-key --wasm $wasm_file --network testnet --rpc-url https://soroban-testnet.stellar.org:443 --network-passphrase \"Test SDF Network ; September 2015\""
    
    if DEPLOY_OUTPUT=$(stellar contract deploy --source-account testnet-key --wasm "$wasm_file" --network testnet --rpc-url https://soroban-testnet.stellar.org:443 --network-passphrase "Test SDF Network ; September 2015" 2>&1); then
        # Extract contract ID from output
        CONTRACT_ID=$(echo "$DEPLOY_OUTPUT" | grep -o 'Contract ID: [A-Z0-9]*' | awk '{print $3}')
        
        if [ -n "$CONTRACT_ID" ]; then
            log_success "Successfully deployed $contract"
            log_info "Contract ID: $CONTRACT_ID"
            
            # Store contract address
            set_contract_address "$contract_name" "$CONTRACT_ID"
            
            # Log deployment details
            echo "$(date -u +"%Y-%m-%dT%H:%M:%SZ") - Deployed $contract: $CONTRACT_ID" >> "$DEPLOYMENT_LOG"
            
            # Wait a moment between deployments
            sleep 2
        else
            log_error "Failed to extract contract ID for $contract"
            log_error "Deploy output: $DEPLOY_OUTPUT"
            exit 1
        fi
    else
        log_error "Failed to deploy $contract"
        log_error "Deploy output: $DEPLOY_OUTPUT"
        exit 1
    fi
done

# Update deployment timestamp
update_deployment_timestamp

# Verify all contracts are deployed
log_info "Verifying contract deployments..."
for contract in "${CONTRACTS[@]}"; do
    contract_name=$(echo "$contract" | sed 's/-/_/g')
    contract_id=$(get_contract_address "$contract_name")
    
    if [ "$contract_id" != "null" ] && [ -n "$contract_id" ]; then
        log_success "✓ $contract deployed: $contract_id"
        
        # Verify contract exists on network
        if stellar contract show --global testnet "$contract_id" &> /dev/null; then
            log_success "✓ $contract verified on network"
        else
            log_warning "⚠ $contract not found on network (may need time to propagate)"
        fi
    else
        log_error "✗ $contract deployment failed"
        exit 1
    fi
done

# Initialize contracts (if needed)
log_info "Initializing contracts..."

# Initialize booking contract
BOOKING_CONTRACT_ID=$(get_contract_address "booking")
if [ "$BOOKING_CONTRACT_ID" != "null" ]; then
    log_info "Initializing booking contract..."
    if stellar contract invoke \
        --global testnet \
        --contract-id "$BOOKING_CONTRACT_ID" \
        --function initialize \
        &> /dev/null; then
        log_success "Booking contract initialized"
    else
        log_warning "Booking contract initialization failed (may already be initialized)"
    fi
fi

# Display deployment summary
log_info "Deployment Summary"
log_info "================="
print_contract_addresses

# Create deployment report
log_info "Creating deployment report..."
cat > "$TESTS_DIR/logs/deployment-report-$(date +%Y%m%d-%H%M%S).json" << EOF
{
  "deployment_timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "network": "$STELLAR_NETWORK",
  "account_id": "$ACCOUNT_ID",
  "account_balance": "$BALANCE",
  "contracts": {
EOF

for i in "${!CONTRACTS[@]}"; do
    contract="${CONTRACTS[$i]}"
    contract_name=$(echo "$contract" | sed 's/-/_/g')
    contract_id=$(get_contract_address "$contract_name")
    
    cat >> "$TESTS_DIR/logs/deployment-report-$(date +%Y%m%d-%H%M%S).json" << EOF
    "$contract": {
      "contract_id": "$contract_id",
      "wasm_file": "$WASM_DIR/${contract}.wasm",
      "status": "deployed"
    }EOF
    
    if [ $i -lt $((${#CONTRACTS[@]} - 1)) ]; then
        echo "," >> "$TESTS_DIR/logs/deployment-report-$(date +%Y%m%d-%H%M%S).json"
    fi
done

cat >> "$TESTS_DIR/logs/deployment-report-$(date +%Y%m%d-%H%M%S).json" << EOF
  },
  "stellar_cli_version": "$(stellar version 2>&1 | head -n1)",
  "rpc_url": "$STELLAR_RPC_URL",
  "horizon_url": "$STELLAR_HORIZON_URL"
}
EOF

# Run basic connectivity tests
log_info "Running connectivity tests..."

# Test 1: Check if contracts are accessible
run_test "Contract accessibility" "stellar contract show --global testnet $BOOKING_CONTRACT_ID" "success"

# Test 2: Check if we can invoke a simple function
run_test "Contract invocation" "stellar contract invoke --global testnet --contract-id $BOOKING_CONTRACT_ID --function check_availability -- 'PROP_TEST' 1704067200 1704153600" "success"

# Print test summary
print_test_summary

log_success "Contract deployment completed successfully!"
log_info "Contract addresses saved to: $CONTRACT_ADDRESSES_FILE"
log_info "Deployment log: $DEPLOYMENT_LOG"

echo
log_info "Next steps:"
log_info "1. Run booking tests: ./tests/cli/test-booking.sh"
log_info "2. Run property listing tests: ./tests/cli/test-property-listing.sh"
log_info "3. Run review tests: ./tests/cli/test-review.sh"
log_info "4. Run integration tests: ./tests/cli/integration-test.sh"

# Export contract addresses for other scripts
export BOOKING_CONTRACT_ID
export PROPERTY_LISTING_CONTRACT_ID=$(get_contract_address "property_listing")
export REVIEW_CONTRACT_ID=$(get_contract_address "review_contract")

exit $?
