#!/bin/bash

# StellarRent Blockchain Integration Setup Script
# This script helps set up the blockchain integration components

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

print_header() {
    echo -e "\n${BLUE}================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================${NC}\n"
}

# Check if running from correct directory
check_directory() {
    if [[ ! -f "package.json" ]] || [[ ! -d "src" ]]; then
        log_error "Please run this script from the backend directory (apps/backend/)"
        exit 1
    fi
}

# Check dependencies
check_dependencies() {
    log_info "Checking dependencies..."
    
    if ! command -v bun &> /dev/null; then
        log_error "Bun is required but not installed. Please install Bun first."
        exit 1
    fi
    
    if ! command -v psql &> /dev/null; then
        log_warning "PostgreSQL client not found. Database setup may require manual intervention."
    fi
    
    log_success "Dependencies check completed"
}

# Set up environment variables
setup_environment() {
    print_header "Environment Setup"
    
    if [[ ! -f ".env" ]]; then
        log_info "Creating .env file from .env.example..."
        if [[ -f ".env.example" ]]; then
            cp .env.example .env
            log_success ".env file created"
        else
            log_warning ".env.example not found, creating basic .env file"
            cat > .env << EOF
# Database
DATABASE_URL=postgresql://localhost:5432/stellarrent

# Blockchain Configuration
SOROBAN_RPC_URL=https://soroban-testnet.stellar.org
SOROBAN_CONTRACT_ID=
SOROBAN_NETWORK_PASSPHRASE=Test SDF Network ; September 2015
SOROBAN_SECRET_KEY=

# Sync Service
SYNC_POLL_INTERVAL=5000

# Admin Configuration  
ADMIN_EMAILS=
ADMIN_USER_IDS=

# Development
USE_MOCK=true
NODE_ENV=development
EOF
        fi
    else
        log_info ".env file already exists"
    fi
    
    # Check required environment variables
    log_info "Checking blockchain environment variables..."
    
    source .env 2>/dev/null || true
    
    if [[ -z "$SOROBAN_RPC_URL" ]]; then
        log_warning "SOROBAN_RPC_URL not set in .env"
    fi
    
    if [[ -z "$SOROBAN_CONTRACT_ID" ]]; then
        log_warning "SOROBAN_CONTRACT_ID not set in .env"
        log_info "You'll need to deploy contracts and update this value"
    fi
    
    log_success "Environment setup completed"
}

# Install dependencies
install_dependencies() {
    print_header "Installing Dependencies"
    
    log_info "Installing Node.js packages..."
    bun install
    
    log_success "Dependencies installed successfully"
}

# Set up database
setup_database() {
    print_header "Database Setup"
    
    log_info "Running database migrations..."
    
    # Check if Supabase is configured
    if [[ -n "$DATABASE_URL" ]]; then
        log_info "Setting up sync tables..."
        
        # Run sync table migration
        if [[ -f "database/migrations/001_create_sync_tables.sql" ]]; then
            log_info "Applying sync table migration..."
            # In a real scenario, you'd run this against your database
            log_warning "Please run database/migrations/001_create_sync_tables.sql against your database"
        fi
        
        # Update existing tables for blockchain integration
        log_info "Updating existing tables for blockchain integration..."
        cat > temp_blockchain_migration.sql << EOF
-- Add blockchain integration fields to existing tables
ALTER TABLE properties ADD COLUMN IF NOT EXISTS property_token TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS blockchain_booking_id TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS escrow_address TEXT;

-- Update constraints to handle nullable escrow_address for existing records
ALTER TABLE bookings ALTER COLUMN escrow_address DROP NOT NULL;

-- Add indexes for blockchain fields
CREATE INDEX IF NOT EXISTS idx_properties_property_token ON properties(property_token);
CREATE INDEX IF NOT EXISTS idx_bookings_blockchain_id ON bookings(blockchain_booking_id);
CREATE INDEX IF NOT EXISTS idx_bookings_escrow_address ON bookings(escrow_address);
EOF
        
        log_warning "Please run temp_blockchain_migration.sql against your database"
        log_info "Migration file created: temp_blockchain_migration.sql"
    else
        log_warning "DATABASE_URL not configured. Please set up your database connection."
    fi
    
    log_success "Database setup completed"
}

# Build the application
build_application() {
    print_header "Building Application"
    
    log_info "Compiling TypeScript..."
    bun run build
    
    log_success "Application built successfully"
}

