#!/bin/bash

# Integration Test Script
# Tests cross-contract interactions and end-to-end workflows

set -e

# Load configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/utils/network-config.sh"
source "$SCRIPT_DIR/utils/test-helpers.sh"
source "$SCRIPT_DIR/utils/contract-addresses.sh"

# Test configuration
TEST_LOG="$TESTS_DIR/logs/integration-test-$(date +%Y%m%d-%H%M%S).log"

log_info "Starting Integration Tests..."
log_info "Test log: $TEST_LOG"

# Create logs directory
mkdir -p "$TESTS_DIR/logs"

# Check if all contracts are deployed
log_info "Checking contract deployments..."

BOOKING_CONTRACT_ID=$(get_contract_address "booking")
PROPERTY_CONTRACT_ID=$(get_contract_address "property_listing")
REVIEW_CONTRACT_ID=$(get_contract_address "review_contract")

if [ "$BOOKING_CONTRACT_ID" = "null" ] || [ -z "$BOOKING_CONTRACT_ID" ]; then
    log_error "Booking contract not deployed!"
    exit 1
fi

if [ "$PROPERTY_CONTRACT_ID" = "null" ] || [ -z "$PROPERTY_CONTRACT_ID" ]; then
    log_error "Property listing contract not deployed!"
    exit 1
fi

if [ "$REVIEW_CONTRACT_ID" = "null" ] || [ -z "$REVIEW_CONTRACT_ID" ]; then
    log_error "Review contract not deployed!"
    exit 1
fi

log_success "All contracts deployed:"
log_info "  Booking: $BOOKING_CONTRACT_ID"
log_info "  Property Listing: $PROPERTY_CONTRACT_ID"
log_info "  Review: $REVIEW_CONTRACT_ID"

# Generate test data for integration tests
PROPERTY_ID="PROP_INTEGRATION_$(date +%s)"
PROPERTY_DATA_HASH="integration_hash_$(date +%s)"
PROPERTY_OWNER="GALAXY_INTEGRATION_OWNER_$(date +%s)"
USER_ID="USER_INTEGRATION_$(date +%s)"
BOOKING_ID=""
START_DATE=$(date -d "+1 day" +%s)
END_DATE=$(($START_DATE + 86400))
TOTAL_PRICE=1000000000

log_info "Integration test data:"
log_info "  Property ID: $PROPERTY_ID"
log_info "  Property Owner: $PROPERTY_OWNER"
log_info "  User ID: $USER_ID"
log_info "  Start Date: $START_DATE"
log_info "  End Date: $END_DATE"
log_info "  Total Price: $TOTAL_PRICE"

# Integration Test 1: Complete Property Listing Workflow
log_info "Integration Test 1: Complete Property Listing Workflow"

# Step 1: Create property listing
log_info "Step 1: Create property listing"
run_test "Integration - Create property listing" \
    "stellar contract invoke --global testnet --contract-id $PROPERTY_CONTRACT_ID --function create_listing -- '$PROPERTY_ID' '$PROPERTY_DATA_HASH' '$PROPERTY_OWNER'" \
    "success"

# Step 2: Verify property listing exists
log_info "Step 2: Verify property listing exists"
run_test "Integration - Verify property listing" \
    "stellar contract invoke --global testnet --contract-id $PROPERTY_CONTRACT_ID --function get_listing -- '$PROPERTY_ID'" \
    "success"

# Step 3: Update property status to Available
log_info "Step 3: Update property status to Available"
run_test "Integration - Set property status to Available" \
    "stellar contract invoke --global testnet --contract-id $PROPERTY_CONTRACT_ID --function update_status -- '$PROPERTY_ID' '$PROPERTY_OWNER' 0" \
    "success"

# Integration Test 2: Complete Booking Workflow
log_info "Integration Test 2: Complete Booking Workflow"

# Step 1: Check availability
log_info "Step 1: Check property availability"
run_test "Integration - Check availability" \
    "stellar contract invoke --global testnet --contract-id $BOOKING_CONTRACT_ID --function check_availability -- '$PROPERTY_ID' $START_DATE $END_DATE" \
    "success"

