#!/bin/bash

# Review Contract Test Script
# Tests the review contract functions using stellar contract invoke

set -e

# Load configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/utils/network-config.sh"
source "$SCRIPT_DIR/utils/test-helpers.sh"
source "$SCRIPT_DIR/utils/contract-addresses.sh"

# Test configuration
TEST_LOG="$TESTS_DIR/logs/review-test-$(date +%Y%m%d-%H%M%S).log"
TEST_DATA_FILE="$FIXTURES_DIR/test-data.json"

log_info "Starting Review Contract Tests..."
log_info "Test log: $TEST_LOG"

# Create logs directory
mkdir -p "$TESTS_DIR/logs"

# Check if contract is deployed
REVIEW_CONTRACT_ID=$(get_contract_address "review_contract")
if [ "$REVIEW_CONTRACT_ID" = "null" ] || [ -z "$REVIEW_CONTRACT_ID" ]; then
    log_error "Review contract not deployed!"
    log_info "Please run: ./tests/cli/deploy.sh"
    exit 1
fi

log_success "Review contract ID: $REVIEW_CONTRACT_ID"

# Generate test data
BOOKING_ID="BOOKING_$(date +%s)"
REVIEWER_DID="did:stellar:test:reviewer$(date +%s)"
TARGET_DID="did:stellar:test:target$(date +%s)"
RATING=5
COMMENT="Excellent property and great host!"

log_info "Test data:"
log_info "  Booking ID: $BOOKING_ID"
log_info "  Reviewer DID: $REVIEWER_DID"
log_info "  Target DID: $TARGET_DID"
log_info "  Rating: $RATING"
log_info "  Comment: $COMMENT"

# Test 1: Submit review
log_info "Test 1: Submit review"
run_test "Submit review" \
    "stellar contract invoke --global testnet --contract-id $REVIEW_CONTRACT_ID --function submit_review -- '$BOOKING_ID' '$REVIEWER_DID' '$TARGET_DID' $RATING '$COMMENT'" \
    "success"

# Test 2: Get reviews for user
log_info "Test 2: Get reviews for user"
run_test "Get reviews for user" \
    "stellar contract invoke --global testnet --contract-id $REVIEW_CONTRACT_ID --function get_reviews_for_user -- '$TARGET_DID'" \
    "success"

# Test 3: Get reputation score
log_info "Test 3: Get reputation score"
run_test "Get reputation score" \
    "stellar contract invoke --global testnet --contract-id $REVIEW_CONTRACT_ID --function get_reputation -- '$TARGET_DID'" \
    "success"

# Test 4: Submit duplicate review (should fail)
log_info "Test 4: Submit duplicate review (should fail)"
run_test "Submit duplicate review" \
    "stellar contract invoke --global testnet --contract-id $REVIEW_CONTRACT_ID --function submit_review -- '$BOOKING_ID' '$REVIEWER_DID' '$TARGET_DID' $RATING '$COMMENT'" \
    "failure"

# Test 5: Invalid rating (0)
log_info "Test 5: Invalid rating (0)"
run_test "Invalid rating - 0" \
    "stellar contract invoke --global testnet --contract-id $REVIEW_CONTRACT_ID --function submit_review -- '$BOOKING_ID' '$REVIEWER_DID' '$TARGET_DID' 0 '$COMMENT'" \
    "failure"

# Test 6: Invalid rating (6)
log_info "Test 6: Invalid rating (6)"
run_test "Invalid rating - 6" \
    "stellar contract invoke --global testnet --contract-id $REVIEW_CONTRACT_ID --function submit_review -- '$BOOKING_ID' '$REVIEWER_DID' '$TARGET_DID' 6 '$COMMENT'" \
    "failure"

# Test 7: Valid ratings (1-5)
log_info "Test 7: Valid ratings (1-5)"
for rating in {1..5}; do
    TEST_BOOKING_ID="BOOKING_RATING${rating}_$(date +%s)"
    TEST_REVIEWER_DID="did:stellar:test:reviewer${rating}_$(date +%s)"
    TEST_TARGET_DID="did:stellar:test:target${rating}_$(date +%s)"
    TEST_COMMENT="Rating ${rating} comment"
    
    run_test "Valid rating - $rating" \
        "stellar contract invoke --global testnet --contract-id $REVIEW_CONTRACT_ID --function submit_review -- '$TEST_BOOKING_ID' '$TEST_REVIEWER_DID' '$TEST_TARGET_DID' $rating '$TEST_COMMENT'" \
        "success"
