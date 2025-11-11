#!/bin/bash

# Start PostgreSQL Docker Container for AI4Voice Backend

echo "🐘 Starting PostgreSQL Docker Container..."
echo "=========================================="

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Error: Docker is not running. Please start Docker first."
    exit 1
fi

# Check if container already exists
if docker ps -a --format '{{.Names}}' | grep -q "^ai4voice_postgres$"; then
    echo "📦 Container 'ai4voice_postgres' already exists."

    # Check if it's running
    if docker ps --format '{{.Names}}' | grep -q "^ai4voice_postgres$"; then
        echo "✅ Container is already running!"
    else
        echo "🔄 Starting existing container..."
        docker start ai4voice_postgres
        echo "✅ Container started!"
    fi
else
    echo "🔄 Creating and starting new PostgreSQL container..."

    # Try docker compose (new syntax) first, then docker-compose (old syntax)
    if docker compose version > /dev/null 2>&1; then
        docker compose up -d
    elif docker-compose version > /dev/null 2>&1; then
        docker-compose up -d
    else
        # Run docker directly without compose
        docker run -d \
            --name ai4voice_postgres \
            --restart unless-stopped \
            -e POSTGRES_USER=postgres \
            -e POSTGRES_PASSWORD=postgres123 \
            -e POSTGRES_DB=AI4Voicedb \
            -e PGDATA=/var/lib/postgresql/data/pgdata \
            -p 5433:5432 \
            -v ai4voice_postgres_data:/var/lib/postgresql/data \
            postgres:15-alpine
    fi

    echo "✅ Container created and started!"
fi

# Wait for PostgreSQL to be ready
echo ""
echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 3

# Check connection
echo "🔍 Checking database connection..."
docker exec ai4voice_postgres pg_isready -U postgres

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ PostgreSQL is ready!"
    echo ""
    echo "📋 Database Information:"
    echo "   Host: localhost"
    echo "   Port: 5433"
    echo "   Database: AI4Voicedb"
    echo "   User: postgres"
    echo "   Password: postgres123"
    echo ""
    echo "🔗 Connection String:"
    echo "   postgresql://postgres:postgres123@localhost:5433/AI4Voicedb"
    echo ""
    echo "=========================================="
else
    echo ""
    echo "❌ Failed to connect to PostgreSQL. Please check Docker logs:"
    echo "   docker logs ai4voice_postgres"
    exit 1
fi