# Step 2: Create booking
log_info "Step 2: Create booking"
BOOKING_OUTPUT=$(stellar contract invoke --global testnet --contract-id $BOOKING_CONTRACT_ID --function create_booking -- '$PROPERTY_ID' '$USER_ID' $START_DATE $END_DATE $TOTAL_PRICE 2>&1)
BOOKING_ID=$(echo "$BOOKING_OUTPUT" | grep -o '[0-9]*' | tail -1)

if [ -n "$BOOKING_ID" ]; then
    log_success "Booking created with ID: $BOOKING_ID"
    run_test "Integration - Create booking" "true" "success"
else
    log_error "Failed to create booking"
    run_test "Integration - Create booking" "false" "failure"
fi

# Step 3: Verify booking exists
log_info "Step 3: Verify booking exists"
run_test "Integration - Verify booking" \
    "stellar contract invoke --global testnet --contract-id $BOOKING_CONTRACT_ID --function get_booking -- $BOOKING_ID" \
    "success"

# Step 4: Update property status to Booked
log_info "Step 4: Update property status to Booked"
run_test "Integration - Set property status to Booked" \
    "stellar contract invoke --global testnet --contract-id $PROPERTY_CONTRACT_ID --function update_status -- '$PROPERTY_ID' '$PROPERTY_OWNER' 1" \
    "success"

# Step 5: Confirm booking
log_info "Step 5: Confirm booking"
run_test "Integration - Confirm booking" \
    "stellar contract invoke --global testnet --contract-id $BOOKING_CONTRACT_ID --function update_status -- $BOOKING_ID 1" \
    "success"

# Step 6: Complete booking
log_info "Step 6: Complete booking"
run_test "Integration - Complete booking" \
    "stellar contract invoke --global testnet --contract-id $BOOKING_CONTRACT_ID --function update_status -- $BOOKING_ID 2" \
    "success"

# Step 7: Update property status back to Available
log_info "Step 7: Update property status back to Available"
run_test "Integration - Set property status back to Available" \
    "stellar contract invoke --global testnet --contract-id $PROPERTY_CONTRACT_ID --function update_status -- '$PROPERTY_ID' '$PROPERTY_OWNER' 0" \
    "success"

# Integration Test 3: Complete Review Workflow
log_info "Integration Test 3: Complete Review Workflow"

# Step 1: Submit review
log_info "Step 1: Submit review"
REVIEWER_DID="did:stellar:test:integration_reviewer_$(date +%s)"
TARGET_DID="did:stellar:test:integration_target_$(date +%s)"
REVIEW_COMMENT="Great property and excellent host! Highly recommended."

run_test "Integration - Submit review" \
    "stellar contract invoke --global testnet --contract-id $REVIEW_CONTRACT_ID --function submit_review -- '$BOOKING_ID' '$REVIEWER_DID' '$TARGET_DID' 5 '$REVIEW_COMMENT'" \
    "success"

# Step 2: Get reviews for target
log_info "Step 2: Get reviews for target"
run_test "Integration - Get reviews for target" \
    "stellar contract invoke --global testnet --contract-id $REVIEW_CONTRACT_ID --function get_reviews_for_user -- '$TARGET_DID'" \
    "success"

# Step 3: Get reputation score
log_info "Step 3: Get reputation score"
run_test "Integration - Get reputation score" \
    "stellar contract invoke --global testnet --contract-id $REVIEW_CONTRACT_ID --function get_reputation -- '$TARGET_DID'" \
    "success"

# Integration Test 4: Multi-User Scenario
log_info "Integration Test 4: Multi-User Scenario"

# Create multiple properties and bookings
MULTI_PROPERTY1="PROP_MULTI1_$(date +%s)"
MULTI_PROPERTY2="PROP_MULTI2_$(date +%s)"
MULTI_OWNER1="GALAXY_MULTI_OWNER1_$(date +%s)"
MULTI_OWNER2="GALAXY_MULTI_OWNER2_$(date +%s)"
MULTI_USER1="USER_MULTI1_$(date +%s)"
MULTI_USER2="USER_MULTI2_$(date +%s)"

# Create two properties
run_test "Multi-user - Create property 1" \
    "stellar contract invoke --global testnet --contract-id $PROPERTY_CONTRACT_ID --function create_listing -- '$MULTI_PROPERTY1' 'hash1_$(date +%s)' '$MULTI_OWNER1'" \
    "success"

run_test "Multi-user - Create property 2" \
    "stellar contract invoke --global testnet --contract-id $PROPERTY_CONTRACT_ID --function create_listing -- '$MULTI_PROPERTY2' 'hash2_$(date +%s)' '$MULTI_OWNER2'" \
    "success"