done

# Test 8: Empty comment
log_info "Test 8: Empty comment"
EMPTY_COMMENT_BOOKING_ID="BOOKING_EMPTY_COMMENT_$(date +%s)"
EMPTY_COMMENT_REVIEWER_DID="did:stellar:test:empty_comment_reviewer_$(date +%s)"
EMPTY_COMMENT_TARGET_DID="did:stellar:test:empty_comment_target_$(date +%s)"

run_test "Empty comment" \
    "stellar contract invoke --global testnet --contract-id $REVIEW_CONTRACT_ID --function submit_review -- '$EMPTY_COMMENT_BOOKING_ID' '$EMPTY_COMMENT_REVIEWER_DID' '$EMPTY_COMMENT_TARGET_DID' 4 ''" \
    "success"

# Test 9: Long comment (within limit)
log_info "Test 9: Long comment (within limit)"
LONG_COMMENT_BOOKING_ID="BOOKING_LONG_COMMENT_$(date +%s)"
LONG_COMMENT_REVIEWER_DID="did:stellar:test:long_comment_reviewer_$(date +%s)"
LONG_COMMENT_TARGET_DID="did:stellar:test:long_comment_target_$(date +%s)"
LONG_COMMENT="This is a very long comment that describes the property in great detail. The host was amazing, the location was perfect, and the amenities exceeded expectations. I would definitely recommend this property to anyone looking for a great stay. The communication was excellent and the check-in process was smooth. Overall, this was one of the best experiences I've had with a rental property."

run_test "Long comment (within limit)" \
    "stellar contract invoke --global testnet --contract-id $REVIEW_CONTRACT_ID --function submit_review -- '$LONG_COMMENT_BOOKING_ID' '$LONG_COMMENT_REVIEWER_DID' '$LONG_COMMENT_TARGET_DID' 5 '$LONG_COMMENT'" \
    "success"

# Test 10: Comment too long (over 500 characters)
log_info "Test 10: Comment too long (over 500 characters)"
TOO_LONG_COMMENT_BOOKING_ID="BOOKING_TOO_LONG_COMMENT_$(date +%s)"
TOO_LONG_COMMENT_REVIEWER_DID="did:stellar:test:too_long_comment_reviewer_$(date +%s)"
TOO_LONG_COMMENT_TARGET_DID="did:stellar:test:too_long_comment_target_$(date +%s)"
TOO_LONG_COMMENT="$(printf 'A%.0s' {1..600})" # 600 character comment

run_test "Comment too long" \
    "stellar contract invoke --global testnet --contract-id $REVIEW_CONTRACT_ID --function submit_review -- '$TOO_LONG_COMMENT_BOOKING_ID' '$TOO_LONG_COMMENT_REVIEWER_DID' '$TOO_LONG_COMMENT_TARGET_DID' 5 '$TOO_LONG_COMMENT'" \
    "failure"

# Test 11: Empty booking ID
log_info "Test 11: Empty booking ID"
EMPTY_BOOKING_ID_REVIEWER_DID="did:stellar:test:empty_booking_reviewer_$(date +%s)"
EMPTY_BOOKING_ID_TARGET_DID="did:stellar:test:empty_booking_target_$(date +%s)"

run_test "Empty booking ID" \
    "stellar contract invoke --global testnet --contract-id $REVIEW_CONTRACT_ID --function submit_review -- '' '$EMPTY_BOOKING_ID_REVIEWER_DID' '$EMPTY_BOOKING_ID_TARGET_DID' 4 '$COMMENT'" \
    "failure"

# Test 12: Empty reviewer DID
log_info "Test 12: Empty reviewer DID"
EMPTY_REVIEWER_BOOKING_ID="BOOKING_EMPTY_REVIEWER_$(date +%s)"
EMPTY_REVIEWER_TARGET_DID="did:stellar:test:empty_reviewer_target_$(date +%s)"

