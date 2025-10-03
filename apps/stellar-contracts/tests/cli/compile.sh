#!/bin/bash

# Stellar Contract Compilation Script
# Compiles all smart contracts using stellar contract build

set -e

# Load configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/utils/network-config.sh"
source "$SCRIPT_DIR/utils/test-helpers.sh"

# Configuration
CONTRACTS=("booking" "property-listing" "review-contract")
BUILD_DIR="$CONTRACTS_DIR/target"
WASM_DIR="$BUILD_DIR/wasm32-unknown-unknown/release"

log_info "Starting contract compilation..."
log_info "Contracts directory: $CONTRACTS_DIR"
log_info "Build directory: $BUILD_DIR"

# Clean previous builds
log_info "Cleaning previous builds..."
if [ -d "$BUILD_DIR" ]; then
    rm -rf "$BUILD_DIR"
fi

# Change to contracts directory
cd "$CONTRACTS_DIR"

# Compile each contract
for contract in "${CONTRACTS[@]}"; do
    log_info "Compiling contract: $contract"
    
    # Change to contract directory
    cd "$CONTRACTS_DIR/contracts/$contract"
    
    # Check if Cargo.toml exists
    if [ ! -f "Cargo.toml" ]; then
        log_error "Cargo.toml not found in $contract"
        exit 1
    fi
    
    # Compile using stellar contract build
    log_info "Running: stellar contract build"
    if stellar contract build; then
        log_success "Successfully compiled $contract"
    else
        log_error "Failed to compile $contract"
        exit 1
    fi
    
    # Verify WASM file was created (convert hyphens to underscores)
    wasm_name=$(echo "$contract" | sed 's/-/_/g')
    wasm_file="$WASM_DIR/${wasm_name}.wasm"
    if [ -f "$wasm_file" ]; then
        file_size=$(ls -lh "$wasm_file" | awk '{print $5}')
        log_success "WASM file created: $wasm_file ($file_size)"
    else
        log_error "WASM file not found: $wasm_file"
        exit 1
    fi
done

# Verify all WASM files exist
log_info "Verifying all compiled contracts..."
for contract in "${CONTRACTS[@]}"; do
    wasm_name=$(echo "$contract" | sed 's/-/_/g')
    wasm_file="$WASM_DIR/${wasm_name}.wasm"
    if [ -f "$wasm_file" ]; then
        log_success "✓ $contract.wasm"
    else
        log_error "✗ $contract.wasm (missing)"
        exit 1
    fi
done

# Display compilation summary
log_info "Compilation Summary"
log_info "=================="
log_info "Total contracts: ${#CONTRACTS[@]}"
log_info "Successfully compiled: ${#CONTRACTS[@]}"
log_info "Build directory: $WASM_DIR"

echo
log_info "Compiled WASM files:"
for contract in "${CONTRACTS[@]}"; do
    wasm_name=$(echo "$contract" | sed 's/-/_/g')
    wasm_file="$WASM_DIR/${wasm_name}.wasm"
        file_size=$(ls -lh "$wasm_file" | awk '{print $5}')
    echo "  - $contract.wasm ($file_size)"
done

# Check WASM file sizes (should be reasonable)
log_info "Checking WASM file sizes..."
for contract in "${CONTRACTS[@]}"; do
    wasm_name=$(echo "$contract" | sed 's/-/_/g')
    wasm_file="$WASM_DIR/${wasm_name}.wasm"
    file_size_bytes=$(stat -f%z "$wasm_file" 2>/dev/null || stat -c%s "$wasm_file" 2>/dev/null)
    
    # Convert to KB
    file_size_kb=$((file_size_bytes / 1024))
    
    if [ $file_size_kb -gt 10000 ]; then
        log_warning "$contract.wasm is large ($file_size_kb KB) - consider optimization"
    else
        log_success "$contract.wasm size is reasonable ($file_size_kb KB)"
    fi
done

# Create build info file
log_info "Creating build info..."
cat > "$BUILD_DIR/build-info.json" << EOF
{
  "build_timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "stellar_cli_version": "$(stellar version 2>&1 | head -n1)",
  "network": "$STELLAR_NETWORK",
  "contracts": [
EOF

for i in "${!CONTRACTS[@]}"; do
    contract="${CONTRACTS[$i]}"
    wasm_name=$(echo "$contract" | sed 's/-/_/g')
    wasm_file="$WASM_DIR/${wasm_name}.wasm"
    file_size_bytes=$(stat -f%z "$wasm_file" 2>/dev/null || stat -c%s "$wasm_file" 2>/dev/null)
    file_hash=$(shasum -a 256 "$wasm_file" | awk '{print $1}')
    
    cat >> "$BUILD_DIR/build-info.json" << EOF
    {
      "name": "$contract",
      "wasm_file": "$wasm_file",
      "size_bytes": $file_size_bytes,
      "sha256": "$file_hash"
    }
EOF
    
    if [ $i -lt $((${#CONTRACTS[@]} - 1)) ]; then
        echo "," >> "$BUILD_DIR/build-info.json"
    fi
done

cat >> "$BUILD_DIR/build-info.json" << EOF
  ]
}
EOF

log_success "Build info saved to: $BUILD_DIR/build-info.json"

# Run basic validation tests
log_info "Running basic validation tests..."

# Test 1: Check if WASM files are valid
run_test "WASM file validation" "file $WASM_DIR/booking.wasm | grep -q 'WebAssembly'" "success"

# Test 2: Check if files are not empty
run_test "WASM file not empty" "[ -s $WASM_DIR/booking.wasm ]" "success"

# Test 3: Check if all expected files exist
run_test "All WASM files exist" "[ -f $WASM_DIR/booking.wasm ] && [ -f $WASM_DIR/property_listing.wasm ] && [ -f $WASM_DIR/review_contract.wasm ]" "success"

# Print test summary
print_test_summary

log_success "Contract compilation completed successfully!"
log_info "Next steps:"
log_info "1. Deploy contracts: ./tests/cli/deploy.sh"
log_info "2. Run tests: ./tests/cli/test-booking.sh"

exit $?
