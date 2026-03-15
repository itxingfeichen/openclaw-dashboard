# OpenClaw Dashboard Makefile
# Common development and deployment tasks

.PHONY: help install dev build lint format test clean docker-build docker-run docker-dev docker-prod docker-logs

# Default target
help:
	@echo "OpenClaw Dashboard - Available Commands"
	@echo "========================================"
	@echo ""
	@echo "Development:"
	@echo "  make install    - Install all dependencies"
	@echo "  make dev        - Start development servers (frontend + backend)"
	@echo "  make dev-fe     - Start frontend dev server only"
	@echo "  make dev-be     - Start backend dev server only"
	@echo ""
	@echo "Build & Test:"
	@echo "  make build      - Build both frontend and backend"
	@echo "  make lint       - Run linters on all code (with auto-fix)"
	@echo "  make lint-check - Run linters on all code (check only)"
	@echo "  make format     - Format all code with Prettier"
	@echo "  make format-check - Check code formatting"
	@echo "  make test       - Run tests"
	@echo "  make test-cov   - Run tests with coverage"
	@echo ""
	@echo "Docker:"
	@echo "  make docker-build   - Build Docker image"
	@echo "  make docker-run     - Run Docker container"
	@echo "  make docker-dev     - Start development with Docker Compose"
	@echo "  make docker-prod    - Start production with Docker Compose"
	@echo "  make docker-logs    - View Docker logs"
	@echo "  make docker-down    - Stop Docker Compose services"
	@echo ""
	@echo "Cleanup:"
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

# Run linters with auto-fix
lint:
	npm run lint

# Run linters (check only)
lint-check:
	npm run lint:check

# Format code
format:
	npm run format

# Check code formatting
format-check:
	npm run format:check

# Run tests
test:
	npm run test

# Run tests with coverage
test-cov:
	npm run test:coverage

# Docker: Build image
docker-build:
	docker build -t openclaw-dashboard:latest .

# Docker: Run container
docker-run:
	docker run -p 3000:3000 -e JWT_SECRET=dev-secret openclaw-dashboard:latest

# Docker: Development with Compose
docker-dev:
	docker compose --profile dev up dev

# Docker: Production with Compose
docker-prod:
	docker compose up -d app

# Docker: View logs
docker-logs:
	docker compose logs -f app

# Docker: Stop services
docker-down:
	docker compose down

# Clean build artifacts
clean:
	@echo "Cleaning build artifacts..."
	rm -rf node_modules
	rm -rf frontend/node_modules frontend/dist frontend/build
	rm -rf backend/node_modules backend/dist
	rm -rf coverage
	rm -f data/*.db
	@echo "Clean complete!"

# Git hooks setup
hooks:
	npx husky install

# Database migrations
db-migrate:
	npm run db:migrate --prefix backend

db-rollback:
	npm run db:rollback --prefix backend

db-seed:
	npm run db:seed --prefix backend

db-reset:
	npm run db:reset --prefix backend