run_test "Empty reviewer DID" \
    "stellar contract invoke --global testnet --contract-id $REVIEW_CONTRACT_ID --function submit_review -- '$EMPTY_REVIEWER_BOOKING_ID' '' '$EMPTY_REVIEWER_TARGET_DID' 4 '$COMMENT'" \
    "failure"

# Test 13: Empty target DID
log_info "Test 13: Empty target DID"
EMPTY_TARGET_BOOKING_ID="BOOKING_EMPTY_TARGET_$(date +%s)"
EMPTY_TARGET_REVIEWER_DID="did:stellar:test:empty_target_reviewer_$(date +%s)"

run_test "Empty target DID" \
    "stellar contract invoke --global testnet --contract-id $REVIEW_CONTRACT_ID --function submit_review -- '$EMPTY_TARGET_BOOKING_ID' '$EMPTY_TARGET_REVIEWER_DID' '' 4 '$COMMENT'" \
    "failure"

# Test 14: Multiple reviews for same target from different reviewers
log_info "Test 14: Multiple reviews for same target from different reviewers"
MULTI_TARGET_DID="did:stellar:test:multi_target_$(date +%s)"

for i in {1..5}; do
    MULTI_BOOKING_ID="BOOKING_MULTI${i}_$(date +%s)"
    MULTI_REVIEWER_DID="did:stellar:test:multi_reviewer${i}_$(date +%s)"
    MULTI_COMMENT="Review $i for multi-target property"
    
    run_test "Multiple reviews - reviewer $i" \
        "stellar contract invoke --global testnet --contract-id $REVIEW_CONTRACT_ID --function submit_review -- '$MULTI_BOOKING_ID' '$MULTI_REVIEWER_DID' '$MULTI_TARGET_DID' $i '$MULTI_COMMENT'" \
        "success"
done

# Test 15: Get reviews for user with multiple reviews
log_info "Test 15: Get reviews for user with multiple reviews"
run_test "Get multiple reviews for user" \
    "stellar contract invoke --global testnet --contract-id $REVIEW_CONTRACT_ID --function get_reviews_for_user -- '$MULTI_TARGET_DID'" \
    "success"

# Test 16: Get reputation for user with multiple reviews
log_info "Test 16: Get reputation for user with multiple reviews"
run_test "Get reputation for user with multiple reviews" \
    "stellar contract invoke --global testnet --contract-id $REVIEW_CONTRACT_ID --function get_reputation -- '$MULTI_TARGET_DID'" \
    "success"

# Test 17: Edge case - maximum valid rating
log_info "Test 17: Edge case - maximum valid rating"
MAX_RATING_BOOKING_ID="BOOKING_MAX_RATING_$(date +%s)"
MAX_RATING_REVIEWER_DID="did:stellar:test:max_rating_reviewer_$(date +%s)"
MAX_RATING_TARGET_DID="did:stellar:test:max_rating_target_$(date +%s)"
MAX_RATING_COMMENT="Perfect 5-star experience!"

run_test "Maximum valid rating" \
    "stellar contract invoke --global testnet --contract-id $REVIEW_CONTRACT_ID --function submit_review -- '$MAX_RATING_BOOKING_ID' '$MAX_RATING_REVIEWER_DID' '$MAX_RATING_TARGET_DID' 5 '$MAX_RATING_COMMENT'" \
    "success"

# Test 18: Edge case - minimum valid rating
log_info "Test 18: Edge case - minimum valid rating"
MIN_RATING_BOOKING_ID="BOOKING_MIN_RATING_$(date +%s)"
MIN_RATING_REVIEWER_DID="did:stellar:test:min_rating_reviewer_$(date +%s)"
MIN_RATING_TARGET_DID="did:stellar:test:min_rating_target_$(date +%s)"
MIN_RATING_COMMENT="Needs improvement"

run_test "Minimum valid rating" \
    "stellar contract invoke --global testnet --contract-id $REVIEW_CONTRACT_ID --function submit_review -- '$MIN_RATING_BOOKING_ID' '$MIN_RATING_REVIEWER_DID' '$MIN_RATING_TARGET_DID' 1 '$MIN_RATING_COMMENT'" \
    "success"