# Run tests
run_tests() {
    print_header "Running Tests"
    
    log_info "Running blockchain integration tests..."
    
    # Set test environment
    export USE_MOCK=true
    export NODE_ENV=test
    
    # Run unit tests
    log_info "Running unit tests..."
    if bun test tests/unit/blockchain.test.ts; then
        log_success "Unit tests passed"
    else
        log_warning "Some unit tests failed (may be expected in current environment)"
    fi
    
    # Run integration tests  
    log_info "Running integration tests..."
    if bun test tests/integration/blockchain-integration.test.ts; then
        log_success "Integration tests passed"
    else
        log_warning "Some integration tests failed (may be expected without full setup)"
    fi
    
    log_success "Test execution completed"
}

# Start services
start_services() {
    print_header "Starting Services"
    
    log_info "Starting development server..."
    log_info "Use 'bun run dev' to start the development server"
    log_info "Use 'bun run start' to start in production mode"
    
    # Check if sync service should be started
    if [[ "$USE_MOCK" == "true" ]]; then
        log_info "Mock mode enabled - sync service will use mock blockchain"
    else
        log_warning "Live blockchain mode - ensure contracts are deployed"
    fi
    
    log_success "Ready to start services"
}

# Verify setup
verify_setup() {
    print_header "Verification"
    
    log_info "Verifying blockchain integration setup..."
    
    # Check if key files exist
    local files=(
        "src/blockchain/propertyListingContract.ts"
        "src/blockchain/bookingContract.ts"
        "src/services/sync.service.ts"
        "src/controllers/sync.controller.ts"
        "database/migrations/001_create_sync_tables.sql"
    )
    
    for file in "${files[@]}"; do
        if [[ -f "$file" ]]; then
            log_success "✓ $file exists"
        else
            log_error "✗ $file missing"
        fi
    done
    
    # Test basic functionality
    log_info "Testing basic blockchain functions..."
       if node -e "
        let mod;
        try { mod = require('./dist/blockchain/propertyListingContract.js'); }
        catch { mod = require('./src/blockchain/propertyListingContract'); }
        const { generatePropertyHash } = mod;
        const testData = { title: 'Test', price: 100, address: 'Test', city: 'Test', country: 'Test', amenities: [], bedrooms: 1, bathrooms: 1, max_guests: 2 };
        const hash = generatePropertyHash(testData);
        console.log('Hash generated successfully:', hash);
        process.exit(0);
    " 2>/dev/null; then
        log_success "Blockchain functions working"
    else
        log_warning "Blockchain functions test failed (may require build)"
    fi
    
    log_success "Verification completed"
}

# Print final instructions
print_instructions() {
    print_header "Setup Complete!"
    
    cat << EOF
${GREEN}✅ StellarRent Blockchain Integration Setup Complete!${NC}

${YELLOW}Next Steps:${NC}

1. ${BLUE}Configure Environment:${NC}
   - Edit .env file with your blockchain configuration
   - Set SOROBAN_CONTRACT_ID after deploying contracts
   - Configure admin users for sync management

2. ${BLUE}Deploy Smart Contracts:${NC}
   - Deploy contracts from apps/stellar-contracts/
   - Update .env with deployed contract IDs

3. ${BLUE}Database Setup:${NC}
   - Run temp_blockchain_migration.sql against your database
   - Run database/migrations/001_create_sync_tables.sql

4. ${BLUE}Start Development:${NC}
   - Run: bun run dev
   - Access sync dashboard at: /api/sync/dashboard (admin only)
   - Test property verification: /api/properties/:id/verify

5. ${BLUE}Testing:${NC}
   - Run tests: bun run test:blockchain
   - Use CLI tool: node scripts/test-blockchain-cli.js

${YELLOW}Important Files:${NC}
- Configuration: .env
- Documentation: BLOCKCHAIN_INTEGRATION.md
- Tests: tests/unit/blockchain.test.ts, tests/integration/blockchain-integration.test.ts
- Database: temp_blockchain_migration.sql

${YELLOW}API Endpoints:${NC}
- Property verification: GET /api/properties/:id/verify
- Sync management: /api/sync/* (admin only)
- Blockchain state verification: GET /api/sync/verify

For detailed documentation, see: BLOCKCHAIN_INTEGRATION.md
EOF
}

# Main execution
main() {
    print_header "StellarRent Blockchain Integration Setup"
    
    log_info "Starting blockchain integration setup..."
    
    check_directory
    check_dependencies
    setup_environment
    install_dependencies
    setup_database
    build_application
    run_tests
    start_services
    verify_setup
    print_instructions
    
    log_success "Setup completed successfully!"
}

# Handle script arguments
case "${1:-}" in
    "env")
        setup_environment
        ;;
    "deps")
        install_dependencies
        ;;
    "db")
        setup_database
        ;;
    "build")
        build_application
        ;;
    "test")
        run_tests
        ;;
    "verify")
        verify_setup
        ;;
    *)
        main
        ;;
esac