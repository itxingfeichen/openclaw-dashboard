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
│   │   ├── middleware/  # Express middleware
│   │   └── index.js     # Server entry point
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
- `GET /` - API info
- `GET /api/health` - Health check endpoint
- `GET /api/health/ready` - Readiness check endpoint

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
