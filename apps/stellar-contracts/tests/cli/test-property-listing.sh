#!/bin/bash

# Property Listing Contract Test Script
# Tests the property listing contract functions using stellar contract invoke

set -e

# Load configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/utils/network-config.sh"
source "$SCRIPT_DIR/utils/test-helpers.sh"
source "$SCRIPT_DIR/utils/contract-addresses.sh"

# Test configuration
TEST_LOG="$TESTS_DIR/logs/property-listing-test-$(date +%Y%m%d-%H%M%S).log"
TEST_DATA_FILE="$FIXTURES_DIR/test-data.json"

log_info "Starting Property Listing Contract Tests..."
log_info "Test log: $TEST_LOG"

# Create logs directory
mkdir -p "$TESTS_DIR/logs"

# Check if contract is deployed
PROPERTY_CONTRACT_ID=$(get_contract_address "property_listing")
if [ "$PROPERTY_CONTRACT_ID" = "null" ] || [ -z "$PROPERTY_CONTRACT_ID" ]; then
    log_error "Property listing contract not deployed!"
    log_info "Please run: ./tests/cli/deploy.sh"
    exit 1
fi

log_success "Property listing contract ID: $PROPERTY_CONTRACT_ID"

# Generate test data
PROPERTY_ID="PROP_LISTING_$(date +%s)"
DATA_HASH="hash_$(date +%s)_$(shasum -a 256 <<< "test_property_data" | cut -d' ' -f1)"
OWNER_ADDRESS="GALAXY_TEST_OWNER_$(date +%s)"

log_info "Test data:"
log_info "  Property ID: $PROPERTY_ID"
log_info "  Data Hash: $DATA_HASH"
log_info "  Owner Address: $OWNER_ADDRESS"

# Test 1: Create property listing
log_info "Test 1: Create property listing"
run_test "Create property listing" \
    "stellar contract invoke --global testnet --contract-id $PROPERTY_CONTRACT_ID --function create_listing -- '$PROPERTY_ID' '$DATA_HASH' '$OWNER_ADDRESS'" \
    "success"

# Test 2: Get property listing
log_info "Test 2: Get property listing"
run_test "Get property listing" \
    "stellar contract invoke --global testnet --contract-id $PROPERTY_CONTRACT_ID --function get_listing -- '$PROPERTY_ID'" \
    "success"

# Test 3: Update property listing
log_info "Test 3: Update property listing"
NEW_DATA_HASH="updated_hash_$(date +%s)_$(shasum -a 256 <<< "updated_property_data" | cut -d' ' -f1)"
run_test "Update property listing" \
    "stellar contract invoke --global testnet --contract-id $PROPERTY_CONTRACT_ID --function update_listing -- '$PROPERTY_ID' '$NEW_DATA_HASH' '$OWNER_ADDRESS'" \
    "success"

# Test 4: Update property status to Booked
log_info "Test 4: Update property status to Booked"
run_test "Update status to Booked" \
    "stellar contract invoke --global testnet --contract-id $PROPERTY_CONTRACT_ID --function update_status -- '$PROPERTY_ID' '$OWNER_ADDRESS' 1" \
    "success"

# Test 5: Update property status to Maintenance
log_info "Test 5: Update property status to Maintenance"
run_test "Update status to Maintenance" \
    "stellar contract invoke --global testnet --contract-id $PROPERTY_CONTRACT_ID --function update_status -- '$PROPERTY_ID' '$OWNER_ADDRESS' 2" \
    "success"

# Test 6: Update property status to Inactive
log_info "Test 6: Update property status to Inactive"
run_test "Update status to Inactive" \
    "stellar contract invoke --global testnet --contract-id $PROPERTY_CONTRACT_ID --function update_status -- '$PROPERTY_ID' '$OWNER_ADDRESS' 3" \
    "success"

# Test 7: Update property status back to Available
log_info "Test 7: Update property status back to Available"
run_test "Update status to Available" \
    "stellar contract invoke --global testnet --contract-id $PROPERTY_CONTRACT_ID --function update_status -- '$PROPERTY_ID' '$OWNER_ADDRESS' 0" \
    "success"

# Test 8: Create duplicate listing (should fail)
log_info "Test 8: Create duplicate listing (should fail)"
run_test "Create duplicate listing" \
    "stellar contract invoke --global testnet --contract-id $PROPERTY_CONTRACT_ID --function create_listing -- '$PROPERTY_ID' '$DATA_HASH' '$OWNER_ADDRESS'" \
    "failure"