# Create bookings for both properties
MULTI_START1=$(($START_DATE + 86400 * 2))
MULTI_END1=$(($MULTI_START1 + 86400))
MULTI_START2=$(($START_DATE + 86400 * 3))
MULTI_END2=$(($MULTI_START2 + 86400))

MULTI_BOOKING1_OUTPUT=$(stellar contract invoke --global testnet --contract-id $BOOKING_CONTRACT_ID --function create_booking -- '$MULTI_PROPERTY1' '$MULTI_USER1' $MULTI_START1 $MULTI_END1 $TOTAL_PRICE 2>&1)
MULTI_BOOKING1_ID=$(echo "$MULTI_BOOKING1_OUTPUT" | grep -o '[0-9]*' | tail -1)

MULTI_BOOKING2_OUTPUT=$(stellar contract invoke --global testnet --contract-id $BOOKING_CONTRACT_ID --function create_booking -- '$MULTI_PROPERTY2' '$MULTI_USER2' $MULTI_START2 $MULTI_END2 $TOTAL_PRICE 2>&1)
MULTI_BOOKING2_ID=$(echo "$MULTI_BOOKING2_OUTPUT" | grep -o '[0-9]*' | tail -1)

if [ -n "$MULTI_BOOKING1_ID" ] && [ -n "$MULTI_BOOKING2_ID" ]; then
    log_success "Multi-user bookings created: $MULTI_BOOKING1_ID, $MULTI_BOOKING2_ID"
    run_test "Multi-user - Create bookings" "true" "success"
else
    log_error "Failed to create multi-user bookings"
    run_test "Multi-user - Create bookings" "false" "failure"
fi

# Integration Test 5: Booking Conflict Prevention
log_info "Integration Test 5: Booking Conflict Prevention"

CONFLICT_PROPERTY="PROP_CONFLICT_$(date +%s)"
CONFLICT_OWNER="GALAXY_CONFLICT_OWNER_$(date +%s)"
CONFLICT_USER1="USER_CONFLICT1_$(date +%s)"
CONFLICT_USER2="USER_CONFLICT2_$(date +%s)"

# Create property
run_test "Conflict test - Create property" \
    "stellar contract invoke --global testnet --contract-id $PROPERTY_CONTRACT_ID --function create_listing -- '$CONFLICT_PROPERTY' 'conflict_hash_$(date +%s)' '$CONFLICT_OWNER'" \
    "success"

# Create first booking
CONFLICT_START=$(($START_DATE + 86400 * 4))
CONFLICT_END=$(($CONFLICT_START + 86400))

CONFLICT_BOOKING1_OUTPUT=$(stellar contract invoke --global testnet --contract-id $BOOKING_CONTRACT_ID --function create_booking -- '$CONFLICT_PROPERTY' '$CONFLICT_USER1' $CONFLICT_START $CONFLICT_END $TOTAL_PRICE 2>&1)
CONFLICT_BOOKING1_ID=$(echo "$CONFLICT_BOOKING1_OUTPUT" | grep -o '[0-9]*' | tail -1)

if [ -n "$CONFLICT_BOOKING1_ID" ]; then
    log_success "First conflict booking created: $CONFLICT_BOOKING1_ID"
    
    # Try to create overlapping booking (should fail)
    OVERLAP_START=$(($CONFLICT_START + 3600)) # +1 hour
    OVERLAP_END=$(($CONFLICT_END + 3600))     # +1 hour
    
    run_test "Conflict test - Overlapping booking prevention" \
        "stellar contract invoke --global testnet --contract-id $BOOKING_CONTRACT_ID --function create_booking -- '$CONFLICT_PROPERTY' '$CONFLICT_USER2' $OVERLAP_START $OVERLAP_END $TOTAL_PRICE" \
        "failure"
else
    log_error "Failed to create first conflict booking"
fi

# Integration Test 6: Data Consistency Across Contracts
log_info "Integration Test 6: Data Consistency Across Contracts"

CONSISTENCY_PROPERTY="PROP_CONSISTENCY_$(date +%s)"
CONSISTENCY_OWNER="GALAXY_CONSISTENCY_OWNER_$(date +%s)"
CONSISTENCY_USER="USER_CONSISTENCY_$(date +%s)"

