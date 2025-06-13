#!/bin/bash

# StellarRent Backend Docker Configuration Validation Script
# This script validates Docker configuration files without requiring Docker to be installed

set -e

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

# Test 1: Check if required files exist
test_files_exist() {
    log_info "Checking if required Docker files exist..."
    
    required_files=(
        "Dockerfile"
        "docker-compose.yml"
        "docker-compose.prod.yml"
        ".dockerignore"
        ".env.example"
        "redis.conf"
    )
    
    for file in "${required_files[@]}"; do
        if [ ! -f "$file" ]; then
            log_error "Required file $file not found"
            exit 1
        fi
    done
    
    log_success "All required Docker files exist"
}

# Test 2: Validate Dockerfile syntax
test_dockerfile_syntax() {
    log_info "Validating Dockerfile syntax..."
    
    # Check for required Dockerfile instructions
    required_instructions=("FROM" "WORKDIR" "COPY" "RUN" "EXPOSE" "CMD")
    
    for instruction in "${required_instructions[@]}"; do
        if ! grep -q "^$instruction" Dockerfile; then
            log_error "Dockerfile missing required instruction: $instruction"
            exit 1
        fi
    done
    
    # Check for multi-stage build
    if ! grep -q "AS base" Dockerfile; then
        log_warning "Dockerfile doesn't appear to use multi-stage build"
    fi
    
    # Check for security best practices
    if ! grep -q "USER" Dockerfile; then
        log_warning "Dockerfile doesn't specify a non-root user"
    fi
    
    log_success "Dockerfile syntax appears valid"
}

# Test 3: Validate docker-compose.yml syntax
test_compose_syntax() {
    log_info "Validating docker-compose.yml syntax..."
    
    # Check for required sections
    required_sections=("version" "services" "networks" "volumes")
    
    for section in "${required_sections[@]}"; do
        if ! grep -q "^$section:" docker-compose.yml; then
            log_error "docker-compose.yml missing required section: $section"
            exit 1
        fi
    done
    
    # Check for backend service
    if ! grep -q "backend:" docker-compose.yml; then
        log_error "docker-compose.yml missing backend service"
        exit 1
    fi
    
    log_success "docker-compose.yml syntax appears valid"
}

# Test 4: Validate production compose file
test_prod_compose_syntax() {
    log_info "Validating docker-compose.prod.yml syntax..."
    
    # Check for required sections
    if ! grep -q "backend:" docker-compose.prod.yml; then
        log_error "docker-compose.prod.yml missing backend service"
        exit 1
    fi
    
    # Check for production optimizations
    if ! grep -q "resources:" docker-compose.prod.yml; then
        log_warning "Production compose file doesn't specify resource limits"
    fi
    
    if ! grep -q "security_opt:" docker-compose.prod.yml; then
        log_warning "Production compose file doesn't specify security options"
    fi
    
    log_success "docker-compose.prod.yml syntax appears valid"
}

# Test 5: Validate .env.example
test_env_example() {
    log_info "Validating .env.example file..."
    
    required_vars=(
        "PORT"
        "SUPABASE_URL"
        "SUPABASE_ANON_KEY"
        "SUPABASE_SERVICE_ROLE_KEY"
        "JWT_SECRET"
        "STELLAR_NETWORK"
    )
    
    for var in "${required_vars[@]}"; do
        if ! grep -q "^$var=" .env.example; then
            log_error "Required environment variable $var not found in .env.example"
            exit 1
        fi
    done
    
    log_success ".env.example file is valid"
}

# Test 6: Validate package.json Docker scripts
test_package_scripts() {
    log_info "Validating package.json Docker scripts..."
    
    required_scripts=(
        "docker:build"
        "docker:dev"
        "docker:prod"
        "docker:stop"
    )
    
    for script in "${required_scripts[@]}"; do
        if ! grep -q "\"$script\":" package.json; then
            log_error "Required npm script $script not found in package.json"
            exit 1
        fi
    done
    
    log_success "package.json Docker scripts are valid"
}

# Test 7: Check .dockerignore
test_dockerignore() {
    log_info "Validating .dockerignore file..."
    
    important_ignores=("node_modules" ".env" ".git" "dist")
    
    for ignore in "${important_ignores[@]}"; do
        if ! grep -q "$ignore" .dockerignore; then
            log_warning ".dockerignore missing important entry: $ignore"
        fi
    done
    
    log_success ".dockerignore file appears valid"
}

# Test 8: Validate Redis configuration
test_redis_config() {
    log_info "Validating Redis configuration..."
    
    if [ ! -f "redis.conf" ]; then
        log_warning "Redis configuration file not found"
        return
    fi
    
    # Check for basic Redis configuration
    if ! grep -q "bind" redis.conf; then
        log_warning "Redis config missing bind directive"
    fi
    
    if ! grep -q "port" redis.conf; then
        log_warning "Redis config missing port directive"
    fi
    
    log_success "Redis configuration appears valid"
}

# Main test execution
main() {
    echo "=========================================="
    echo "StellarRent Backend Docker Validation"
    echo "=========================================="
    
    test_files_exist
    test_dockerfile_syntax
    test_compose_syntax
    test_prod_compose_syntax
    test_env_example
    test_package_scripts
    test_dockerignore
    test_redis_config
    
    echo "=========================================="
    log_success "All Docker configuration validations passed! 🎉"
    echo "=========================================="
    
    log_info "Next steps:"
    echo "1. Install Docker and Docker Compose"
    echo "2. Copy .env.example to .env and configure"
    echo "3. Run 'bun run docker:dev' to start development"
    echo "4. Run './tests/docker.test.sh' for full testing"
}

# Run main function
main "$@"
