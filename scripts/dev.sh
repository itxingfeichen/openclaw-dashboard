#!/bin/bash

# OpenClaw Dashboard - Development Startup Script
# This script starts both frontend and backend in development mode

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "🚀 Starting OpenClaw Dashboard Development Environment"
echo "======================================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo "✅ npm version: $(npm --version)"
echo ""

# Install dependencies if needed
echo "📦 Checking dependencies..."

if [ ! -d "$PROJECT_ROOT/frontend/node_modules" ]; then
    echo "   Installing frontend dependencies..."
    cd "$PROJECT_ROOT/frontend" && npm install
fi

if [ ! -d "$PROJECT_ROOT/backend/node_modules" ]; then
    echo "   Installing backend dependencies..."
    cd "$PROJECT_ROOT/backend" && npm install
fi

echo ""
echo "🏗️  Starting services..."
echo ""
echo "   Backend:  http://localhost:3000"
echo "   Frontend: http://localhost:5173"
echo ""
echo "   Press Ctrl+C to stop all services"
echo ""

# Start backend in background
cd "$PROJECT_ROOT/backend"
npm run dev &
BACKEND_PID=$!

# Wait for backend to start
sleep 2

# Start frontend
cd "$PROJECT_ROOT/frontend"
npm run dev

# Cleanup on exit
trap "kill $BACKEND_PID 2>/dev/null || true" EXIT