# Create property
run_test "Consistency test - Create property" \
    "stellar contract invoke --global testnet --contract-id $PROPERTY_CONTRACT_ID --function create_listing -- '$CONSISTENCY_PROPERTY' 'consistency_hash_$(date +%s)' '$CONSISTENCY_OWNER'" \
    "success"

# Create booking
CONSISTENCY_START=$(($START_DATE + 86400 * 5))
CONSISTENCY_END=$(($CONSISTENCY_START + 86400))

CONSISTENCY_BOOKING_OUTPUT=$(stellar contract invoke --global testnet --contract-id $BOOKING_CONTRACT_ID --function create_booking -- '$CONSISTENCY_PROPERTY' '$CONSISTENCY_USER' $CONSISTENCY_START $CONSISTENCY_END $TOTAL_PRICE 2>&1)
CONSISTENCY_BOOKING_ID=$(echo "$CONSISTENCY_BOOKING_OUTPUT" | grep -o '[0-9]*' | tail -1)

if [ -n "$CONSISTENCY_BOOKING_ID" ]; then
    log_success "Consistency booking created: $CONSISTENCY_BOOKING_ID"
    
    # Verify data consistency
    run_test "Consistency test - Verify property listing" \
        "stellar contract invoke --global testnet --contract-id $PROPERTY_CONTRACT_ID --function get_listing -- '$CONSISTENCY_PROPERTY'" \
        "success"
    
    run_test "Consistency test - Verify booking" \
        "stellar contract invoke --global testnet --contract-id $BOOKING_CONTRACT_ID --function get_booking -- $CONSISTENCY_BOOKING_ID" \
        "success"
    
    run_test "Consistency test - Verify property bookings" \
        "stellar contract invoke --global testnet --contract-id $BOOKING_CONTRACT_ID --function get_property_bookings -- '$CONSISTENCY_PROPERTY'" \
        "success"
else
    log_error "Failed to create consistency booking"
fi

# Integration Test 7: Error Handling and Recovery
log_info "Integration Test 7: Error Handling and Recovery"

# Test invalid operations
run_test "Error handling - Invalid property ID" \
    "stellar contract invoke --global testnet --contract-id $BOOKING_CONTRACT_ID --function check_availability -- 'INVALID_PROPERTY' $START_DATE $END_DATE" \
    "success"

run_test "Error handling - Invalid booking ID" \
    "stellar contract invoke --global testnet --contract-id $BOOKING_CONTRACT_ID --function get_booking -- 99999" \
    "failure"

run_test "Error handling - Invalid review data" \
    "stellar contract invoke --global testnet --contract-id $REVIEW_CONTRACT_ID --function submit_review -- '' 'did:test:reviewer' 'did:test:target' 0 'Invalid review'" \
    "failure"

# Integration Test 8: Performance Under Load
log_info "Integration Test 8: Performance Under Load"

# Create multiple properties and bookings rapidly
for i in {1..10}; do
    LOAD_PROPERTY="PROP_LOAD${i}_$(date +%s)"
    LOAD_OWNER="GALAXY_LOAD_OWNER${i}_$(date +%s)"
    LOAD_USER="USER_LOAD${i}_$(date +%s)"
    LOAD_START=$(($START_DATE + 86400 * (6 + i)))
    LOAD_END=$(($LOAD_START + 86400))
    
    # Create property
    run_test "Load test - Create property $i" \
        "stellar contract invoke --global testnet --contract-id $PROPERTY_CONTRACT_ID --function create_listing -- '$LOAD_PROPERTY' 'load_hash${i}_$(date +%s)' '$LOAD_OWNER'" \
        "success"
    
    # Create booking
    run_test "Load test - Create booking $i" \
        "stellar contract invoke --global testnet --contract-id $BOOKING_CONTRACT_ID --function create_booking -- '$LOAD_PROPERTY' '$LOAD_USER' $LOAD_START $LOAD_END $TOTAL_PRICE" \
        "success"
done

# Integration Test 9: Cross-Contract State Synchronization
log_info "Integration Test 9: Cross-Contract State Synchronization"

SYNC_PROPERTY="PROP_SYNC_$(date +%s)"
SYNC_OWNER="GALAXY_SYNC_OWNER_$(date +%s)"
SYNC_USER="USER_SYNC_$(date +%s)"

