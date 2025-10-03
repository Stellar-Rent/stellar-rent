#!/bin/bash

# Master Test Runner Script
# Runs all smart contract tests in sequence

set -e

# Load configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/utils/network-config.sh"
source "$SCRIPT_DIR/utils/test-helpers.sh"

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

# Configuration
RUN_ALL=${RUN_ALL:-true}
SKIP_SETUP=${SKIP_SETUP:-false}
SKIP_COMPILE=${SKIP_COMPILE:-false}
SKIP_DEPLOY=${SKIP_DEPLOY:-false}
SKIP_TESTS=${SKIP_TESTS:-false}
SKIP_CLEANUP=${SKIP_CLEANUP:-false}
VERBOSE=${VERBOSE:-false}

# Test phases
PHASES=(
    "setup:Environment Setup"
    "compile:Contract Compilation"
    "deploy:Contract Deployment"
    "test-booking:Booking Contract Tests"
    "test-property-listing:Property Listing Contract Tests"
    "test-review:Review Contract Tests"
    "integration:Integration Tests"
    "cleanup:Cleanup"
)

# Track results
PHASE_RESULTS=()
TOTAL_PHASES=${#PHASES[@]}
COMPLETED_PHASES=0
FAILED_PHASES=0

log_info "Starting Master Test Runner..."
log_info "Configuration:"
log_info "  Run all phases: $RUN_ALL"
log_info "  Skip setup: $SKIP_SETUP"
log_info "  Skip compile: $SKIP_COMPILE"
log_info "  Skip deploy: $SKIP_DEPLOY"
log_info "  Skip tests: $SKIP_TESTS"
log_info "  Skip cleanup: $SKIP_CLEANUP"
log_info "  Verbose: $VERBOSE"

# Function to run a phase
run_phase() {
    local phase_key="$1"
    local phase_name="$2"
    local script_name="$phase_key.sh"
    
    log_info "=========================================="
    log_info "Phase: $phase_name"
    log_info "Script: $script_name"
    log_info "=========================================="
    
    local script_path="$SCRIPT_DIR/$script_name"
    
    if [ ! -f "$script_path" ]; then
        log_error "Script not found: $script_path"
        PHASE_RESULTS+=("FAIL:$phase_name:Script not found")
        FAILED_PHASES=$((FAILED_PHASES + 1))
        return 1
    fi
    
    local start_time=$(date +%s)
    
    if [ "$VERBOSE" = "true" ]; then
        if bash "$script_path"; then
            local end_time=$(date +%s)
            local duration=$((end_time - start_time))
            log_success "Phase completed: $phase_name (${duration}s)"
            PHASE_RESULTS+=("PASS:$phase_name:Completed in ${duration}s")
            COMPLETED_PHASES=$((COMPLETED_PHASES + 1))
        else
            local end_time=$(date +%s)
            local duration=$((end_time - start_time))
            log_error "Phase failed: $phase_name (${duration}s)"
            PHASE_RESULTS+=("FAIL:$phase_name:Failed after ${duration}s")
            FAILED_PHASES=$((FAILED_PHASES + 1))
            return 1
        fi
    else
        if bash "$script_path" > /dev/null 2>&1; then
            local end_time=$(date +%s)
            local duration=$((end_time - start_time))
            log_success "Phase completed: $phase_name (${duration}s)"
            PHASE_RESULTS+=("PASS:$phase_name:Completed in ${duration}s")
            COMPLETED_PHASES=$((COMPLETED_PHASES + 1))
        else
            local end_time=$(date +%s)
            local duration=$((end_time - start_time))
            log_error "Phase failed: $phase_name (${duration}s)"
            PHASE_RESULTS+=("FAIL:$phase_name:Failed after ${duration}s")
            FAILED_PHASES=$((FAILED_PHASES + 1))
            return 1
        fi
    fi
}

# Function to check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if Stellar CLI is installed
    if ! command -v stellar &> /dev/null; then
        log_error "Stellar CLI is not installed!"
        log_info "Please install it first: curl -s https://get.stellar.org | bash"
        return 1
    fi
    
    # Check if we're in the right directory
    if [ ! -d "$CONTRACTS_DIR" ]; then
        log_error "Contracts directory not found: $CONTRACTS_DIR"
        return 1
    fi
    
    # Check if contracts exist
    local contracts=("booking" "property-listing" "review-contract")
    for contract in "${contracts[@]}"; do
        if [ ! -d "$CONTRACTS_DIR/contracts/$contract" ]; then
            log_error "Contract directory not found: $CONTRACTS_DIR/contracts/$contract"
            return 1
        fi
    done
    
    log_success "All prerequisites met"
    return 0
}

