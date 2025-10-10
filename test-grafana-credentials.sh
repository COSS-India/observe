#!/bin/bash

echo "=== Grafana Credentials Test ==="
echo "Container: dhruva-platform-grafana"
echo "Admin Username: admin"
echo "Admin Password: password"
echo ""

echo "Testing basic health endpoint..."
curl -s http://localhost:3000/api/health | jq .

echo ""
echo "Testing basic auth with admin credentials..."
curl -s -u admin:password http://localhost:3000/api/user | jq .

echo ""
echo "Testing API key from .env.local..."
API_KEY=$(grep GRAFANA_API_KEY .env.local | cut -d'=' -f2)
curl -s -H "Authorization: Bearer $API_KEY" http://localhost:3000/api/user | jq .

echo ""
echo "Testing web login..."
LOGIN_RESPONSE=$(curl -s -X POST -H "Content-Type: application/json" -d '{"user":"admin","password":"password"}' http://localhost:3000/login)
echo $LOGIN_RESPONSE | jq .

echo ""
echo "=== All tests completed ==="
