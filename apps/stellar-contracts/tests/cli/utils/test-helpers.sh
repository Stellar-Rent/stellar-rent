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
