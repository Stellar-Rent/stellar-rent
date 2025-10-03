#!/bin/bash

# Booking Contract Test Script
# Tests the booking contract functions using stellar contract invoke

set -e

# Load configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/utils/network-config.sh"
source "$SCRIPT_DIR/utils/test-helpers.sh"
source "$SCRIPT_DIR/utils/contract-addresses.sh"

# Test configuration
TEST_LOG="$TESTS_DIR/logs/booking-test-$(date +%Y%m%d-%H%M%S).log"
TEST_DATA_FILE="$FIXTURES_DIR/test-data.json"

log_info "Starting Booking Contract Tests..."
log_info "Test log: $TEST_LOG"

# Create logs directory
mkdir -p "$TESTS_DIR/logs"

# Check if contract is deployed
BOOKING_CONTRACT_ID=$(get_contract_address "booking")
if [ "$BOOKING_CONTRACT_ID" = "null" ] || [ -z "$BOOKING_CONTRACT_ID" ]; then
    log_error "Booking contract not deployed!"
    log_info "Please run: ./tests/cli/deploy.sh"
    exit 1
fi

log_success "Booking contract ID: $BOOKING_CONTRACT_ID"

# Generate test data
PROPERTY_ID="PROP_TEST_$(date +%s)"
USER_ID="USER_TEST_$(date +%s)"
START_DATE=$(date -d "+1 day" +%s)
END_DATE=$(($START_DATE + 86400)) # +1 day
TOTAL_PRICE=1000000000 # 100 USDC (in stroops)

log_info "Test data:"
log_info "  Property ID: $PROPERTY_ID"
log_info "  User ID: $USER_ID"
log_info "  Start Date: $START_DATE ($(date -d @$START_DATE))"
log_info "  End Date: $END_DATE ($(date -d @$END_DATE))"
log_info "  Total Price: $TOTAL_PRICE"

# Test 1: Check availability (should be true for new property)
log_info "Test 1: Check availability for new property"
run_test "Check availability - new property" \
    "stellar contract invoke --global testnet --contract-id $BOOKING_CONTRACT_ID --function check_availability -- '$PROPERTY_ID' $START_DATE $END_DATE" \
    "success"

# Test 2: Create booking
log_info "Test 2: Create booking"
BOOKING_ID_OUTPUT=$(stellar contract invoke --global testnet --contract-id $BOOKING_CONTRACT_ID --function create_booking -- '$PROPERTY_ID' '$USER_ID' $START_DATE $END_DATE $TOTAL_PRICE 2>&1)
BOOKING_ID=$(echo "$BOOKING_ID_OUTPUT" | grep -o '[0-9]*' | tail -1)

if [ -n "$BOOKING_ID" ]; then
    log_success "Booking created with ID: $BOOKING_ID"
else
    log_error "Failed to create booking"
    log_error "Output: $BOOKING_ID_OUTPUT"
    exit 1
fi

# Test 3: Check availability after booking (should be false)
log_info "Test 3: Check availability after booking"
run_test "Check availability - booked property" \
    "stellar contract invoke --global testnet --contract-id $BOOKING_CONTRACT_ID --function check_availability -- '$PROPERTY_ID' $START_DATE $END_DATE" \
    "failure"

# Test 4: Get booking details
log_info "Test 4: Get booking details"
run_test "Get booking" \
    "stellar contract invoke --global testnet --contract-id $BOOKING_CONTRACT_ID --function get_booking -- $BOOKING_ID" \
    "success"

# Test 5: Update booking status to confirmed
log_info "Test 5: Update booking status to confirmed"
run_test "Update status to confirmed" \
    "stellar contract invoke --global testnet --contract-id $BOOKING_CONTRACT_ID --function update_status -- $BOOKING_ID 1" \
    "success"

# Test 6: Update booking status to completed
log_info "Test 6: Update booking status to completed"
run_test "Update status to completed" \
    "stellar contract invoke --global testnet --contract-id $BOOKING_CONTRACT_ID --function update_status -- $BOOKING_ID 2" \
    "success"

# Test 7: Get property bookings
log_info "Test 7: Get property bookings"
run_test "Get property bookings" \
    "stellar contract invoke --global testnet --contract-id $BOOKING_CONTRACT_ID --function get_property_bookings -- '$PROPERTY_ID'" \
    "success"

# Test 8: Set escrow ID
log_info "Test 8: Set escrow ID"
ESCROW_ID="ESCROW_$(date +%s)"
run_test "Set escrow ID" \
    "stellar contract invoke --global testnet --contract-id $BOOKING_CONTRACT_ID --function set_escrow_id -- $BOOKING_ID '$ESCROW_ID'" \
    "success"

