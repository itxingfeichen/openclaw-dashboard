# OpenClaw Dashboard

A full-stack dashboard application built with React + TypeScript (frontend) and Node.js + Express (backend).

## 📁 Project Structure

```
openclaw-dashboard/
├── frontend/          # React + TypeScript + Vite frontend
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── pages/       # Page components
│   │   ├── hooks/       # Custom React hooks
│   │   ├── App.tsx      # Main application component
│   │   └── main.tsx     # Entry point
│   ├── public/          # Static assets
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── .eslintrc.cjs
│   └── .prettierrc
├── backend/           # Node.js + Express backend
│   ├── src/
│   │   ├── routes/      # API route handlers
│   │   │   ├── cli.js   # CLI adapter routes
│   │   │   └── health.js # Health check routes
│   │   ├── middleware/  # Express middleware
│   │   ├── cli-adapter/ # CLI command wrapper
│   │   │   ├── index.js     # Module entry
│   │   │   ├── executor.js  # Command executor
│   │   │   ├── commands.js  # CLI commands wrapper
│   │   │   ├── schema.js    # Output validation
│   │   │   ├── parsers.js   # Text output parsers
│   │   │   └── README.md    # Documentation
│   │   └── index.js     # Server entry point
│   ├── tests/         # Unit tests
│   ├── package.json
│   └── .env
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18.x
- npm >= 9.x

### Backend Setup

```bash
cd backend
npm install
npm start
```

The backend server will start on **http://localhost:8080**

**API Endpoints:**

**Health:**
- `GET /` - API info
- `GET /api/health` - Health check endpoint
- `GET /api/health/ready` - Readiness check endpoint

**CLI Adapter (OpenClaw Integration):**
- `GET /api/status` - Get system status
- `GET /api/agents` - Get Agent list
- `GET /api/sessions` - Get session list
- `GET /api/cron` - Get cron job list
- `GET /api/config` - Get configuration (optional `?key=` parameter)

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend dev server will start on **http://localhost:3000**

## 🛠️ Development Commands

### Frontend

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run lint` | Run ESLint |
| `npm run format` | Format code with Prettier |
| `npm run preview` | Preview production build |

### Backend

| Command | Description |
|---------|-------------|
| `npm start` | Start production server |
| `npm run dev` | Start development server with auto-reload |
| `npm test` | Run unit tests |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run test:watch` | Run tests in watch mode |

## 🔌 CLI Adapter

The CLI Adapter module provides a stable API layer for interacting with OpenClaw CLI commands.

### Features

- **Command Execution**: Wraps `child_process.exec` with timeout control and retry logic
- **Output Parsing**: Parses CLI text output into structured JSON
- **Schema Validation**: Validates CLI output format
- **Error Handling**: Graceful error handling with friendly messages

### Usage Example

```javascript
import {
  getStatus,
  getAgentsList,
  getSessionsList,
} from './backend/src/cli-adapter/index.js'

// Get system status
const status = await getStatus()

// Get agents list
const agents = await getAgentsList()
console.log(`Found ${agents.count} agents`)
```

### API Response Format

All CLI adapter endpoints return a consistent format:

```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2026-03-13T00:00:00.000Z"
}
```

For detailed documentation, see [`backend/src/cli-adapter/README.md`](backend/src/cli-adapter/README.md).

## 🔧 Configuration

### Backend Environment Variables

Edit `backend/.env`:

```env
PORT=8080
JWT_SECRET=your-secret-key-change-in-production
NODE_ENV=development
```

### Frontend Proxy

The frontend is configured to proxy `/api` requests to the backend server (localhost:8080) during development. See `frontend/vite.config.ts`.

## 📦 Dependencies

### Frontend

- **React 18** - UI library
- **Ant Design 5** - UI component library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **ESLint + Prettier** - Code quality

### Backend

- **Express** - Web framework
- **jsonwebtoken** - JWT authentication
- **better-sqlite3** - SQLite database
- **cors** - Cross-origin resource sharing
- **dotenv** - Environment variables

## 🌐 Access URLs

| Service | URL |
|---------|-----|
| Frontend (Dev) | http://localhost:3000 |
| Backend API | http://localhost:8080 |
| Health Check | http://localhost:8080/api/health |

## 📝 License

MIT

---

_Built with OpenClaw_