# Test 9: Unauthorized update (different owner)
log_info "Test 9: Unauthorized update (different owner)"
UNAUTHORIZED_OWNER="GALAXY_UNAUTHORIZED_$(date +%s)"
run_test "Unauthorized update" \
    "stellar contract invoke --global testnet --contract-id $PROPERTY_CONTRACT_ID --function update_listing -- '$PROPERTY_ID' '$DATA_HASH' '$UNAUTHORIZED_OWNER'" \
    "failure"

# Test 10: Unauthorized status update
log_info "Test 10: Unauthorized status update"
run_test "Unauthorized status update" \
    "stellar contract invoke --global testnet --contract-id $PROPERTY_CONTRACT_ID --function update_status -- '$PROPERTY_ID' '$UNAUTHORIZED_OWNER' 1" \
    "failure"

# Test 11: Get non-existent listing
log_info "Test 11: Get non-existent listing"
NONEXISTENT_ID="PROP_NONEXISTENT_$(date +%s)"
run_test "Get non-existent listing" \
    "stellar contract invoke --global testnet --contract-id $PROPERTY_CONTRACT_ID --function get_listing -- '$NONEXISTENT_ID'" \
    "failure"

# Test 12: Multiple listings from same owner
log_info "Test 12: Multiple listings from same owner"
MULTI_PROPERTY1="PROP_MULTI1_$(date +%s)"
MULTI_PROPERTY2="PROP_MULTI2_$(date +%s)"
MULTI_HASH1="multi_hash1_$(date +%s)"
MULTI_HASH2="multi_hash2_$(date +%s)"

run_test "Multiple listings - first" \
    "stellar contract invoke --global testnet --contract-id $PROPERTY_CONTRACT_ID --function create_listing -- '$MULTI_PROPERTY1' '$MULTI_HASH1' '$OWNER_ADDRESS'" \
    "success"

run_test "Multiple listings - second" \
    "stellar contract invoke --global testnet --contract-id $PROPERTY_CONTRACT_ID --function create_listing -- '$MULTI_PROPERTY2' '$MULTI_HASH2' '$OWNER_ADDRESS'" \
    "success"

# Test 13: Multiple listings from different owners
log_info "Test 13: Multiple listings from different owners"
DIFF_OWNER_PROPERTY="PROP_DIFF_OWNER_$(date +%s)"
DIFF_OWNER_HASH="diff_owner_hash_$(date +%s)"
DIFF_OWNER_ADDRESS="GALAXY_DIFF_OWNER_$(date +%s)"

run_test "Different owner listing" \
    "stellar contract invoke --global testnet --contract-id $PROPERTY_CONTRACT_ID --function create_listing -- '$DIFF_OWNER_PROPERTY' '$DIFF_OWNER_HASH' '$DIFF_OWNER_ADDRESS'" \
    "success"

# Test 14: Edge case - empty property ID
log_info "Test 14: Edge case - empty property ID"
run_test "Empty property ID" \
    "stellar contract invoke --global testnet --contract-id $PROPERTY_CONTRACT_ID --function create_listing -- '' '$DATA_HASH' '$OWNER_ADDRESS'" \
    "failure"

# Test 15: Edge case - empty data hash
log_info "Test 15: Edge case - empty data hash"
EDGE_PROPERTY_ID="PROP_EDGE_EMPTY_HASH_$(date +%s)"
run_test "Empty data hash" \
    "stellar contract invoke --global testnet --contract-id $PROPERTY_CONTRACT_ID --function create_listing -- '$EDGE_PROPERTY_ID' '' '$OWNER_ADDRESS'" \
    "failure"

# Test 16: Edge case - maximum length property ID
log_info "Test 16: Edge case - maximum length property ID"
MAX_LENGTH_ID="PROP_MAX_LENGTH_$(date +%s)_$(printf 'A%.0s' {1..50})" # 50+ character ID
MAX_LENGTH_HASH="max_length_hash_$(date +%s)"

run_test "Maximum length property ID" \
    "stellar contract invoke --global testnet --contract-id $PROPERTY_CONTRACT_ID --function create_listing -- '$MAX_LENGTH_ID' '$MAX_LENGTH_HASH' '$OWNER_ADDRESS'" \
    "success"

