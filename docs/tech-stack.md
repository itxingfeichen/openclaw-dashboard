# Technology Stack

This document describes the technology choices for OpenClaw Dashboard.

## Frontend Stack

### Core Framework

**React 19**
- Latest stable version of React
- Functional components with hooks
- Concurrent rendering for better performance

**TypeScript**
- Type safety throughout the codebase
- Better IDE support and refactoring
- Catches errors at compile time

**Vite**
- Fast development server with HMR
- Optimized production builds
- Native ES modules support

### UI Library

**Ant Design 6**
- Comprehensive component library
- Enterprise-grade UI components
- Customizable theming
- Accessibility support

### Code Quality

**ESLint**
- Code linting and best practices
- React-specific rules
- TypeScript support

**Prettier**
- Consistent code formatting
- Automatic formatting on save
- Team-wide style consistency

### State Management

- React Context for global state
- Local state with useState/useReducer
- Server state with React Query (planned)

## Backend Stack

### Runtime

**Node.js 20+**
- LTS version for stability
- ES Modules support
- Modern JavaScript features

### Framework

**Express**
- Minimal and flexible
- Large ecosystem of middleware
- Well-documented and stable

### Language

**TypeScript**
- Type safety for API layer
- Better maintainability
- Shared types with frontend (planned)

### Database

**SQLite (better-sqlite3)**
- Lightweight, file-based database
- No external dependencies
- Synchronous API for simplicity
- Suitable for single-instance deployments

### Authentication

**JWT (jsonwebtoken)**
- Stateless authentication
- Token-based API access
- Refresh token support

### Logging

**Winston** (planned)
- Structured logging
- Multiple transports
- Log levels and rotation

### Testing

**Node.js Test Runner**
- Built-in test runner
- No additional dependencies
- Simple and effective

## Development Tools

### Package Management

**npm**
- Default Node.js package manager
- Lock file for reproducible builds

### Build Tools

**Vite** (Frontend)
- Lightning-fast HMR
- Optimized production builds
- Plugin ecosystem

**tsc** (Backend)
- TypeScript compiler
- Type checking and transpilation

### Code Quality

**ESLint + Prettier**
- Automated code review
- Consistent formatting
- CI/CD integration

## Deployment

### Frontend

- Static file hosting
- CDN distribution
- Environment-based configuration

### Backend

- Node.js process manager (PM2 planned)
- Environment variables for configuration
- Health check endpoints

## Future Considerations

### Potential Additions

- **React Query**: Better server state management
- **Zustand/Jotai**: Lightweight state management
- **WebSocket**: Real-time updates
- **Redis**: Caching layer
- **PostgreSQL**: For multi-instance deployments
- **Docker**: Containerization
- **CI/CD**: Automated testing and deployment

### Monitoring

- **Prometheus**: Metrics collection
- **Grafana**: Visualization
- **Sentry**: Error tracking

## Architecture Decisions

### Why SQLite?

- Simple deployment (no database server needed)
- Good for single-instance deployments
- Easy backup and migration
- Sufficient for dashboard use case

### Why Express?

- Mature and stable
- Large ecosystem
- Easy to learn and use
- Good TypeScript support

### Why Ant Design?

- Comprehensive component library
- Enterprise-grade quality
- Good documentation
- Active maintenance

### Why Vite?

- Fastest development experience
- Modern build tooling
- Great TypeScript support
- Optimized production builds
