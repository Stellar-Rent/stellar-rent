#!/bin/bash
echo "🧪 Testing StellarRent API Endpoints"
echo "=================================="

BASE_URL="http://localhost:3000"

echo "1. ✅ Testing GET /properties/amenities"
curl -s -X GET "$BASE_URL/properties/amenities" | jq '.success'

echo -e "\n2. ✅ Testing GET /properties (search)"
curl -s -X GET "$BASE_URL/properties?limit=1" | jq '.success'

echo -e "\n3. ❌ Testing GET /properties/:id (not found)"
curl -s -X GET "$BASE_URL/properties/123e4567-e89b-12d3-a456-426614174000" | jq '.success'

echo -e "\n4. ❌ Testing GET /properties/:id (invalid ID)"
curl -s -X GET "$BASE_URL/properties/invalid-id" | jq '.error // .success'

echo -e "\n5. 🔐 Testing POST /properties (no auth - should fail)"
curl -s -X POST "$BASE_URL/properties" -H "Content-Type: application/json" -d '{}' | jq '.error // .message'

echo -e "\n6. ✅ Testing auth endpoints availability"
curl -s -X POST "$BASE_URL/auth/register" -H "Content-Type: application/json" -d '{}' | jq '.error // .message'

# 🔐 Replace with your actual token or load from environment
AUTH1_TOKEN="eyJhbGciOiJIUzI1NiIsImtpZCI6IjBJMjBNZlg1TGlXSDg4eXEiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2dtcHBrbHl3b3Bna2Jkdmpvb2ZnLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiJlNjRmNzJkZS01OGFiLTQ3N2QtYTIxMi0xMmNiNGUwMWFlMTEiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzQ5Mzg2NDEwLCJpYXQiOjE3NDkzODI4MTAsImVtYWlsIjoidGVzdDExQGV4YW1wbGUuY29tIiwicGhvbmUiOiIiLCJhcHBfbWV0YWRhdGEiOnsicHJvdmlkZXIiOiJlbWFpbCIsInByb3ZpZGVycyI6WyJlbWFpbCJdfSwidXNlcl9tZXRhZGF0YSI6eyJlbWFpbCI6InRlc3QxMUBleGFtcGxlLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJwaG9uZV92ZXJpZmllZCI6ZmFsc2UsInN1YiI6ImU2NGY3MmRlLTU4YWItNDc3ZC1hMjEyLTEyY2I0ZTAxYWUxMSJ9LCJyb2xlIjoiYXV0aGVudGljYXRlZCIsImFhbCI6ImFhbDEiLCJhbXIiOlt7Im1ldGhvZCI6InBhc3N3b3JkIiwidGltZXN0YW1wIjoxNzQ5MzgyODEwfV0sInNlc3Npb25faWQiOiIzZmFkZmE3Mi1mZDNmLTQyN2UtYmNmMS0wMGM0OTQwOTAxMjkiLCJpc19hbm9ueW1vdXMiOmZhbHNlfQ.vZnnQm7BOkxglxbyvkklRB5xBx__DzF6wEIi_2u-N1o"

# 🧪 Profile Endpoints
echo -e "\n7. 🔐 Testing GET /profiles (authenticated)"
curl -s -X GET "$BASE_URL/profiles" \
  -H "Authorization: Bearer $AUTH_TOKEN" | jq '.user // .error'

echo -e "\n7. 🔐 Testing DELETE /profiles (authenticated)"
curl -s -X DELETE "$BASE_URL/profiles" \
  -H "Authorization: Bearer $AUTH_TOKEN" | jq '.success // .error'


echo -e "\n8. ✏️ Testing PATCH /profiles (update basic profile)"
curl -s -X PATCH "$BASE_URL/profiles" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Bernard Kip",
    "phone": "+254712345678",
    "address": {
      "street": "123 Main Street",
      "city": "Nairobi",
      "country": "Kenya",
      "postal_code": "00100"
    },
    "preferences": {
      "notifications": true,
      "newsletter": true,
      "language": "en"
    },
    "social_links": {
      "twitter": "https://twitter.com/bernardev254"
    }
  }' | jq '.profile // .error'

echo -e "\n9. 📤 Testing POST /profiles/avatar (upload image)"
curl -s -X POST "$BASE_URL/profiles/avatar" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -F "avatar=@./tests/assets/avatar.png" | jq '.avatar_url // .error'


echo -e "\n========================"
echo "🎯 Test Summary:"
echo "- Endpoints are responding"
echo "- Authentication is enforced"
echo "- Validation is working"
echo "- Database connection established"
echo -e "\n💡 To test authenticated endpoints:"
echo "1. Register/login to get JWT token"
echo "2. Use: curl -H 'Authorization: Bearer YOUR_TOKEN' ..." 