# Test 17: Edge case - maximum length data hash
log_info "Test 17: Edge case - maximum length data hash"
MAX_HASH_PROPERTY_ID="PROP_MAX_HASH_$(date +%s)"
MAX_LENGTH_DATA_HASH="$(printf 'H%.0s' {1..100})" # 100 character hash

run_test "Maximum length data hash" \
    "stellar contract invoke --global testnet --contract-id $PROPERTY_CONTRACT_ID --function create_listing -- '$MAX_HASH_PROPERTY_ID' '$MAX_LENGTH_DATA_HASH' '$OWNER_ADDRESS'" \
    "success"

# Test 18: Status transition validation
log_info "Test 18: Status transition validation"
STATUS_PROPERTY_ID="PROP_STATUS_TEST_$(date +%s)"
STATUS_HASH="status_hash_$(date +%s)"

# Create listing
run_test "Status test - create listing" \
    "stellar contract invoke --global testnet --contract-id $PROPERTY_CONTRACT_ID --function create_listing -- '$STATUS_PROPERTY_ID' '$STATUS_HASH' '$OWNER_ADDRESS'" \
    "success"

# Test all valid status transitions
STATUSES=("Available" "Booked" "Maintenance" "Inactive")
for i in "${!STATUSES[@]}"; do
    STATUS_NAME="${STATUSES[$i]}"
    log_info "Testing status: $STATUS_NAME ($i)"
    
    run_test "Status transition to $STATUS_NAME" \
        "stellar contract invoke --global testnet --contract-id $PROPERTY_CONTRACT_ID --function update_status -- '$STATUS_PROPERTY_ID' '$OWNER_ADDRESS' $i" \
        "success"
done

# Test 19: Rapid status changes
log_info "Test 19: Rapid status changes"
RAPID_PROPERTY_ID="PROP_RAPID_$(date +%s)"
RAPID_HASH="rapid_hash_$(date +%s)"

# Create listing
run_test "Rapid changes - create listing" \
    "stellar contract invoke --global testnet --contract-id $PROPERTY_CONTRACT_ID --function create_listing -- '$RAPID_PROPERTY_ID' '$RAPID_HASH' '$OWNER_ADDRESS'" \
    "success"

# Rapidly change status multiple times
for i in {1..10}; do
    STATUS_INDEX=$((i % 4))
    run_test "Rapid status change $i" \
        "stellar contract invoke --global testnet --contract-id $PROPERTY_CONTRACT_ID --function update_status -- '$RAPID_PROPERTY_ID' '$OWNER_ADDRESS' $STATUS_INDEX" \
        "success"
done

# Test 20: Concurrent listing creation (simulate)
log_info "Test 20: Concurrent listing creation simulation"
CONCURRENT_PROPERTY1="PROP_CONCURRENT1_$(date +%s)"
CONCURRENT_PROPERTY2="PROP_CONCURRENT2_$(date +%s)"
CONCURRENT_HASH1="concurrent_hash1_$(date +%s)"
CONCURRENT_HASH2="concurrent_hash2_$(date +%s)"

# Create two listings simultaneously (simulated)
run_test "Concurrent listing 1" \
    "stellar contract invoke --global testnet --contract-id $PROPERTY_CONTRACT_ID --function create_listing -- '$CONCURRENT_PROPERTY1' '$CONCURRENT_HASH1' '$OWNER_ADDRESS'" \
    "success"

run_test "Concurrent listing 2" \
    "stellar contract invoke --global testnet --contract-id $PROPERTY_CONTRACT_ID --function create_listing -- '$CONCURRENT_PROPERTY2' '$CONCURRENT_HASH2' '$OWNER_ADDRESS'" \
    "success"

# Test 21: Data integrity verification
log_info "Test 21: Data integrity verification"
INTEGRITY_PROPERTY_ID="PROP_INTEGRITY_$(date +%s)"
INTEGRITY_HASH="integrity_hash_$(date +%s)"

# Create listing
run_test "Integrity test - create listing" \
    "stellar contract invoke --global testnet --contract-id $PROPERTY_CONTRACT_ID --function create_listing -- '$INTEGRITY_PROPERTY_ID' '$INTEGRITY_HASH' '$OWNER_ADDRESS'" \
    "success"