# Test 19: Special characters in comment
log_info "Test 19: Special characters in comment"
SPECIAL_CHAR_BOOKING_ID="BOOKING_SPECIAL_CHAR_$(date +%s)"
SPECIAL_CHAR_REVIEWER_DID="did:stellar:test:special_char_reviewer_$(date +%s)"
SPECIAL_CHAR_TARGET_DID="did:stellar:test:special_char_target_$(date +%s)"
SPECIAL_CHAR_COMMENT="Great property! 🌟⭐⭐⭐⭐⭐ Amazing location! 🏠✨ #stellarrent #awesome"

run_test "Special characters in comment" \
    "stellar contract invoke --global testnet --contract-id $REVIEW_CONTRACT_ID --function submit_review -- '$SPECIAL_CHAR_BOOKING_ID' '$SPECIAL_CHAR_REVIEWER_DID' '$SPECIAL_CHAR_TARGET_DID' 5 '$SPECIAL_CHAR_COMMENT'" \
    "success"

# Test 20: Long DID strings
log_info "Test 20: Long DID strings"
LONG_DID_BOOKING_ID="BOOKING_LONG_DID_$(date +%s)"
LONG_DID_REVIEWER_DID="did:stellar:test:very_long_reviewer_did_string_$(date +%s)_with_additional_identifiers"
LONG_DID_TARGET_DID="did:stellar:test:very_long_target_did_string_$(date +%s)_with_additional_identifiers"
LONG_DID_COMMENT="Review with long DID strings"

run_test "Long DID strings" \
    "stellar contract invoke --global testnet --contract-id $REVIEW_CONTRACT_ID --function submit_review -- '$LONG_DID_BOOKING_ID' '$LONG_DID_REVIEWER_DID' '$LONG_DID_TARGET_DID' 4 '$LONG_DID_COMMENT'" \
    "success"

# Test 21: Get reviews for non-existent user
log_info "Test 21: Get reviews for non-existent user"
NONEXISTENT_USER_DID="did:stellar:test:nonexistent_user_$(date +%s)"

run_test "Get reviews for non-existent user" \
    "stellar contract invoke --global testnet --contract-id $REVIEW_CONTRACT_ID --function get_reviews_for_user -- '$NONEXISTENT_USER_DID'" \
    "success"

# Test 22: Get reputation for non-existent user
log_info "Test 22: Get reputation for non-existent user"
run_test "Get reputation for non-existent user" \
    "stellar contract invoke --global testnet --contract-id $REVIEW_CONTRACT_ID --function get_reputation -- '$NONEXISTENT_USER_DID'" \
    "success"

# Test 23: Same reviewer, different bookings, same target
log_info "Test 23: Same reviewer, different bookings, same target"
SAME_REVIEWER_TARGET_DID="did:stellar:test:same_reviewer_target_$(date +%s)"
SAME_REVIEWER_REVIEWER_DID="did:stellar:test:same_reviewer_reviewer_$(date +%s)"

for i in {1..3}; do
    SAME_REVIEWER_BOOKING_ID="BOOKING_SAME_REVIEWER${i}_$(date +%s)"
    SAME_REVIEWER_COMMENT="Review $i from same reviewer"
    
    run_test "Same reviewer different bookings - booking $i" \
        "stellar contract invoke --global testnet --contract-id $REVIEW_CONTRACT_ID --function submit_review -- '$SAME_REVIEWER_BOOKING_ID' '$SAME_REVIEWER_REVIEWER_DID' '$SAME_REVIEWER_TARGET_DID' $i '$SAME_REVIEWER_COMMENT'" \
        "success"
done

# Test 24: Same reviewer, same booking, different targets
log_info "Test 24: Same reviewer, same booking, different targets"
SAME_BOOKING_REVIEWER_DID="did:stellar:test:same_booking_reviewer_$(date +%s)"
SAME_BOOKING_ID="BOOKING_SAME_BOOKING_$(date +%s)"