# Main execution
main() {
    local start_time=$(date +%s)
    
    # Check prerequisites
    if ! check_prerequisites; then
        log_error "Prerequisites check failed"
        exit 1
    fi
    
    # Run phases based on configuration
    for phase in "${PHASES[@]}"; do
        local phase_key="${phase%%:*}"
        local phase_name="${phase#*:}"
        
        # Skip phases based on configuration
        case "$phase_key" in
            "setup")
                if [ "$SKIP_SETUP" = "true" ]; then
                    log_info "Skipping phase: $phase_name"
                    continue
                fi
                ;;
            "compile")
                if [ "$SKIP_COMPILE" = "true" ]; then
                    log_info "Skipping phase: $phase_name"
                    continue
                fi
                ;;
            "deploy")
                if [ "$SKIP_DEPLOY" = "true" ]; then
                    log_info "Skipping phase: $phase_name"
                    continue
                fi
                ;;
            "test-"*)
                if [ "$SKIP_TESTS" = "true" ]; then
                    log_info "Skipping phase: $phase_name"
                    continue
                fi
                ;;
            "integration")
                if [ "$SKIP_TESTS" = "true" ]; then
                    log_info "Skipping phase: $phase_name"
                    continue
                fi
                ;;
            "cleanup")
                if [ "$SKIP_CLEANUP" = "true" ]; then
                    log_info "Skipping phase: $phase_name"
                    continue
                fi
                ;;
        esac
        
        # Run the phase
        if ! run_phase "$phase_key" "$phase_name"; then
            log_error "Phase failed: $phase_name"
            
            # Ask if user wants to continue
            if [ "$CONTINUE_ON_ERROR" != "true" ]; then
                log_warning "Do you want to continue with remaining phases? (y/N)"
                read -r response
                if [[ ! "$response" =~ ^[Yy]$ ]]; then
                    log_info "Stopping test execution"
                    break
                fi
            fi
        fi
        
        echo
    done
    
    local end_time=$(date +%s)
    local total_duration=$((end_time - start_time))
    
    # Generate final report
    log_info "=========================================="
    log_info "Master Test Runner Summary"
    log_info "=========================================="
    log_info "Total duration: ${total_duration}s"
    log_info "Phases completed: $COMPLETED_PHASES"
    log_info "Phases failed: $FAILED_PHASES"
    
    echo
    log_info "Phase Results:"
    for result in "${PHASE_RESULTS[@]}"; do
        local status="${result%%:*}"
        local phase_info="${result#*:}"
        local phase_name="${phase_info%%:*}"
        local phase_details="${phase_info#*:}"
        
        if [ "$status" = "PASS" ]; then
            log_success "✓ $phase_name: $phase_details"
        else
            log_error "✗ $phase_name: $phase_details"
        fi
    done
    
    # Create master report
    local master_report="$TESTS_DIR/logs/master-test-report-$(date +%Y%m%d-%H%M%S).json"
    
    cat > "$master_report" << EOF
{
  "master_test_timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "network": "$STELLAR_NETWORK",
  "total_duration_seconds": $total_duration,
  "configuration": {
    "run_all": $RUN_ALL,
    "skip_setup": $SKIP_SETUP,
    "skip_compile": $SKIP_COMPILE,
    "skip_deploy": $SKIP_DEPLOY,
    "skip_tests": $SKIP_TESTS,
    "skip_cleanup": $SKIP_CLEANUP,
    "verbose": $VERBOSE
  },
  "summary": {
    "total_phases": $TOTAL_PHASES,
    "completed_phases": $COMPLETED_PHASES,
    "failed_phases": $FAILED_PHASES
  },
  "phase_results": [
EOF

    for i in "${!PHASE_RESULTS[@]}"; do
        local result="${PHASE_RESULTS[$i]}"
        local status="${result%%:*}"
        local phase_info="${result#*:}"
        local phase_name="${phase_info%%:*}"
        local phase_details="${phase_info#*:}"
        
        cat >> "$master_report" << EOF
    {
      "phase": "$phase_name",
      "status": "$status",
      "details": "$phase_details"
    }EOF
        
        if [ $i -lt $((${#PHASE_RESULTS[@]} - 1)) ]; then
            echo "," >> "$master_report"
        fi
    done

    cat >> "$master_report" << EOF
  ]
}
EOF

    log_success "Master test report created: $master_report"
    
    # Final status
    if [ $FAILED_PHASES -eq 0 ]; then
        log_success "All phases completed successfully!"
        exit 0
    else
        log_error "Some phases failed. Check the reports for details."
        exit 1
    fi
}

# Handle command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-setup)
            SKIP_SETUP=true
            shift
            ;;
        --skip-compile)
            SKIP_COMPILE=true
            shift
            ;;
        --skip-deploy)
            SKIP_DEPLOY=true
            shift
            ;;
        --skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        --skip-cleanup)
            SKIP_CLEANUP=true
            shift
            ;;
        --verbose)
            VERBOSE=true
            shift
            ;;
        --continue-on-error)
            CONTINUE_ON_ERROR=true
            shift
            ;;
        --help)
            echo "Master Test Runner for Stellar Smart Contracts"
            echo
            echo "Usage: $0 [options]"
            echo
            echo "Options:"
            echo "  --skip-setup          Skip environment setup"
            echo "  --skip-compile        Skip contract compilation"
            echo "  --skip-deploy         Skip contract deployment"
            echo "  --skip-tests          Skip all tests"
            echo "  --skip-cleanup        Skip cleanup"
            echo "  --verbose             Show detailed output"
            echo "  --continue-on-error   Continue even if phases fail"
            echo "  --help                Show this help message"
            echo
            echo "Environment Variables:"
            echo "  RUN_ALL=true          Run all phases (default)"
            echo "  SKIP_SETUP=false      Skip setup phase"
            echo "  SKIP_COMPILE=false    Skip compile phase"
            echo "  SKIP_DEPLOY=false     Skip deploy phase"
            echo "  SKIP_TESTS=false      Skip test phases"
            echo "  SKIP_CLEANUP=false    Skip cleanup phase"
            echo "  VERBOSE=false         Verbose output"
            echo "  CONTINUE_ON_ERROR=false Continue on phase failure"
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            log_info "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Run main function
main "$@"