# Update with new hash
NEW_INTEGRITY_HASH="new_integrity_hash_$(date +%s)"
run_test "Integrity test - update hash" \
    "stellar contract invoke --global testnet --contract-id $PROPERTY_CONTRACT_ID --function update_listing -- '$INTEGRITY_PROPERTY_ID' '$NEW_INTEGRITY_HASH' '$OWNER_ADDRESS'" \
    "success"

# Verify the update
run_test "Integrity test - verify update" \
    "stellar contract invoke --global testnet --contract-id $PROPERTY_CONTRACT_ID --function get_listing -- '$INTEGRITY_PROPERTY_ID'" \
    "success"

# Test 22: Owner address validation
log_info "Test 22: Owner address validation"
INVALID_OWNER_PROPERTY_ID="PROP_INVALID_OWNER_$(date +%s)"
INVALID_OWNER_HASH="invalid_owner_hash_$(date +%s)"
INVALID_OWNER_ADDRESS="INVALID_ADDRESS_FORMAT"

run_test "Invalid owner address" \
    "stellar contract invoke --global testnet --contract-id $PROPERTY_CONTRACT_ID --function create_listing -- '$INVALID_OWNER_PROPERTY_ID' '$INVALID_OWNER_HASH' '$INVALID_OWNER_ADDRESS'" \
    "failure"

# Test 23: Get all listings (if function exists)
log_info "Test 23: Get all listings"
run_test "Get all listings" \
    "stellar contract invoke --global testnet --contract-id $PROPERTY_CONTRACT_ID --function get_all_listings" \
    "success"

# Performance test - multiple listings
log_info "Performance test: Multiple listings creation"
for i in {1..10}; do
    PERF_PROPERTY_ID="PROP_PERF${i}_$(date +%s)"
    PERF_HASH="perf_hash${i}_$(date +%s)"
    PERF_OWNER="GALAXY_PERF_OWNER${i}_$(date +%s)"
    
    run_test "Performance test - listing $i" \
        "stellar contract invoke --global testnet --contract-id $PROPERTY_CONTRACT_ID --function create_listing -- '$PERF_PROPERTY_ID' '$PERF_HASH' '$PERF_OWNER'" \
        "success"
done

# Create test report
log_info "Creating test report..."
cat > "$TESTS_DIR/logs/property-listing-test-report-$(date +%Y%m%d-%H%M%S).json" << EOF
{
  "test_timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "contract_id": "$PROPERTY_CONTRACT_ID",
  "network": "$STELLAR_NETWORK",
  "test_summary": {
    "total_tests": $TEST_COUNT,
    "passed": $PASSED_COUNT,
    "failed": $FAILED_COUNT
  },
  "test_data": {
    "property_id": "$PROPERTY_ID",
    "data_hash": "$DATA_HASH",
    "owner_address": "$OWNER_ADDRESS",
    "new_data_hash": "$NEW_DATA_HASH"
  },
  "test_results": [
EOF

for i in "${!TEST_RESULTS[@]}"; do
    local result="${TEST_RESULTS[$i]}"
    local status="${result%%:*}"
    local test_name="${result#*:}"
    
    cat >> "$TESTS_DIR/logs/property-listing-test-report-$(date +%Y%m%d-%H%M%S).json" << EOF
    {
      "test": "$test_name",
      "status": "$status"
    }EOF
    
    if [ $i -lt $((${#TEST_RESULTS[@]} - 1)) ]; then
        echo "," >> "$TESTS_DIR/logs/property-listing-test-report-$(date +%Y%m%d-%H%M%S).json"
    fi
done

cat >> "$TESTS_DIR/logs/property-listing-test-report-$(date +%Y%m%d-%H%M%S).json" << EOF
  ]
}
EOF

# Print final summary
log_info "Property Listing Contract Test Summary"
log_info "======================================"
print_test_summary

if [ $FAILED_COUNT -eq 0 ]; then
    log_success "All property listing contract tests passed!"
    log_info "Test report saved to: $TESTS_DIR/logs/property-listing-test-report-$(date +%Y%m%d-%H%M%S).json"
else
    log_error "Some tests failed. Check the test report for details."
    exit 1
fi

log_info "Next steps:"
log_info "1. Run review contract tests: ./tests/cli/test-review.sh"
log_info "2. Run integration tests: ./tests/cli/integration-test.sh"

exit $?