# Create property
run_test "Sync test - Create property" \
    "stellar contract invoke --global testnet --contract-id $PROPERTY_CONTRACT_ID --function create_listing -- '$SYNC_PROPERTY' 'sync_hash_$(date +%s)' '$SYNC_OWNER'" \
    "success"

# Create booking
SYNC_START=$(($START_DATE + 86400 * 16))
SYNC_END=$(($SYNC_START + 86400))

SYNC_BOOKING_OUTPUT=$(stellar contract invoke --global testnet --contract-id $BOOKING_CONTRACT_ID --function create_booking -- '$SYNC_PROPERTY' '$SYNC_USER' $SYNC_START $SYNC_END $TOTAL_PRICE 2>&1)
SYNC_BOOKING_ID=$(echo "$SYNC_BOOKING_OUTPUT" | grep -o '[0-9]*' | tail -1)

if [ -n "$SYNC_BOOKING_ID" ]; then
    # Update property status to Booked
    run_test "Sync test - Update property to Booked" \
        "stellar contract invoke --global testnet --contract-id $PROPERTY_CONTRACT_ID --function update_status -- '$SYNC_PROPERTY' '$SYNC_OWNER' 1" \
        "success"
    
    # Confirm booking
    run_test "Sync test - Confirm booking" \
        "stellar contract invoke --global testnet --contract-id $BOOKING_CONTRACT_ID --function update_status -- $SYNC_BOOKING_ID 1" \
        "success"
    
    # Complete booking
    run_test "Sync test - Complete booking" \
        "stellar contract invoke --global testnet --contract-id $BOOKING_CONTRACT_ID --function update_status -- $SYNC_BOOKING_ID 2" \
        "success"
    
    # Update property back to Available
    run_test "Sync test - Update property to Available" \
        "stellar contract invoke --global testnet --contract-id $PROPERTY_CONTRACT_ID --function update_status -- '$SYNC_PROPERTY' '$SYNC_OWNER' 0" \
        "success"
    
    # Submit review
    run_test "Sync test - Submit review" \
        "stellar contract invoke --global testnet --contract-id $REVIEW_CONTRACT_ID --function submit_review -- '$SYNC_BOOKING_ID' 'did:stellar:test:sync_reviewer_$(date +%s)' 'did:stellar:test:sync_target_$(date +%s)' 5 'Sync test review'" \
        "success"
fi

# Integration Test 10: End-to-End User Journey
log_info "Integration Test 10: End-to-End User Journey"

# Simulate complete user journey: Property listing -> Booking -> Review
JOURNEY_PROPERTY="PROP_JOURNEY_$(date +%s)"
JOURNEY_OWNER="GALAXY_JOURNEY_OWNER_$(date +%s)"
JOURNEY_USER="USER_JOURNEY_$(date +%s)"

# Step 1: Host lists property
run_test "Journey - Host lists property" \
    "stellar contract invoke --global testnet --contract-id $PROPERTY_CONTRACT_ID --function create_listing -- '$JOURNEY_PROPERTY' 'journey_hash_$(date +%s)' '$JOURNEY_OWNER'" \
    "success"

# Step 2: Guest searches and finds property
run_test "Journey - Guest finds property" \
    "stellar contract invoke --global testnet --contract-id $PROPERTY_CONTRACT_ID --function get_listing -- '$JOURNEY_PROPERTY'" \
    "success"

# Step 3: Guest checks availability
JOURNEY_START=$(($START_DATE + 86400 * 17))
JOURNEY_END=$(($JOURNEY_START + 86400))

run_test "Journey - Guest checks availability" \
    "stellar contract invoke --global testnet --contract-id $BOOKING_CONTRACT_ID --function check_availability -- '$JOURNEY_PROPERTY' $JOURNEY_START $JOURNEY_END" \
    "success"

# Step 4: Guest creates booking
JOURNEY_BOOKING_OUTPUT=$(stellar contract invoke --global testnet --contract-id $BOOKING_CONTRACT_ID --function create_booking -- '$JOURNEY_PROPERTY' '$JOURNEY_USER' $JOURNEY_START $JOURNEY_END $TOTAL_PRICE 2>&1)
JOURNEY_BOOKING_ID=$(echo "$JOURNEY_BOOKING_OUTPUT" | grep -o '[0-9]*' | tail -1)

