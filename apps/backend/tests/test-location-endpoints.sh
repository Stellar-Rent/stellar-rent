#!/bin/bash

# StellarRent Location API Testing Script
# This script tests the location autocomplete endpoints

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="http://localhost:3000"
ENDPOINT="/locations"

# Helper functions
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

test_endpoint() {
    local method=$1
    local url=$2
    local expected_status=$3
    local description=$4
    
    log_info "Testing: $description"
    
    response=$(curl -s -w "\n%{http_code}" -X "$method" "$BASE_URL$url")
    body=$(echo "$response" | head -n -1)
    status=$(echo "$response" | tail -n 1)
    
    if [ "$status" = "$expected_status" ]; then
        log_success "✅ $description (Status: $status)"
        if [ "$status" = "200" ]; then
            echo "$body" | jq '.' 2>/dev/null || echo "$body"
        fi
    else
        log_error "❌ $description (Expected: $expected_status, Got: $status)"
        echo "$body"
    fi
    
    echo "---"
}

main() {
    echo "=========================================="
    echo "🧪 StellarRent Location API Test Suite"
    echo "=========================================="
    
    log_info "Testing Location Autocomplete Endpoints"
    echo ""
    
    # Test 1: Health check
    test_endpoint "GET" "$ENDPOINT/health" "200" "Health check endpoint"
    
    # Test 2: Valid autocomplete query
    test_endpoint "GET" "$ENDPOINT/autocomplete?query=Buenos" "200" "Valid autocomplete query"
    
    # Test 3: Valid autocomplete with limit
    test_endpoint "GET" "$ENDPOINT/autocomplete?query=B&limit=5" "200" "Autocomplete with limit parameter"
    
    # Test 4: Missing query parameter
    test_endpoint "GET" "$ENDPOINT/autocomplete" "400" "Missing query parameter (should fail)"
    
    # Test 5: Empty query parameter
    test_endpoint "GET" "$ENDPOINT/autocomplete?query=" "400" "Empty query parameter (should fail)"
    
    # Test 6: Invalid characters in query
    test_endpoint "GET" "$ENDPOINT/autocomplete?query=test@#$" "400" "Invalid characters in query (should fail)"
    
    # Test 7: Limit too high
    test_endpoint "GET" "$ENDPOINT/autocomplete?query=test&limit=100" "400" "Limit too high (should fail)"
    
    # Test 8: Limit too low
    test_endpoint "GET" "$ENDPOINT/autocomplete?query=test&limit=0" "400" "Limit too low (should fail)"
    
    # Test 9: Popular locations
    test_endpoint "GET" "$ENDPOINT/popular" "200" "Popular locations endpoint"
    
    # Test 10: Popular locations with limit
    test_endpoint "GET" "$ENDPOINT/popular?limit=3" "200" "Popular locations with limit"
    
    # Test 11: Popular locations with invalid limit
    test_endpoint "GET" "$ENDPOINT/popular?limit=50" "400" "Popular locations with invalid limit (should fail)"
    
    # Test 12: Query with special characters (valid ones)
    test_endpoint "GET" "$ENDPOINT/autocomplete?query=São" "200" "Query with accented characters"
    
    # Test 13: Very long query
    test_endpoint "GET" "$ENDPOINT/autocomplete?query=$(printf 'a%.0s' {1..150})" "400" "Very long query (should fail)"
    
    # Test 14: Single character query
    test_endpoint "GET" "$ENDPOINT/autocomplete?query=A" "200" "Single character query"
    
    echo "=========================================="
    log_success "🎯 Location API Test Suite Completed!"
    echo "=========================================="
    
    log_info "Summary:"
    echo "✅ Valid requests should return 200 with proper JSON structure"
    echo "❌ Invalid requests should return 400 with validation errors"
    echo "🔍 Check the responses above for detailed results"
    echo ""
    log_info "Next steps:"
    echo "1. Verify all tests pass as expected"
    echo "2. Check response formats match API specification"
    echo "3. Test with real data in your database"
    echo "4. Run automated tests: npm test src/tests/location.test.ts"
}

# Check if server is running
if ! curl -f "$BASE_URL/health" &>/dev/null; then
    log_error "Server is not running at $BASE_URL"
    log_info "Please start the server first: npm run dev"
    exit 1
fi

# Check if jq is available for JSON formatting
if ! command -v jq &> /dev/null; then
    log_warning "jq not found. JSON responses will not be formatted."
fi

# Run tests
main "$@"
