#!/bin/bash

# Developer Quick Start Script
# Easy-to-use script for developers to test smart contracts

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
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

log_header() {
    echo -e "${CYAN}$1${NC}"
}

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
CONTRACTS_DIR="$PROJECT_ROOT/apps/stellar-contracts"
TESTS_DIR="$SCRIPT_DIR"

log_header "🚀 Stellar Smart Contract Testing - Developer Quick Start"
echo

# Check if we're in the right directory
if [ ! -d "$CONTRACTS_DIR" ]; then
    log_error "This script must be run from the stellar-contracts directory"
    log_info "Expected directory: $CONTRACTS_DIR"
    exit 1
fi

# Function to check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    local missing_deps=()
    
    # Check Stellar CLI
    if ! command -v stellar &> /dev/null; then
        missing_deps+=("Stellar CLI")
    fi
    
    # Check jq (for JSON processing)
    if ! command -v jq &> /dev/null; then
        missing_deps+=("jq")
    fi
    
    # Check bc (for calculations)
    if ! command -v bc &> /dev/null; then
        missing_deps+=("bc")
    fi
    
    if [ ${#missing_deps[@]} -gt 0 ]; then
        log_error "Missing dependencies: ${missing_deps[*]}"
        echo
        log_info "Installation instructions:"
        for dep in "${missing_deps[@]}"; do
            case "$dep" in
                "Stellar CLI")
                    log_info "  Stellar CLI: curl -s https://get.stellar.org | bash"
                    ;;
                "jq")
                    log_info "  jq: brew install jq (macOS) or apt-get install jq (Ubuntu)"
                    ;;
                "bc")
                    log_info "  bc: brew install bc (macOS) or apt-get install bc (Ubuntu)"
                    ;;
            esac
        done
        return 1
    fi
    
    log_success "All prerequisites met"
    return 0
}

# Function to setup testnet account
setup_testnet_account() {
    log_info "Setting up testnet account..."
    
    # Check if account is already configured
    if stellar account info --global testnet &> /dev/null; then
        log_success "Testnet account already configured"
        return 0
    fi
    
    log_warning "No testnet account configured"
    echo
    log_info "To set up a testnet account:"
    log_info "1. Generate a keypair:"
    log_info "   stellar keys generate --global testnet"
    echo
    log_info "2. Create the account:"
    log_info "   stellar account create --global testnet --source-key <your-key>"
    echo
    log_info "3. Fund the account:"
    log_info "   stellar account fund --global testnet <your-address>"
    echo
    
    read -p "Do you want to continue without a testnet account? (y/N): " -r
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Please set up your testnet account and run this script again"
        exit 1
    fi
    
    log_warning "Continuing without testnet account (some tests may fail)"
}

# Function to show menu
show_menu() {
    echo
    log_header "📋 Available Options:"
    echo
    echo "1. 🏗️  Setup Environment"
    echo "2. 🔨 Compile Contracts"
    echo "3. 🚀 Deploy to Testnet"
    echo "4. 🧪 Test Booking Contract"
    echo "5. 🏠 Test Property Listing Contract"
    echo "6. ⭐ Test Review Contract"
    echo "7. 🔗 Run Integration Tests"
    echo "8. 🏃 Run All Tests"
    echo "9. 🧹 Cleanup"
    echo "10. 📊 Show Test Results"
    echo "11. ❓ Help"
    echo "12. 🚪 Exit"
    echo
}

# Function to run setup
run_setup() {
    log_header "🏗️ Setting up environment..."
    bash "$TESTS_DIR/setup.sh"
}

# Function to compile contracts
run_compile() {
    log_header "🔨 Compiling contracts..."
    bash "$TESTS_DIR/compile.sh"
}

# Function to deploy contracts
run_deploy() {
    log_header "🚀 Deploying contracts to testnet..."
    bash "$TESTS_DIR/deploy.sh"
}

# Function to test booking contract
run_booking_tests() {
    log_header "🧪 Testing booking contract..."
    bash "$TESTS_DIR/test-booking.sh"
}

# Function to test property listing contract
run_property_tests() {
    log_header "🏠 Testing property listing contract..."
    bash "$TESTS_DIR/test-property-listing.sh"
}

# Function to test review contract
run_review_tests() {
    log_header "⭐ Testing review contract..."
    bash "$TESTS_DIR/test-review.sh"
}

# Function to run integration tests
run_integration_tests() {
    log_header "🔗 Running integration tests..."
    bash "$TESTS_DIR/integration-test.sh"
}

