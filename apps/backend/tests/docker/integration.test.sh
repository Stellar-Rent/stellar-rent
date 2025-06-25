#!/bin/bash

# StellarRent Backend Docker Testing Script
# This script tests the Docker setup for the StellarRent backend

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test configuration
BACKEND_PORT=3000
CONTAINER_NAME="stellarrent-backend-test"
IMAGE_NAME="stellarrent-backend:test"
TIMEOUT=60

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

cleanup() {
    log_info "Cleaning up test containers and images..."
    docker stop $CONTAINER_NAME 2>/dev/null || true
    docker rm $CONTAINER_NAME 2>/dev/null || true
    docker rmi $IMAGE_NAME 2>/dev/null || true
    log_success "Cleanup completed"
}

# Trap to ensure cleanup on exit
trap cleanup EXIT

# Test 1: Check if Docker is installed and running
test_docker_availability() {
    log_info "Testing Docker availability..."

    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        exit 1
    fi

    if ! docker info &> /dev/null; then
        log_error "Docker daemon is not running"
        exit 1
    fi

    log_success "Docker is available and running"
}

# Test 2: Check if .env.example exists
test_env_example() {
    log_info "Testing .env.example file..."

    if [ ! -f ".env.example" ]; then
        log_error ".env.example file not found"
        exit 1
    fi

    # Check for required environment variables
    required_vars=("PORT" "SUPABASE_URL" "SUPABASE_ANON_KEY" "SUPABASE_SERVICE_ROLE_KEY" "JWT_SECRET")

    for var in "${required_vars[@]}"; do
        if ! grep -q "^$var=" .env.example; then
            log_error "Required environment variable $var not found in .env.example"
            exit 1
        fi
    done

    log_success ".env.example file is valid"
}

# Test 3: Build Docker image
test_docker_build() {
    log_info "Testing Docker image build..."

    if ! docker build -t $IMAGE_NAME .; then
        log_error "Docker image build failed"
        exit 1
    fi

    log_success "Docker image built successfully"
}

# Test 4: Test image size (should be reasonable)
test_image_size() {
    log_info "Testing Docker image size..."

    size=$(docker images $IMAGE_NAME --format "{{.Size}}" | head -1)
    log_info "Image size: $size"

    # Extract numeric value (assuming format like "123MB" or "1.2GB")
    numeric_size=$(echo $size | sed 's/[^0-9.]//g')
    unit=$(echo $size | sed 's/[0-9.]//g')

    # Convert to MB for comparison
    if [[ $unit == *"GB"* ]]; then
        size_mb=$(echo "$numeric_size * 1024" | bc -l 2>/dev/null || echo "1000")
    else
        size_mb=$numeric_size
    fi

    # Warn if image is larger than 500MB
    if (( $(echo "$size_mb > 500" | bc -l 2>/dev/null || echo "0") )); then
        log_warning "Docker image is quite large ($size). Consider optimizing."
    else
        log_success "Docker image size is reasonable ($size)"
    fi
}

# Test 5: Create test environment file
create_test_env() {
    log_info "Creating test environment file..."

    cat > .env.test << EOF
PORT=3000
NODE_ENV=test
SUPABASE_URL=https://test.supabase.co
SUPABASE_ANON_KEY=test_anon_key
SUPABASE_SERVICE_ROLE_KEY=test_service_role_key
JWT_SECRET=test_jwt_secret_for_docker_testing_only
CORS_ORIGIN=http://localhost:3001
STELLAR_NETWORK=testnet
EOF

    log_success "Test environment file created"
}

# Test 6: Run container and test connectivity
test_container_run() {
    log_info "Testing container startup and connectivity..."

    # Start container in detached mode
    if ! docker run -d --name $CONTAINER_NAME -p $BACKEND_PORT:3000 --env-file .env.test $IMAGE_NAME; then
        log_error "Failed to start container"
        exit 1
    fi

    log_info "Container started, waiting for service to be ready..."

    # Wait for service to be ready
    for i in $(seq 1 $TIMEOUT); do
        if curl -f http://localhost:$BACKEND_PORT/ &>/dev/null; then
            log_success "Backend service is responding"
            break
        fi

        if [ $i -eq $TIMEOUT ]; then
            log_error "Backend service failed to start within $TIMEOUT seconds"
            docker logs $CONTAINER_NAME
            exit 1
        fi

        sleep 1
    done
}

# Test 7: Test API endpoints
test_api_endpoints() {
    log_info "Testing API endpoints..."

    # Test root endpoint
    response=$(curl -s http://localhost:$BACKEND_PORT/)
    if [[ $response == *"Stellar Rent API is running successfully"* ]]; then
        log_success "Root endpoint is working"
    else
        log_error "Root endpoint test failed"
        echo "Response: $response"
        exit 1
    fi

    # Test health check (if implemented)
    if curl -f http://localhost:$BACKEND_PORT/health &>/dev/null; then
        log_success "Health endpoint is working"
    else
        log_warning "Health endpoint not available (this is optional)"
    fi
}

# Test 8: Test environment variables loading
test_environment_variables() {
    log_info "Testing environment variables loading..."

    # Check if container logs show environment variables are loaded
    logs=$(docker logs $CONTAINER_NAME 2>&1)

    if [[ $logs == *"Variables de entorno cargadas"* ]]; then
        log_success "Environment variables are being loaded correctly"
    else
        log_warning "Could not verify environment variables loading from logs"
    fi
}

# Test 9: Test that hot-reloading works in development mode with Docker Compose
test_hot_reloading() {
    log_info "Testing hot-reloading functionality..."

    # Check if development container is configured for hot-reloading
    if docker-compose config | grep -q "npm run dev"; then
        log_success "Hot-reloading is configured (npm run dev command found)"
    else
        log_warning "Hot-reloading configuration not found in docker-compose"
    fi

    # Check if volume mounts are configured for source code
    if docker-compose config | grep -q "\./:/app"; then
        log_success "Source code volume mount configured for hot-reloading"
    else
        log_warning "Source code volume mount not found"
    fi
}

# Test 10: Test container health
test_container_health() {
    log_info "Testing container health..."

    # Check if container is still running
    if docker ps | grep -q $CONTAINER_NAME; then
        log_success "Container is running healthy"
    else
        log_error "Container is not running"
        docker logs $CONTAINER_NAME
        exit 1
    fi

    # Check container stats
    stats=$(docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}" $CONTAINER_NAME)
    log_info "Container stats:"
    echo "$stats"
}

# Test 10: Test Docker Compose (if available)
test_docker_compose() {
    log_info "Testing Docker Compose availability..."

    if command -v docker-compose &> /dev/null; then
        log_info "Testing Docker Compose configuration..."

        # Validate docker-compose.yml
        if docker-compose config &>/dev/null; then
            log_success "Docker Compose configuration is valid"
        else
            log_error "Docker Compose configuration is invalid"
            exit 1
        fi
    else
        log_warning "Docker Compose not available, skipping compose tests"
    fi
}

# Main test execution
main() {
    echo "=========================================="
    echo "StellarRent Backend Docker Test Suite"
    echo "=========================================="

    test_docker_availability
    test_env_example
    test_docker_build
    test_image_size
    create_test_env
    test_container_run
    test_api_endpoints
    test_environment_variables
    test_hot_reloading
    test_container_health
    test_docker_compose

    echo "=========================================="
    log_success "All Docker tests passed successfully! 🎉"
    echo "=========================================="

    # Cleanup test environment file
    rm -f .env.test
}

# Run main function
main "$@"
