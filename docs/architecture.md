# Architecture Documentation

## System Overview

OpenClaw Dashboard follows a client-server architecture with a React frontend and Node.js/Express backend.

```
┌─────────────────────────────────────────────────────────────┐
│                      User Browser                            │
│                                                              │
│  ┌────────────────────────────────────────────────────┐     │
│  │           React Frontend (Vite)                     │     │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐         │     │
│  │  │Components│  │  Pages   │  │ Services │         │     │
│  │  └──────────┘  └──────────┘  └──────────┘         │     │
│  └────────────────────────────────────────────────────┘     │
│                          │                                   │
│                    HTTP/REST                                 │
│                    WebSocket                                 │
└──────────────────────────┼───────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                   Node.js Backend                            │
│                                                              │
│  ┌────────────────────────────────────────────────────┐     │
│  │              Express Application                    │     │
│  │  ┌────────┐  ┌──────────┐  ┌────────────┐         │     │
│  │  │ Routes │  │Middleware│  │  Services  │         │     │
│  │  └────────┘  └──────────┘  └────────────┘         │     │
│  │       │                          │                  │     │
│  │       ▼                          ▼                  │     │
│  │  ┌────────────────────────────────────────┐        │     │
│  │  │         Repositories (Data Access)      │        │     │
│  │  └────────────────────────────────────────┘        │     │
│  └────────────────────────────────────────────────────┘     │
│                          │                                   │
│                          ▼                                   │
│              ┌─────────────────────┐                        │
│              │   SQLite Database   │                        │
│              └─────────────────────┘                        │
└─────────────────────────────────────────────────────────────┘
```

## Frontend Architecture

### Component Hierarchy

```
App
├── Layout
│   ├── Header
│   ├── Sider (Navigation)
│   └── Content
│       ├── Dashboard
│       ├── Projects
│       ├── Users
│       └── Settings
└── Provider (ConfigProvider)
```

### State Management

- **Local State**: useState/useReducer for component-specific state
- **Global State**: React Context for app-wide state (theme, user)
- **Server State**: Direct API calls with error/loading states

### Key Technologies

- **React 19**: Component framework
- **TypeScript**: Type safety
- **Ant Design**: UI component library
- **Vite**: Build tool and dev server

### File Structure

```
frontend/src/
├── assets/          # Static assets (images, fonts)
├── components/      # Reusable UI components
│   ├── common/      # Generic components (Button, Card)
│   └── layout/      # Layout components (Header, Sidebar)
├── pages/           # Page-level components
│   ├── Dashboard/
│   ├── Projects/
│   ├── Users/
│   └── Settings/
├── services/        # API service layer
│   ├── api.ts       # HTTP client configuration
│   ├── agents.ts    # Agent-related API calls
│   └── tasks.ts     # Task-related API calls
├── stores/          # State management
│   └── appStore.ts  # Global application state
├── utils/           # Utility functions
│   ├── format.ts    # Data formatting
│   └── validation.ts # Input validation
├── App.tsx          # Root component
├── main.tsx         # Entry point
└── index.css        # Global styles
```

## Backend Architecture

### Layer Architecture

```
┌─────────────────┐
│    Routes       │  ← HTTP Request Handling
├─────────────────┤
│  Middleware     │  ← Auth, Logging, Error Handling
├─────────────────┤
│   Services      │  ← Business Logic
├─────────────────┤
│  Repositories   │  ← Data Access
├─────────────────┤
│   Database      │  ← SQLite Storage
└─────────────────┘
```

### Key Technologies

- **Express**: Web framework
- **TypeScript**: Type safety
- **SQLite**: Database
- **JWT**: Authentication

### File Structure

```
backend/src/
├── routes/          # API route handlers
│   ├── agents.js    # Agent endpoints
│   ├── tasks.js     # Task endpoints
│   ├── logs.js      # Log endpoints
│   └── index.js     # Route aggregator
├── services/        # Business logic
│   ├── agentService.js
│   ├── taskService.js
│   └── authService.js
├── repositories/    # Data access layer
│   ├── agentRepo.js
│   ├── taskRepo.js
│   └── db.js        # Database connection
├── middleware/      # Express middleware
│   ├── auth.js      # JWT authentication
│   ├── error.js     # Error handling
│   └── logger.js    # Request logging
├── utils/           # Utility functions
│   ├── logger.js    # Logging utility
│   └── config.js    # Configuration management
└── index.js         # Application entry point
```

## Data Flow

### Request Flow

1. **Client** sends HTTP request
2. **Middleware** processes request (auth, logging)
3. **Route** handler receives request
4. **Service** executes business logic
5. **Repository** accesses database
6. **Response** flows back through layers
7. **Client** receives response

### Example: Create Task

```
Browser → POST /api/v1/tasks
           ↓
    Auth Middleware (verify JWT)
           ↓
    tasksRouter (validate input)
           ↓
    taskService.createTask()
           ↓
    taskRepository.insert()
           ↓
    SQLite Database
           ↓
    Response: { id, status, ... }
           ↓
    Browser (update UI)
```

## Security

### Authentication

- JWT-based authentication
- Tokens expire after 1 hour
- Refresh tokens for extended sessions
- Password hashing with bcrypt

### Authorization

- Role-based access control (planned)
- Resource-level permissions
- API rate limiting

### Data Protection

- Input validation and sanitization
- SQL injection prevention (parameterized queries)
- CORS configuration
- HTTPS in production

## Deployment

### Development

```bash
# Start both services
./scripts/dev.sh

# Or manually:
cd backend && npm run dev
cd frontend && npm run dev
```

### Production

```bash
# Build both services
./scripts/build.sh

# Start production server
cd dist/backend && npm start
```

### Environment Variables

```env
# Backend
PORT=3000
NODE_ENV=production
JWT_SECRET=your-secret-key
DB_PATH=/var/lib/openclaw/dashboard.db

# Frontend (build-time)
VITE_API_URL=https://api.your-domain.com
```

## Monitoring

### Health Checks

- `/api/v1/health` - Application health
- Database connectivity check
- Memory and CPU metrics

### Logging

- Structured JSON logging
- Log levels: debug, info, warn, error
- Log rotation (planned)

### Metrics

- Request count and latency
- Active agents and tasks
- System resource usage

## Scalability Considerations

### Current Limitations

- Single-instance deployment (SQLite)
- In-memory session storage
- No horizontal scaling

### Future Improvements

- PostgreSQL for multi-instance support
- Redis for caching and sessions
- Message queue for task processing
- Container orchestration (Kubernetes)

## Testing Strategy

### Frontend

- Unit tests for utilities
- Component tests with React Testing Library
- E2E tests with Playwright (planned)

### Backend

- Unit tests for services
- Integration tests for API endpoints
- Database tests with test fixtures

### CI/CD

- Automated testing on pull requests
- Code coverage reporting
- Automated deployment (planned)