if [ -n "$JOURNEY_BOOKING_ID" ]; then
    log_success "Journey booking created: $JOURNEY_BOOKING_ID"
    
    # Step 5: Host confirms booking
    run_test "Journey - Host confirms booking" \
        "stellar contract invoke --global testnet --contract-id $BOOKING_CONTRACT_ID --function update_status -- $JOURNEY_BOOKING_ID 1" \
        "success"
    
    # Step 6: Guest completes stay
    run_test "Journey - Guest completes stay" \
        "stellar contract invoke --global testnet --contract-id $BOOKING_CONTRACT_ID --function update_status -- $JOURNEY_BOOKING_ID 2" \
        "success"
    
    # Step 7: Guest submits review
    run_test "Journey - Guest submits review" \
        "stellar contract invoke --global testnet --contract-id $REVIEW_CONTRACT_ID --function submit_review -- '$JOURNEY_BOOKING_ID' 'did:stellar:test:journey_reviewer_$(date +%s)' 'did:stellar:test:journey_target_$(date +%s)' 5 'Amazing experience!'" \
        "success"
    
    # Step 8: Host updates property status
    run_test "Journey - Host updates property status" \
        "stellar contract invoke --global testnet --contract-id $PROPERTY_CONTRACT_ID --function update_status -- '$JOURNEY_PROPERTY' '$JOURNEY_OWNER' 0" \
        "success"
else
    log_error "Failed to create journey booking"
fi

# Create integration test report
log_info "Creating integration test report..."
cat > "$TESTS_DIR/logs/integration-test-report-$(date +%Y%m%d-%H%M%S).json" << EOF
{
  "test_timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "network": "$STELLAR_NETWORK",
  "contracts": {
    "booking": "$BOOKING_CONTRACT_ID",
    "property_listing": "$PROPERTY_CONTRACT_ID",
    "review": "$REVIEW_CONTRACT_ID"
  },
  "test_summary": {
    "total_tests": $TEST_COUNT,
    "passed": $PASSED_COUNT,
    "failed": $FAILED_COUNT
  },
  "integration_scenarios": [
    "Complete Property Listing Workflow",
    "Complete Booking Workflow", 
    "Complete Review Workflow",
    "Multi-User Scenario",
    "Booking Conflict Prevention",
    "Data Consistency Across Contracts",
    "Error Handling and Recovery",
    "Performance Under Load",
    "Cross-Contract State Synchronization",
    "End-to-End User Journey"
  ],
  "test_results": [
EOF

for i in "${!TEST_RESULTS[@]}"; do
    local result="${TEST_RESULTS[$i]}"
    local status="${result%%:*}"
    local test_name="${result#*:}"
    
    cat >> "$TESTS_DIR/logs/integration-test-report-$(date +%Y%m%d-%H%M%S).json" << EOF
    {
      "test": "$test_name",
      "status": "$status"
    }EOF
    
    if [ $i -lt $((${#TEST_RESULTS[@]} - 1)) ]; then
        echo "," >> "$TESTS_DIR/logs/integration-test-report-$(date +%Y%m%d-%H%M%S).json"
    fi
done

cat >> "$TESTS_DIR/logs/integration-test-report-$(date +%Y%m%d-%H%M%S).json" << EOF
  ]
}
EOF

# Print final summary
log_info "Integration Test Summary"
log_info "======================="
print_test_summary

if [ $FAILED_COUNT -eq 0 ]; then
    log_success "All integration tests passed!"
    log_info "Integration test report saved to: $TESTS_DIR/logs/integration-test-report-$(date +%Y%m%d-%H%M%S).json"
    
    log_info "Integration test scenarios completed:"
    log_info "✓ Complete Property Listing Workflow"
    log_info "✓ Complete Booking Workflow"
    log_info "✓ Complete Review Workflow"
    log_info "✓ Multi-User Scenario"
    log_info "✓ Booking Conflict Prevention"
    log_info "✓ Data Consistency Across Contracts"
    log_info "✓ Error Handling and Recovery"
    log_info "✓ Performance Under Load"
    log_info "✓ Cross-Contract State Synchronization"
    log_info "✓ End-to-End User Journey"
else
    log_error "Some integration tests failed. Check the test report for details."
    exit 1
fi

log_info "All smart contract tests completed successfully!"
log_info "Next step: Run cleanup: ./tests/cli/cleanup.sh"

exit $?
