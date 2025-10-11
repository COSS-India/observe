#!/bin/bash

# Adopter Login API Run Script

echo "Starting Adopter Login API..."
echo "================================"

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "Installing dependencies..."
pip install -r requirements.txt

# Check if database is initialized
echo "Checking database initialization..."
python init_db.py

# Start the server
echo "Starting FastAPI server..."
echo "API Documentation will be available at: http://localhost:8000/docs"
echo "Press Ctrl+C to stop the server"
echo "================================"

python3 -m uvicorn app.main:app --reload --host 0.0.0.0 --port 9010
