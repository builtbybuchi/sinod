#!/bin/bash
# Proper startup script for Python backend

echo "🚀 Starting Lyperos Python Backend..."
echo ""

# Navigate to backend directory
cd "$(dirname "$0")"

# Check if venv exists
if [ ! -d "venv" ]; then
    echo "❌ Virtual environment not found!"
    echo "Run ./setup.sh first to set up the environment"
    exit 1
fi

# Activate virtual environment
echo "📦 Activating virtual environment..."
source venv/bin/activate

# Check if dependencies are installed
if ! python -c "import fastapi" 2>/dev/null; then
    echo "⚠️  Dependencies not installed. Installing..."
    pip install -r requirements.txt
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found!"
    echo "Copy .env.example to .env and configure your API keys"
    exit 1
fi

# Start the server
echo "✅ Starting server on port 8001..."
echo "📚 API Docs will be available at: http://localhost:8001/docs"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

uvicorn main:app --reload --port 8001
