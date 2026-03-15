#!/bin/bash

# OpenClaw Dashboard - Production Build Script
# This script builds both frontend and backend for production

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "🏗️  Building OpenClaw Dashboard for Production"
echo "==============================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo ""

# Build backend
echo "📦 Building backend..."
cd "$PROJECT_ROOT/backend"
npm run build
echo "   ✅ Backend build complete: dist/"
echo ""

# Build frontend
echo "📦 Building frontend..."
cd "$PROJECT_ROOT/frontend"
npm run build
echo "   ✅ Frontend build complete: dist/"
echo ""

# Create production distribution
DIST_DIR="$PROJECT_ROOT/dist"
echo "📁 Creating production distribution..."

# Clean previous build
rm -rf "$DIST_DIR"
mkdir -p "$DIST_DIR"

# Copy backend
cp -r "$PROJECT_ROOT/backend/dist" "$DIST_DIR/backend"
cp "$PROJECT_ROOT/backend/package.json" "$DIST_DIR/backend/"
cp -r "$PROJECT_ROOT/backend/node_modules" "$DIST_DIR/backend/" 2>/dev/null || true

# Copy frontend build to backend public folder
mkdir -p "$DIST_DIR/backend/public"
cp -r "$PROJECT_ROOT/frontend/dist/"* "$DIST_DIR/backend/public/"

echo "   ✅ Production distribution created: dist/"
echo ""

echo "🎉 Build complete!"
echo ""
echo "To run production server:"
echo "  cd dist/backend"
echo "  npm start"
echo ""
echo "Server will be available at: http://localhost:3000"
