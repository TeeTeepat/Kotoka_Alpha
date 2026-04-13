#!/bin/bash
# Kotoka Docker Startup Script

echo "🚀 Starting Kotoka with Docker..."
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found!"
    echo "Creating from .env.example..."
    cp .env.example .env
    echo ""
    echo "📝 Please edit .env with your API keys, then run this script again."
    echo ""
    echo "Required variables:"
    echo "  - AZURE_SPEECH_KEY"
    echo "  - GEMINI_API_KEY"
    echo "  - AUTH_SECRET"
    echo ""
    exit 1
fi

# Start Docker Compose
echo "✅ .env file found"
echo "🐳 Building and starting containers..."
echo ""

docker-compose up --build