# Test 9: Invalid dates (start >= end)
log_info "Test 9: Invalid dates (start >= end)"
run_test "Invalid dates - start >= end" \
    "stellar contract invoke --global testnet --contract-id $BOOKING_CONTRACT_ID --function create_booking -- '$PROPERTY_ID' '$USER_ID' $END_DATE $START_DATE $TOTAL_PRICE" \
    "failure"

# Test 10: Invalid price (zero)
log_info "Test 10: Invalid price (zero)"
run_test "Invalid price - zero" \
    "stellar contract invoke --global testnet --contract-id $BOOKING_CONTRACT_ID --function create_booking -- '$PROPERTY_ID' '$USER_ID' $START_DATE $END_DATE 0" \
    "failure"

# Test 11: Booking overlap prevention
log_info "Test 11: Booking overlap prevention"
OVERLAP_START=$(($START_DATE + 3600)) # +1 hour
OVERLAP_END=$(($END_DATE + 3600))     # +1 hour
run_test "Booking overlap prevention" \
    "stellar contract invoke --global testnet --contract-id $BOOKING_CONTRACT_ID --function create_booking -- '$PROPERTY_ID' 'USER_OVERLAP' $OVERLAP_START $OVERLAP_END $TOTAL_PRICE" \
    "failure"

# Test 12: Cancel booking
log_info "Test 12: Cancel booking"
# First create a new booking for cancellation
CANCEL_PROPERTY_ID="PROP_CANCEL_$(date +%s)"
CANCEL_USER_ID="USER_CANCEL_$(date +%s)"
CANCEL_START=$(($START_DATE + 86400 * 2)) # +2 days
CANCEL_END=$(($CANCEL_START + 86400))    # +1 day

# Create booking for cancellation
CANCEL_BOOKING_OUTPUT=$(stellar contract invoke --global testnet --contract-id $BOOKING_CONTRACT_ID --function create_booking -- '$CANCEL_PROPERTY_ID' '$CANCEL_USER_ID' $CANCEL_START $CANCEL_END $TOTAL_PRICE 2>&1)
CANCEL_BOOKING_ID=$(echo "$CANCEL_BOOKING_OUTPUT" | grep -o '[0-9]*' | tail -1)

if [ -n "$CANCEL_BOOKING_ID" ]; then
    run_test "Cancel booking" \
        "stellar contract invoke --global testnet --contract-id $BOOKING_CONTRACT_ID --function cancel_booking -- $CANCEL_BOOKING_ID '$CANCEL_USER_ID'" \
        "success"
else
    log_error "Failed to create booking for cancellation test"
fi

# Test 13: Unauthorized cancellation
log_info "Test 13: Unauthorized cancellation"
run_test "Unauthorized cancellation" \
    "stellar contract invoke --global testnet --contract-id $BOOKING_CONTRACT_ID --function cancel_booking -- $BOOKING_ID 'UNAUTHORIZED_USER'" \
    "failure"

# Test 14: Invalid status transition
log_info "Test 14: Invalid status transition"
run_test "Invalid status transition" \
    "stellar contract invoke --global testnet --contract-id $BOOKING_CONTRACT_ID --function update_status -- $BOOKING_ID 0" \
    "failure"

# Test 15: Get non-existent booking
log_info "Test 15: Get non-existent booking"
run_test "Get non-existent booking" \
    "stellar contract invoke --global testnet --contract-id $BOOKING_CONTRACT_ID --function get_booking -- 99999" \
    "failure"

# Test 16: Multiple bookings for same property (non-overlapping)
log_info "Test 16: Multiple bookings for same property (non-overlapping)"
MULTI_PROPERTY_ID="PROP_MULTI_$(date +%s)"
MULTI_USER1="USER_MULTI1_$(date +%s)"
MULTI_USER2="USER_MULTI2_$(date +%s)"
MULTI_START1=$(($START_DATE + 86400 * 3)) # +3 days
MULTI_END1=$(($MULTI_START1 + 86400))     # +1 day
MULTI_START2=$(($MULTI_END1 + 3600))      # +1 hour after first booking ends
MULTI_END2=$(($MULTI_START2 + 86400))     # +1 day

# Create first booking
MULTI_BOOKING1_OUTPUT=$(stellar contract invoke --global testnet --contract-id $BOOKING_CONTRACT_ID --function create_booking -- '$MULTI_PROPERTY_ID' '$MULTI_USER1' $MULTI_START1 $MULTI_END1 $TOTAL_PRICE 2>&1)
MULTI_BOOKING1_ID=$(echo "$MULTI_BOOKING1_OUTPUT" | grep -o '[0-9]*' | tail -1)

if [ -n "$MULTI_BOOKING1_ID" ]; then
    log_success "First multi-booking created: $MULTI_BOOKING1_ID"
    
    # Create second non-overlapping booking
    run_test "Multiple bookings - non-overlapping" \
        "stellar contract invoke --global testnet --contract-id $BOOKING_CONTRACT_ID --function create_booking -- '$MULTI_PROPERTY_ID' '$MULTI_USER2' $MULTI_START2 $MULTI_END2 $TOTAL_PRICE" \
        "success"
