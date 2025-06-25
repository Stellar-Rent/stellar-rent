#!/bin/bash

echo "🧪 Testing Basic Endpoints"
echo "=========================="

BASE_URL="http://localhost:3000"

# Test health endpoint
echo "1. Testing Health Endpoint..."
curl -s "$BASE_URL/health" | jq .
echo

# Test root endpoint  
echo "2. Testing Root Endpoint..."
curl -s "$BASE_URL/" | jq .
echo

# Test if API routes are accessible
echo "3. Testing API Routes..."
curl -s "$BASE_URL/api" | jq .
echo

echo "✅ Basic endpoint testing complete!" 