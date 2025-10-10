#!/bin/bash

echo "Testing Grafana Basic Authentication"
echo "===================================="

# Test basic auth login
echo "1. Testing basic auth with admin credentials..."
response=$(curl -s -u admin:password http://localhost:3000/api/user)
if echo "$response" | grep -q '"login":"admin"'; then
    echo "✅ Basic auth successful"
    echo "Admin user ID: $(echo "$response" | jq -r '.id')"
    echo "Admin email: $(echo "$response" | jq -r '.email')"
    echo "Is Grafana Admin: $(echo "$response" | jq -r '.isGrafanaAdmin')"
else
    echo "❌ Basic auth failed"
    echo "Response: $response"
fi

echo ""
echo "2. Testing invalid credentials..."
invalid_response=$(curl -s -u admin:wrongpassword http://localhost:3000/api/user)
if echo "$invalid_response" | grep -q "Unauthorized"; then
    echo "✅ Invalid credentials properly rejected"
else
    echo "❌ Invalid credentials test failed"
    echo "Response: $invalid_response"
fi

echo ""
echo "3. Testing admin endpoints access..."
users_response=$(curl -s -u admin:password http://localhost:3000/api/users)
if echo "$users_response" | grep -q '"isAdmin"'; then
    echo "✅ Admin endpoints accessible"
    user_count=$(echo "$users_response" | jq '. | length')
    echo "Total users in system: $user_count"
else
    echo "❌ Admin endpoints not accessible"
    echo "Response: $users_response"
fi