#!/bin/bash

# Cleanup Script
# Cleans up test environment and provides summary

set -e

# Load configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/utils/network-config.sh"
source "$SCRIPT_DIR/utils/test-helpers.sh"
source "$SCRIPT_DIR/utils/contract-addresses.sh"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

log_info "Starting cleanup process..."

# Configuration
CLEANUP_LOG="$TESTS_DIR/logs/cleanup-$(date +%Y%m%d-%H%M%S).log"
KEEP_CONTRACTS=${KEEP_CONTRACTS:-false}
KEEP_LOGS=${KEEP_LOGS:-true}

log_info "Cleanup configuration:"
log_info "  Keep contracts: $KEEP_CONTRACTS"
log_info "  Keep logs: $KEEP_LOGS"
log_info "  Cleanup log: $CLEANUP_LOG"

# Create logs directory if it doesn't exist
mkdir -p "$TESTS_DIR/logs"

# Function to log cleanup actions
log_cleanup() {
    echo "$(date -u +"%Y-%m-%dT%H:%M:%SZ") - $1" >> "$CLEANUP_LOG"
}

# Step 1: Generate test summary
log_info "Step 1: Generating test summary..."

# Collect all test reports
TEST_REPORTS=()
if [ -d "$TESTS_DIR/logs" ]; then
    TEST_REPORTS=($(find "$TESTS_DIR/logs" -name "*-test-report-*.json" -type f))
fi

log_info "Found ${#TEST_REPORTS[@]} test reports"

# Create overall summary
SUMMARY_FILE="$TESTS_DIR/logs/test-summary-$(date +%Y%m%d-%H%M%S).json"

