#!/bin/bash

# Complete Startup Script for AI4Voice Backend

echo "🚀 Starting AI4Voice Backend Setup"
echo "====================================="
echo ""

# Step 1: Start PostgreSQL
echo "📦 Step 1: Starting PostgreSQL Database..."
./start-db.sh

if [ $? -ne 0 ]; then
    echo "❌ Failed to start database. Exiting."
    exit 1
fi

echo ""
echo "====================================="
echo ""

# Step 2: Setup Python Environment
echo "🐍 Step 2: Setting up Python Environment..."

if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

echo "Activating virtual environment..."
source venv/bin/activate

echo "Installing dependencies..."
pip install -q -r requirements.txt

echo "✅ Python environment ready!"
echo ""
echo "====================================="
echo ""

# Step 3: Initialize Database
echo "🗄️  Step 3: Initializing Database..."
echo "Running migrations to create tables..."

python3 migrate_teams.py

if [ $? -ne 0 ]; then
    echo "⚠️  Migration script failed (this is expected if DB was not running before)"
    echo "Tables will be created automatically when the server starts."
fi

echo ""
echo "====================================="
echo ""

# Step 4: Start FastAPI Server
echo "🚀 Step 4: Starting FastAPI Backend..."
echo ""
echo "📋 Server Information:"
echo "   API URL: http://localhost:9010"
echo "   Docs: http://localhost:9010/docs"
echo "   ReDoc: http://localhost:9010/redoc"
echo ""
echo "Press Ctrl+C to stop the server"
echo "====================================="
echo ""

python3 -m uvicorn app.main:app --reload --host 0.0.0.0 --port 9010
