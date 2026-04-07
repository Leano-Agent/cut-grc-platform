#!/bin/bash

# Test Runner Script for CUT GRC Platform
# This script runs different types of tests with proper setup and teardown

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
TEST_DB_NAME="cut_grc_test"
TEST_DB_USER="postgres"
TEST_DB_PASSWORD="postgres"
TEST_DB_HOST="localhost"
TEST_DB_PORT="5432"

# Function to print colored messages
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if PostgreSQL is running
check_postgres() {
    print_info "Checking PostgreSQL connection..."
    if ! pg_isready -h $TEST_DB_HOST -p $TEST_DB_PORT -U $TEST_DB_USER > /dev/null 2>&1; then
        print_error "PostgreSQL is not running on $TEST_DB_HOST:$TEST_DB_PORT"
        print_info "Please start PostgreSQL and try again"
        exit 1
    fi
    print_success "PostgreSQL is running"
}

# Function to check if Redis is running
check_redis() {
    print_info "Checking Redis connection..."
    if ! redis-cli -h localhost ping > /dev/null 2>&1; then
        print_warning "Redis is not running on localhost:6379"
        print_info "Some tests may fail without Redis"
    else
        print_success "Redis is running"
    fi
}

# Function to create test database
create_test_database() {
    print_info "Creating test database '$TEST_DB_NAME'..."
    
    # Check if database exists
    if psql -h $TEST_DB_HOST -p $TEST_DB_PORT -U $TEST_DB_USER -lqt | cut -d \| -f 1 | grep -qw $TEST_DB_NAME; then
        print_info "Test database already exists"
    else
        # Create database
        if createdb -h $TEST_DB_HOST -p $TEST_DB_PORT -U $TEST_DB_USER $TEST_DB_NAME; then
            print_success "Test database created"
        else
            print_error "Failed to create test database"
            exit 1
        fi
    fi
}

# Function to run database migrations
run_migrations() {
    print_info "Running database migrations..."
    
    # Set environment variables for migrations
    export DB_HOST=$TEST_DB_HOST
    export DB_PORT=$TEST_DB_PORT
    export DB_NAME=$TEST_DB_NAME
    export DB_USER=$TEST_DB_USER
    export DB_PASSWORD=$TEST_DB_PASSWORD
    export NODE_ENV=test
    
    # Run migrations
    if npm run migrate:up; then
        print_success "Database migrations completed"
    else
        print_error "Database migrations failed"
        exit 1
    fi
}

# Function to seed test database
seed_database() {
    print_info "Seeding test database..."
    
    if npm run seed:dev; then
        print_success "Test database seeded"
    else
        print_error "Failed to seed test database"
        exit 1
    fi
}

# Function to run unit tests
run_unit_tests() {
    print_info "Running unit tests..."
    
    if npm test; then
        print_success "Unit tests passed"
    else
        print_error "Unit tests failed"
        exit 1
    fi
}

# Function to run integration tests
run_integration_tests() {
    print_info "Running integration tests..."
    
    if npm run test:integration; then
        print_success "Integration tests passed"
    else
        print_error "Integration tests failed"
        exit 1
    fi
}

# Function to run tests with coverage
run_coverage_tests() {
    print_info "Running tests with coverage..."
    
    if npm run test:coverage; then
        print_success "Coverage tests passed"
        
        # Check coverage thresholds
        COVERAGE_FILE="coverage/coverage-summary.json"
        if [ -f "$COVERAGE_FILE" ]; then
            print_info "Coverage summary:"
            cat coverage/coverage-summary.json | jq '.total'
        fi
    else
        print_error "Coverage tests failed"
        exit 1
    fi
}

# Function to run security tests
run_security_tests() {
    print_info "Running security tests..."
    
    # Check for vulnerable dependencies
    if command -v npm-audit &> /dev/null; then
        print_info "Running npm audit..."
        if npm audit; then
            print_success "No critical vulnerabilities found"
        else
            print_warning "Vulnerabilities found (check npm audit report)"
        fi
    else
        print_warning "npm audit not available"
    fi
    
    # Run security-focused tests
    print_info "Running security test suite..."
    # Add security-specific tests here
}

# Function to run performance tests
run_performance_tests() {
    print_info "Running performance tests..."
    
    # Check if artillery is installed
    if command -v artillery &> /dev/null; then
        print_info "Running load tests with Artillery..."
        artillery run tests/performance/load-test.yml
    else
        print_warning "Artillery not installed. Install with: npm install -g artillery"
    fi
}

# Function to run all tests
run_all_tests() {
    print_info "Starting comprehensive test suite..."
    
    check_postgres
    check_redis
    create_test_database
    run_migrations
    seed_database
    
    run_unit_tests
    run_integration_tests
    run_coverage_tests
    run_security_tests
    # run_performance_tests  # Commented out as it requires artillery
    
    print_success "All tests completed successfully!"
}

# Function to clean up test database
cleanup() {
    print_info "Cleaning up test database..."
    
    # Drop test database
    if dropdb -h $TEST_DB_HOST -p $TEST_DB_PORT -U $TEST_DB_USER --if-exists $TEST_DB_NAME; then
        print_success "Test database cleaned up"
    else
        print_error "Failed to clean up test database"
    fi
}

# Function to show help
show_help() {
    echo "CUT GRC Platform Test Runner"
    echo ""
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  all              Run all tests (unit, integration, coverage, security)"
    echo "  unit             Run unit tests only"
    echo "  integration      Run integration tests only"
    echo "  coverage         Run tests with coverage report"
    echo "  security         Run security tests"
    echo "  performance      Run performance tests"
    echo "  setup            Setup test environment (database, migrations, seeding)"
    echo "  cleanup          Clean up test database"
    echo "  help             Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 all           # Run all tests"
    echo "  $0 unit          # Run only unit tests"
    echo "  $0 setup         # Setup test environment"
}

# Main script logic
cd "$(dirname "$0")/.."

case "$1" in
    "all")
        run_all_tests
        ;;
    "unit")
        run_unit_tests
        ;;
    "integration")
        check_postgres
        check_redis
        create_test_database
        run_migrations
        seed_database
        run_integration_tests
        ;;
    "coverage")
        run_coverage_tests
        ;;
    "security")
        run_security_tests
        ;;
    "performance")
        run_performance_tests
        ;;
    "setup")
        check_postgres
        check_redis
        create_test_database
        run_migrations
        seed_database
        ;;
    "cleanup")
        cleanup
        ;;
    "help"|"")
        show_help
        ;;
    *)
        print_error "Unknown command: $1"
        show_help
        exit 1
        ;;
esac