cat > "$SUMMARY_FILE" << EOF
{
  "summary_timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "network": "$STELLAR_NETWORK",
  "total_test_reports": ${#TEST_REPORTS[@]},
  "contract_addresses": {
EOF

# Add contract addresses to summary
BOOKING_CONTRACT_ID=$(get_contract_address "booking")
PROPERTY_CONTRACT_ID=$(get_contract_address "property_listing")
REVIEW_CONTRACT_ID=$(get_contract_address "review_contract")

cat >> "$SUMMARY_FILE" << EOF
    "booking": "$BOOKING_CONTRACT_ID",
    "property_listing": "$PROPERTY_CONTRACT_ID",
    "review_contract": "$REVIEW_CONTRACT_ID"
  },
  "test_reports": [
EOF

# Add each test report to summary
for i in "${!TEST_REPORTS[@]}"; do
    local report="${TEST_REPORTS[$i]}"
    local report_name=$(basename "$report")
    
    cat >> "$SUMMARY_FILE" << EOF
    {
      "report_file": "$report_name",
      "report_path": "$report"
    }EOF
    
    if [ $i -lt $((${#TEST_REPORTS[@]} - 1)) ]; then
        echo "," >> "$SUMMARY_FILE"
    fi
done

cat >> "$SUMMARY_FILE" << EOF
  ],
  "cleanup_options": {
    "keep_contracts": $KEEP_CONTRACTS,
    "keep_logs": $KEEP_LOGS
  }
}
EOF

log_success "Test summary created: $SUMMARY_FILE"
log_cleanup "Created test summary: $SUMMARY_FILE"

# Step 2: Contract cleanup (optional)
if [ "$KEEP_CONTRACTS" = "false" ]; then
    log_info "Step 2: Contract cleanup (optional - contracts will remain deployed)"
    log_warning "Note: Contracts remain deployed on testnet for future use"
    log_warning "To remove contracts, you would need to manually interact with them"
    log_cleanup "Contract cleanup skipped - contracts remain deployed"
else
    log_info "Step 2: Keeping contracts deployed"
    log_cleanup "Contracts kept deployed as requested"
fi

# Step 3: Log cleanup
if [ "$KEEP_LOGS" = "false" ]; then
    log_info "Step 3: Cleaning up old logs..."
    
    # Keep only the last 10 log files
    if [ -d "$TESTS_DIR/logs" ]; then
        OLD_LOGS=$(find "$TESTS_DIR/logs" -name "*.log" -type f | wc -l)
        if [ $OLD_LOGS -gt 10 ]; then
            find "$TESTS_DIR/logs" -name "*.log" -type f -printf '%T@ %p\n' | sort -n | head -n -10 | cut -d' ' -f2- | xargs rm -f
            log_success "Cleaned up old log files"
            log_cleanup "Cleaned up old log files"
        else
            log_info "No old log files to clean up"
        fi
    fi
else
    log_info "Step 3: Keeping all logs"
    log_cleanup "All logs kept as requested"
fi

# Step 4: Temporary file cleanup
log_info "Step 4: Cleaning up temporary files..."

# Clean up any temporary files created during tests
TEMP_FILES=(
    "$TESTS_DIR/contract-addresses.json.tmp"
    "$TESTS_DIR/build-info.json.tmp"
    "$TESTS_DIR/test-data.json.tmp"
)

for temp_file in "${TEMP_FILES[@]}"; do
    if [ -f "$temp_file" ]; then
        rm -f "$temp_file"
        log_success "Removed temporary file: $(basename "$temp_file")"
        log_cleanup "Removed temporary file: $temp_file"
    fi
done

# Step 5: Build artifacts cleanup (optional)
log_info "Step 5: Build artifacts cleanup..."

BUILD_DIR="$CONTRACTS_DIR/target"
if [ -d "$BUILD_DIR" ]; then
    BUILD_SIZE=$(du -sh "$BUILD_DIR" | cut -f1)
    log_info "Build directory size: $BUILD_SIZE"
    
    # Ask if user wants to clean build artifacts
    if [ "$CLEAN_BUILD" = "true" ]; then
        rm -rf "$BUILD_DIR"
        log_success "Build artifacts cleaned up"
        log_cleanup "Build artifacts cleaned up"
    else
        log_info "Build artifacts kept (set CLEAN_BUILD=true to remove)"
        log_cleanup "Build artifacts kept"
    fi
fi

# Step 6: Generate final report
log_info "Step 6: Generating final cleanup report..."

FINAL_REPORT="$TESTS_DIR/logs/cleanup-report-$(date +%Y%m%d-%H%M%S).json"

cat > "$FINAL_REPORT" << EOF
{
  "cleanup_timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "network": "$STELLAR_NETWORK",
  "cleanup_actions": [
EOF

# Read cleanup log and add actions
if [ -f "$CLEANUP_LOG" ]; then
    CLEANUP_ACTIONS=$(cat "$CLEANUP_LOG" | wc -l)
    log_info "Performed $CLEANUP_ACTIONS cleanup actions"
    
    # Add cleanup actions to report
    while IFS= read -r line; do
        local action="${line#* - }"
        cat >> "$FINAL_REPORT" << EOF
    {
      "action": "$action",
      "timestamp": "${line%% - *}"
    },
EOF
    done < "$CLEANUP_LOG"
    
    # Remove trailing comma
    sed -i '$ s/,$//' "$FINAL_REPORT"
fi

cat >> "$FINAL_REPORT" << EOF
  ],
  "contract_status": {
    "booking": "$BOOKING_CONTRACT_ID",
    "property_listing": "$PROPERTY_CONTRACT_ID", 
    "review_contract": "$REVIEW_CONTRACT_ID",
    "all_deployed": $(if all_contracts_deployed; then echo "true"; else echo "false"; fi)
  },
  "files_kept": {
    "logs": $KEEP_LOGS,
    "contracts": $KEEP_CONTRACTS,
    "build_artifacts": $(if [ "$CLEAN_BUILD" = "true" ]; then echo "false"; else echo "true"; fi)
  },
  "next_steps": [
    "Review test reports in $TESTS_DIR/logs/",
    "Contracts remain deployed for future testing",
    "Run 'stellar contract show' to verify contract status",
    "Use contract addresses for frontend integration"
  ]
}
EOF

log_success "Final cleanup report created: $FINAL_REPORT"

# Step 7: Display summary
log_info "Cleanup Summary"
log_info "==============="

echo
log_info "Test Results:"
if [ ${#TEST_REPORTS[@]} -gt 0 ]; then
    for report in "${TEST_REPORTS[@]}"; do
        local report_name=$(basename "$report")
        log_success "✓ $report_name"
    done
else
    log_warning "No test reports found"
fi

echo
log_info "Contract Status:"
if [ "$BOOKING_CONTRACT_ID" != "null" ]; then
    log_success "✓ Booking Contract: $BOOKING_CONTRACT_ID"
else
    log_error "✗ Booking Contract: Not deployed"
fi

if [ "$PROPERTY_CONTRACT_ID" != "null" ]; then
    log_success "✓ Property Listing Contract: $PROPERTY_CONTRACT_ID"
else
    log_error "✗ Property Listing Contract: Not deployed"
fi

if [ "$REVIEW_CONTRACT_ID" != "null" ]; then
    log_success "✓ Review Contract: $REVIEW_CONTRACT_ID"
else
    log_error "✗ Review Contract: Not deployed"
fi

echo
log_info "Files and Directories:"
log_info "  Test logs: $TESTS_DIR/logs/"
log_info "  Contract addresses: $TESTS_DIR/contract-addresses.json"
log_info "  Test summary: $SUMMARY_FILE"
log_info "  Cleanup report: $FINAL_REPORT"

echo
log_info "Next Steps:"
log_info "1. Review test reports for any failures"
log_info "2. Use contract addresses for frontend integration"
log_info "3. Run 'stellar contract show <contract-id>' to verify contracts"
log_info "4. Deploy to mainnet when ready for production"

echo
log_success "Cleanup completed successfully!"

# Step 8: Optional verification
if [ "$VERIFY_CONTRACTS" = "true" ]; then
    log_info "Step 8: Verifying contract status..."
    
    for contract_name in "booking" "property_listing" "review_contract"; do
        local contract_id=$(get_contract_address "$contract_name")
        if [ "$contract_id" != "null" ]; then
            if stellar contract show --global testnet "$contract_id" &> /dev/null; then
                log_success "✓ $contract_name contract verified on network"
            else
                log_warning "⚠ $contract_name contract not found on network"
            fi
        fi
    done
fi

log_cleanup "Cleanup process completed successfully"

exit 0