# Function to run all tests
run_all_tests() {
    log_header "🏃 Running all tests..."
    bash "$TESTS_DIR/run-all-tests.sh" --verbose
}

# Function to cleanup
run_cleanup() {
    log_header "🧹 Cleaning up..."
    bash "$TESTS_DIR/cleanup.sh"
}

# Function to show test results
show_test_results() {
    log_header "📊 Test Results"
    
    local logs_dir="$TESTS_DIR/logs"
    if [ ! -d "$logs_dir" ]; then
        log_warning "No test logs found"
        return 0
    fi
    
    local reports=($(find "$logs_dir" -name "*-test-report-*.json" -type f))
    
    if [ ${#reports[@]} -eq 0 ]; then
        log_warning "No test reports found"
        return 0
    fi
    
    log_info "Found ${#reports[@]} test reports:"
    echo
    
    for report in "${reports[@]}"; do
        local report_name=$(basename "$report")
        local report_date=$(echo "$report_name" | grep -o '[0-9]\{8\}-[0-9]\{6\}')
        
        log_info "📄 $report_name"
        
        # Extract summary from report
        if command -v jq &> /dev/null; then
            local total=$(jq -r '.test_summary.total_tests // "N/A"' "$report" 2>/dev/null)
            local passed=$(jq -r '.test_summary.passed // "N/A"' "$report" 2>/dev/null)
            local failed=$(jq -r '.test_summary.failed // "N/A"' "$report" 2>/dev/null)
            
            if [ "$total" != "N/A" ]; then
                log_info "   Total: $total | Passed: $passed | Failed: $failed"
            fi
        fi
        
        echo
    done
    
    log_info "📁 All reports are stored in: $logs_dir"
}

# Function to show help
show_help() {
    log_header "❓ Help - Smart Contract Testing"
    echo
    log_info "This script provides an easy way to test Stellar smart contracts."
    echo
    log_info "Prerequisites:"
    log_info "• Stellar CLI installed"
    log_info "• Testnet account configured"
    log_info "• jq and bc utilities installed"
    echo
    log_info "Test Flow:"
    log_info "1. Setup Environment - Configure test environment"
    log_info "2. Compile Contracts - Build WASM files"
    log_info "3. Deploy to Testnet - Deploy contracts to Stellar testnet"
    log_info "4-6. Test Individual Contracts - Test each contract separately"
    log_info "7. Integration Tests - Test cross-contract interactions"
    log_info "8. Run All Tests - Execute complete test suite"
    log_info "9. Cleanup - Clean up test artifacts"
    echo
    log_info "Contract Addresses:"
    log_info "• Contract addresses are stored in contract-addresses.json"
    log_info "• Use these addresses for frontend integration"
    echo
    log_info "Troubleshooting:"
    log_info "• Check test logs in tests/cli/logs/"
    log_info "• Ensure testnet account has sufficient XLM"
    log_info "• Verify network connectivity"
    echo
}

# Main menu loop
main() {
    # Check prerequisites
    if ! check_prerequisites; then
        exit 1
    fi
    
    # Setup testnet account
    setup_testnet_account
    
    while true; do
        show_menu
        read -p "Select an option (1-12): " -r choice
        
        case $choice in
            1)
                run_setup
                ;;
            2)
                run_compile
                ;;
            3)
                run_deploy
                ;;
            4)
                run_booking_tests
                ;;
            5)
                run_property_tests
                ;;
            6)
                run_review_tests
                ;;
            7)
                run_integration_tests
                ;;
            8)
                run_all_tests
                ;;
            9)
                run_cleanup
                ;;
            10)
                show_test_results
                ;;
            11)
                show_help
                ;;
            12)
                log_info "👋 Goodbye!"
                exit 0
                ;;
            *)
                log_error "Invalid option. Please select 1-12."
                ;;
        esac
        
        echo
        read -p "Press Enter to continue..."
    done
}

# Handle command line arguments
if [ $# -gt 0 ]; then
    case $1 in
        --setup)
            run_setup
            ;;
        --compile)
            run_compile
            ;;
        --deploy)
            run_deploy
            ;;
        --test-booking)
            run_booking_tests
            ;;
        --test-property)
            run_property_tests
            ;;
        --test-review)
            run_review_tests
            ;;
        --integration)
            run_integration_tests
            ;;
        --all)
            run_all_tests
            ;;
        --cleanup)
            run_cleanup
            ;;
        --results)
            show_test_results
            ;;
        --help)
            show_help
            ;;
        *)
            log_error "Unknown option: $1"
            log_info "Use --help for usage information"
            exit 1
            ;;
    esac
else
    # Run interactive menu
    main
fi
