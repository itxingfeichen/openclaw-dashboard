# OpenClaw Dashboard Makefile
# Common development and deployment tasks

.PHONY: help install dev build lint format test clean

# Default target
help:
	@echo "OpenClaw Dashboard - Available Commands"
	@echo "========================================"
	@echo "  make install    - Install all dependencies"
	@echo "  make dev        - Start development servers (frontend + backend)"
	@echo "  make dev-fe     - Start frontend dev server only"
	@echo "  make dev-be     - Start backend dev server only"
	@echo "  make build      - Build both frontend and backend"
	@echo "  make lint       - Run linters on all code"
	@echo "  make format     - Format all code with Prettier"
	@echo "  make test       - Run tests"
	@echo "  make clean      - Remove build artifacts and node_modules"

# Install all dependencies
install:
	@echo "Installing root dependencies..."
	npm install
	@echo "Installing frontend dependencies..."
	npm install --prefix frontend
	@echo "Installing backend dependencies..."
	npm install --prefix backend
	@echo "Installation complete!"

# Start development servers
dev:
	npm run dev

# Start frontend dev server only
dev-fe:
	npm run dev:frontend

# Start backend dev server only
dev-be:
	npm run dev:backend

# Build both projects
build:
	npm run build

# Run linters
lint:
	npm run lint

# Format code
format:
	npm run format

# Run tests
test:
	npm run test

# Clean build artifacts
clean:
	@echo "Cleaning build artifacts..."
	rm -rf node_modules
	rm -rf frontend/node_modules frontend/dist frontend/build
	rm -rf backend/node_modules backend/dist
	rm -rf coverage
	rm -f data/*.db
	@echo "Clean complete!"
