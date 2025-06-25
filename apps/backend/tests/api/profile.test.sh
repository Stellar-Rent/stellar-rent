#!/bin/bash

# Test Profile CRUD Operations
# Make sure the backend is running on port 3001

echo "🧪 Testing Profile System CRUD Operations"
echo "========================================"

BASE_URL="http://localhost:3000/api"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to make requests and show results
test_endpoint() {
    local method=$1
    local endpoint=$2
    local data=$3
    local description=$4
    local token=$5
    
    echo -e "${YELLOW}Testing: $description${NC}"
    echo "Method: $method"
    echo "Endpoint: $BASE_URL$endpoint"
    
    if [ -n "$token" ]; then
        if [ -n "$data" ]; then
            response=$(curl -s -w "\n%{http_code}" -X $method \
                -H "Content-Type: application/json" \
                -H "Authorization: Bearer $token" \
                -d "$data" \
                "$BASE_URL$endpoint")
        else
            response=$(curl -s -w "\n%{http_code}" -X $method \
                -H "Authorization: Bearer $token" \
                "$BASE_URL$endpoint")
        fi
    else
        if [ -n "$data" ]; then
            response=$(curl -s -w "\n%{http_code}" -X $method \
                -H "Content-Type: application/json" \
                -d "$data" \
                "$BASE_URL$endpoint")
        else
            response=$(curl -s -w "\n%{http_code}" -X $method \
                "$BASE_URL$endpoint")
        fi
    fi
    
    # Split response body and status code
    http_code=$(echo "$response" | tail -n1)
    response_body=$(echo "$response" | sed '$d')
    
    echo "Status Code: $http_code"
    echo "Response: $response_body"
    
    if [[ $http_code -ge 200 && $http_code -lt 300 ]]; then
        echo -e "${GREEN}✅ SUCCESS${NC}"
    else
        echo -e "${RED}❌ FAILED${NC}"
    fi
    
    echo "----------------------------------------"
    echo
}

# 1. First, test registration to get a user token
echo "1. Registering a test user..."
register_data='{
    "email": "testprofile@example.com",
    "password": "password123",
    "name": "Test Profile User",
    "phone": "+1234567890",
    "address": {
        "street": "123 Test St",
        "city": "Test City",
        "country": "Test Country",
        "postal_code": "12345"
    },
    "preferences": {
        "notifications": true,
        "newsletter": false,
        "language": "es"
    },
    "social_links": {
        "facebook": "https://facebook.com/test",
        "twitter": "https://twitter.com/test"
    }
}'

test_endpoint "POST" "/auth/register" "$register_data" "Register new user"

# 2. Login to get token
echo "2. Logging in to get authentication token..."
login_data='{
    "email": "testprofile@example.com",
    "password": "password123"
}'

login_response=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d "$login_data" \
    "$BASE_URL/auth/login")

# Extract token from login response
TOKEN=$(echo "$login_response" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo -e "${RED}❌ Failed to get authentication token${NC}"
    echo "Login response: $login_response"
    exit 1
fi

echo -e "${GREEN}✅ Got authentication token${NC}"
echo "Token: ${TOKEN:0:20}..."
echo

# 3. Test GET Profile
echo "3. Testing GET Profile..."
test_endpoint "GET" "/profile" "" "Get user profile" "$TOKEN"

# 4. Test PATCH Profile (Update)
echo "4. Testing PATCH Profile (Update)..."
update_data='{
    "name": "Updated Profile User",
    "phone": "+9876543210",
    "address": {
        "street": "456 Updated Ave",
        "city": "New City",
        "country": "Updated Country",
        "postal_code": "54321"
    },
    "preferences": {
        "notifications": false,
        "newsletter": true,
        "language": "en"
    },
    "social_links": {
        "facebook": "https://facebook.com/updated",
        "twitter": "https://twitter.com/updated",
        "instagram": "https://instagram.com/updated"
    }
}'

test_endpoint "PATCH" "/profile" "$update_data" "Update user profile" "$TOKEN"

# 5. Test GET Profile again to verify update
echo "5. Testing GET Profile again to verify updates..."
test_endpoint "GET" "/profile" "" "Get updated user profile" "$TOKEN"

# 6. Test Avatar Upload (this will fail without actual file, but tests the endpoint)
echo "6. Testing POST Avatar Upload endpoint..."
echo -e "${YELLOW}Testing: Avatar upload endpoint (without file - expected to fail)${NC}"
curl_response=$(curl -s -w "\n%{http_code}" -X POST \
    -H "Authorization: Bearer $TOKEN" \
    "$BASE_URL/profile/avatar")

http_code=$(echo "$curl_response" | tail -n1)
response_body=$(echo "$curl_response" | sed '$d')

echo "Status Code: $http_code"
echo "Response: $response_body"
echo "Expected: Should return error about missing file"
echo "----------------------------------------"
echo

# 7. Test DELETE Profile (Account deactivation)
echo "7. Testing DELETE Profile (Account Deactivation)..."
echo -e "${YELLOW}⚠️  This will delete the test account${NC}"
read -p "Do you want to proceed with account deletion test? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    test_endpoint "DELETE" "/profile" "" "Delete user account" "$TOKEN"
    
    # 8. Try to access profile after deletion
    echo "8. Testing GET Profile after deletion (should fail)..."
    test_endpoint "GET" "/profile" "" "Get profile after deletion (should fail)" "$TOKEN"
else
    echo "Skipping account deletion test."
fi

echo
echo "🏁 Profile CRUD Testing Complete!"
echo "========================================" 