for i in {1..3}; do
    SAME_BOOKING_TARGET_DID="did:stellar:test:same_booking_target${i}_$(date +%s)"
    SAME_BOOKING_COMMENT="Review for target $i from same booking"
    
    run_test "Same booking different targets - target $i" \
        "stellar contract invoke --global testnet --contract-id $REVIEW_CONTRACT_ID --function submit_review -- '$SAME_BOOKING_ID' '$SAME_BOOKING_REVIEWER_DID' '$SAME_BOOKING_TARGET_DID' $i '$SAME_BOOKING_COMMENT'" \
        "success"
done

# Performance test - multiple reviews
log_info "Performance test: Multiple reviews submission"
for i in {1..20}; do
    PERF_BOOKING_ID="BOOKING_PERF${i}_$(date +%s)"
    PERF_REVIEWER_DID="did:stellar:test:perf_reviewer${i}_$(date +%s)"
    PERF_TARGET_DID="did:stellar:test:perf_target${i}_$(date +%s)"
    PERF_COMMENT="Performance test review $i"
    PERF_RATING=$((i % 5 + 1))
    
    run_test "Performance test - review $i" \
        "stellar contract invoke --global testnet --contract-id $REVIEW_CONTRACT_ID --function submit_review -- '$PERF_BOOKING_ID' '$PERF_REVIEWER_DID' '$PERF_TARGET_DID' $PERF_RATING '$PERF_COMMENT'" \
        "success"
done

# Test 25: Unicode characters in comment
log_info "Test 25: Unicode characters in comment"
UNICODE_BOOKING_ID="BOOKING_UNICODE_$(date +%s)"
UNICODE_REVIEWER_DID="did:stellar:test:unicode_reviewer_$(date +%s)"
UNICODE_TARGET_DID="did:stellar:test:unicode_target_$(date +%s)"
UNICODE_COMMENT="Amazing property! 🏠✨🌟 非常好的住宿体验！ 素晴らしいプロパティ！"

run_test "Unicode characters in comment" \
    "stellar contract invoke --global testnet --contract-id $REVIEW_CONTRACT_ID --function submit_review -- '$UNICODE_BOOKING_ID' '$UNICODE_REVIEWER_DID' '$UNICODE_TARGET_DID' 5 '$UNICODE_COMMENT'" \
    "success"

# Create test report
log_info "Creating test report..."
cat > "$TESTS_DIR/logs/review-test-report-$(date +%Y%m%d-%H%M%S).json" << EOF
{
  "test_timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "contract_id": "$REVIEW_CONTRACT_ID",
  "network": "$STELLAR_NETWORK",
  "test_summary": {
    "total_tests": $TEST_COUNT,
    "passed": $PASSED_COUNT,
    "failed": $FAILED_COUNT
  },
  "test_data": {
    "booking_id": "$BOOKING_ID",
    "reviewer_did": "$REVIEWER_DID",
    "target_did": "$TARGET_DID",
    "rating": $RATING,
    "comment": "$COMMENT"
  },
  "test_results": [
EOF

for i in "${!TEST_RESULTS[@]}"; do
    local result="${TEST_RESULTS[$i]}"
    local status="${result%%:*}"
    local test_name="${result#*:}"
    
    cat >> "$TESTS_DIR/logs/review-test-report-$(date +%Y%m%d-%H%M%S).json" << EOF
    {
      "test": "$test_name",
      "status": "$status"
    }EOF
    
    if [ $i -lt $((${#TEST_RESULTS[@]} - 1)) ]; then
        echo "," >> "$TESTS_DIR/logs/review-test-report-$(date +%Y%m%d-%H%M%S).json"
    fi
done

cat >> "$TESTS_DIR/logs/review-test-report-$(date +%Y%m%d-%H%M%S).json" << EOF
  ]
}
EOF

# Print final summary
log_info "Review Contract Test Summary"
log_info "==========================="
print_test_summary

if [ $FAILED_COUNT -eq 0 ]; then
    log_success "All review contract tests passed!"
    log_info "Test report saved to: $TESTS_DIR/logs/review-test-report-$(date +%Y%m%d-%H%M%S).json"
else
    log_error "Some tests failed. Check the test report for details."
    exit 1
fi

log_info "Next steps:"
log_info "1. Run integration tests: ./tests/cli/integration-test.sh"
log_info "2. Run cleanup: ./tests/cli/cleanup.sh"

exit $?
