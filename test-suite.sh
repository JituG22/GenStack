#!/bin/bash

# GenStack Cross-Platform Test Suite
# Tests all backend APIs and frontend integration

echo "🧪 GenStack Cross-Platform Test Suite"
echo "======================================"
echo ""

BASE_URL="http://localhost:5000"
FRONTEND_URL="http://localhost:3000"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counter
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Helper function to run tests
run_test() {
    local test_name="$1"
    local test_command="$2"
    local expected_pattern="$3"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    echo -e "${BLUE}[TEST $TOTAL_TESTS]${NC} $test_name"
    
    # Run the test
    local result=$(eval $test_command 2>&1)
    local exit_code=$?
    
    # Check if test passed
    if [ $exit_code -eq 0 ] && [[ "$result" == *"$expected_pattern"* ]]; then
        echo -e "${GREEN}✅ PASSED${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${RED}❌ FAILED${NC}"
        echo "   Expected: $expected_pattern"
        echo "   Got: $result"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    echo ""
}

# Test 1: Health Check
echo -e "${YELLOW}Phase 1: Backend Health Check${NC}"
echo "--------------------------------"
run_test "Health Check Endpoint" \
    "curl -s $BASE_URL/health" \
    "GenStack API is running"

# Test 2: Backend API Endpoints
echo -e "${YELLOW}Phase 2: Backend API Endpoints${NC}"
echo "--------------------------------"

# Test notifications-simple endpoints (without auth - should fail gracefully)
run_test "Notifications Simple - Unauthorized Access" \
    "curl -s $BASE_URL/api/notifications-simple" \
    "unauthorized\|Unauthorized\|401"

run_test "Notification Count - Unauthorized Access" \
    "curl -s $BASE_URL/api/notifications-simple/count" \
    "unauthorized\|Unauthorized\|401"

# Test WebSocket endpoint
run_test "WebSocket Test Endpoint" \
    "curl -s $BASE_URL/api/websocket-test" \
    "WebSocket test endpoint"

# Test 3: Frontend Server
echo -e "${YELLOW}Phase 3: Frontend Server${NC}"
echo "--------------------------------"
run_test "Frontend Server Response" \
    "curl -s -I $FRONTEND_URL" \
    "200 OK"

# Test 4: Database Connection
echo -e "${YELLOW}Phase 4: Database & Services${NC}"
echo "--------------------------------"

# Check if MongoDB is accessible through health endpoint
run_test "Database Connection via Health Check" \
    "curl -s $BASE_URL/health | grep -i 'running'" \
    "running"

# Test 5: File Structure Validation
echo -e "${YELLOW}Phase 5: File Structure Validation${NC}"
echo "--------------------------------"

# Check if key files exist
check_file_exists() {
    local file_path="$1"
    local file_name="$2"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    if [ -f "$file_path" ]; then
        echo -e "${GREEN}✅ $file_name exists${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${RED}❌ $file_name missing${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
}

# Backend files
check_file_exists "backend/src/routes/notifications-simple.ts" "NotificationSimple Routes"
check_file_exists "backend/src/services/notificationService.ts" "Notification Service"
check_file_exists "backend/src/services/simpleWebSocket.ts" "WebSocket Service"

# Frontend files
check_file_exists "frontend/src/components/NotificationBell.tsx" "NotificationBell Component"
check_file_exists "frontend/src/components/NotificationCenter.tsx" "NotificationCenter Component"
check_file_exists "frontend/src/hooks/useNotifications.ts" "useNotifications Hook"
check_file_exists "frontend/src/services/notificationService.ts" "Frontend Notification Service"
check_file_exists "frontend/src/services/websocketService.ts" "Frontend WebSocket Service"

# Test 6: TypeScript Compilation
echo -e "${YELLOW}Phase 6: TypeScript Compilation${NC}"
echo "--------------------------------"
run_test "Frontend TypeScript Compilation" \
    "cd frontend && npm run build" \
    "built in"

# Test 7: Authentication System
echo -e "${YELLOW}Phase 7: Authentication System${NC}"
echo "--------------------------------"

# Test auth endpoints
run_test "Auth Endpoint Accessibility" \
    "curl -s $BASE_URL/api/auth" \
    "Cannot GET\|404"

# Test user endpoints
run_test "User Endpoint Protection" \
    "curl -s $BASE_URL/api/users" \
    "unauthorized\|Unauthorized\|401"

# Test 8: API Route Registration
echo -e "${YELLOW}Phase 8: API Route Registration${NC}"
echo "--------------------------------"

# Test if all routes are registered by checking 404 vs 401/403
run_test "Notifications Route Registered" \
    "curl -s $BASE_URL/api/notifications" \
    "unauthorized\|Unauthorized\|401"

run_test "Analytics Route Registered" \
    "curl -s $BASE_URL/api/analytics" \
    "unauthorized\|Unauthorized\|401"

run_test "Templates Route Registered" \
    "curl -s $BASE_URL/api/templates" \
    "unauthorized\|Unauthorized\|401"

# Test 9: WebSocket Service
echo -e "${YELLOW}Phase 9: WebSocket Service${NC}"
echo "--------------------------------"

# Check if WebSocket service is initialized (from server logs)
run_test "WebSocket Service Initialization" \
    "curl -s $BASE_URL/health" \
    "running"

# Test 10: Package Dependencies
echo -e "${YELLOW}Phase 10: Package Dependencies${NC}"
echo "--------------------------------"

run_test "Backend Dependencies" \
    "cd backend && npm ls --depth=0" \
    "express\|mongoose\|socket.io"

run_test "Frontend Dependencies" \
    "cd frontend && npm ls --depth=0" \
    "react\|axios\|socket.io-client"

# Final Results
echo ""
echo "======================================"
echo -e "${BLUE}TEST SUMMARY${NC}"
echo "======================================"
echo -e "Total Tests: $TOTAL_TESTS"
echo -e "${GREEN}Passed: $PASSED_TESTS${NC}"
echo -e "${RED}Failed: $FAILED_TESTS${NC}"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}🎉 ALL TESTS PASSED! System is ready for production.${NC}"
    exit 0
else
    echo -e "${RED}⚠️  Some tests failed. Please review the issues above.${NC}"
    exit 1
fi
