#!/bin/bash

# Stop AI4Voice Backend Services

echo "🛑 Stopping AI4Voice Backend Services..."
echo "=========================================="

# Stop PostgreSQL container
if docker ps --format '{{.Names}}' | grep -q "^ai4voice_postgres$"; then
    echo "🐘 Stopping PostgreSQL container..."
    docker stop ai4voice_postgres
    echo "✅ PostgreSQL container stopped!"
else
    echo "ℹ️  PostgreSQL container is not running."
fi

echo ""
echo "✅ All services stopped!"
echo ""
echo "To remove the container and data volume:"
echo "  docker-compose down -v"