else
    log_error "Failed to create first multi-booking"
fi

# Test 17: Edge case - minimum duration booking
log_info "Test 17: Edge case - minimum duration booking"
EDGE_PROPERTY_ID="PROP_EDGE_$(date +%s)"
EDGE_USER_ID="USER_EDGE_$(date +%s)"
EDGE_START=$(($START_DATE + 86400 * 4)) # +4 days
EDGE_END=$(($EDGE_START + 1))           # +1 second

run_test "Minimum duration booking" \
    "stellar contract invoke --global testnet --contract-id $BOOKING_CONTRACT_ID --function create_booking -- '$EDGE_PROPERTY_ID' '$EDGE_USER_ID' $EDGE_START $EDGE_END $TOTAL_PRICE" \
    "success"

# Test 18: Edge case - maximum price
log_info "Test 18: Edge case - maximum price"
MAX_PRICE_PROPERTY_ID="PROP_MAX_PRICE_$(date +%s)"
MAX_PRICE_USER_ID="USER_MAX_PRICE_$(date +%s)"
MAX_PRICE_START=$(($START_DATE + 86400 * 5)) # +5 days
MAX_PRICE_END=$(($MAX_PRICE_START + 86400))  # +1 day
MAX_PRICE=9223372036854775807 # Max i128

run_test "Maximum price booking" \
    "stellar contract invoke --global testnet --contract-id $BOOKING_CONTRACT_ID --function create_booking -- '$MAX_PRICE_PROPERTY_ID' '$MAX_PRICE_USER_ID' $MAX_PRICE_START $MAX_PRICE_END $MAX_PRICE" \
    "success"

# Performance test - multiple rapid bookings
log_info "Performance test: Multiple rapid bookings"
PERF_PROPERTY_ID="PROP_PERF_$(date +%s)"
PERF_START=$(($START_DATE + 86400 * 6)) # +6 days
PERF_END=$(($PERF_START + 86400))       # +1 day

for i in {1..5}; do
    PERF_USER_ID="USER_PERF${i}_$(date +%s)"
    PERF_START_I=$(($PERF_START + $i * 86400)) # Each booking starts 1 day after previous
    PERF_END_I=$(($PERF_START_I + 86400))
    
    run_test "Performance test - booking $i" \
        "stellar contract invoke --global testnet --contract-id $BOOKING_CONTRACT_ID --function create_booking -- '$PERF_PROPERTY_ID' '$PERF_USER_ID' $PERF_START_I $PERF_END_I $TOTAL_PRICE" \
        "success"
done

# Create test report
log_info "Creating test report..."
cat > "$TESTS_DIR/logs/booking-test-report-$(date +%Y%m%d-%H%M%S).json" << EOF
{
  "test_timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "contract_id": "$BOOKING_CONTRACT_ID",
  "network": "$STELLAR_NETWORK",
  "test_summary": {
    "total_tests": $TEST_COUNT,
    "passed": $PASSED_COUNT,
    "failed": $FAILED_COUNT
  },
  "test_data": {
    "property_id": "$PROPERTY_ID",
    "user_id": "$USER_ID",
    "booking_id": "$BOOKING_ID",
    "start_date": $START_DATE,
    "end_date": $END_DATE,
    "total_price": $TOTAL_PRICE
  },
  "test_results": [
EOF

for i in "${!TEST_RESULTS[@]}"; do
    local result="${TEST_RESULTS[$i]}"
    local status="${result%%:*}"
    local test_name="${result#*:}"
    
    cat >> "$TESTS_DIR/logs/booking-test-report-$(date +%Y%m%d-%H%M%S).json" << EOF
    {
      "test": "$test_name",
      "status": "$status"
    }EOF
    
    if [ $i -lt $((${#TEST_RESULTS[@]} - 1)) ]; then
        echo "," >> "$TESTS_DIR/logs/booking-test-report-$(date +%Y%m%d-%H%M%S).json"
    fi
done

cat >> "$TESTS_DIR/logs/booking-test-report-$(date +%Y%m%d-%H%M%S).json" << EOF
  ]
}
EOF

# Print final summary
log_info "Booking Contract Test Summary"
log_info "============================="
print_test_summary

if [ $FAILED_COUNT -eq 0 ]; then
    log_success "All booking contract tests passed!"
    log_info "Test report saved to: $TESTS_DIR/logs/booking-test-report-$(date +%Y%m%d-%H%M%S).json"
else
    log_error "Some tests failed. Check the test report for details."
    exit 1
fi

log_info "Next steps:"
log_info "1. Run property listing tests: ./tests/cli/test-property-listing.sh"
log_info "2. Run review contract tests: ./tests/cli/test-review.sh"
log_info "3. Run integration tests: ./tests/cli/integration-test.sh"

exit $?
