# OpenClaw Dashboard

A comprehensive dashboard for managing OpenClaw agents, workflows, and tasks.

## 📋 Project Overview

OpenClaw Dashboard provides a web-based interface for:
- Monitoring agent status and health
- Managing workflows and tasks
- Viewing logs and metrics
- Configuring system settings

## 🏗️ Architecture

```
openclaw-dashboard/
├── frontend/          # React + TypeScript + Vite frontend
├── backend/           # Node.js + Express backend API
├── docs/              # Documentation
└── scripts/           # Build and deployment scripts
```

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18.x
- npm >= 9.x

### Development Setup

1. **Clone the repository**
   ```bash
   cd /home/admin/openclaw-dashboard
   ```

2. **Start the backend**
   ```bash
   cd backend
   npm run dev
   ```
   Backend runs on: http://localhost:3000

3. **Start the frontend** (in a new terminal)
   ```bash
   cd frontend
   npm run dev
   ```
   Frontend runs on: http://localhost:5173

## 🛠️ Tech Stack

### Frontend
- React 19
- TypeScript
- Vite
- Ant Design 6
- ESLint + Prettier

### Backend
- Node.js
- Express
- TypeScript
- SQLite (better-sqlite3)
- JWT Authentication

## 📦 Available Scripts

### Frontend
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
npm run format       # Format code with Prettier
npm run format:check # Check code formatting
```

### Backend
```bash
npm run dev          # Start development server
npm run build        # Build TypeScript
npm start            # Start production server
npm run lint         # Run ESLint
npm run test         # Run tests
```

## 📁 Project Structure

### Frontend
```
frontend/
├── src/
│   ├── components/   # Reusable UI components
│   ├── pages/        # Page components
│   ├── services/     # API service layer
│   ├── stores/       # State management
│   ├── utils/        # Utility functions
│   ├── App.tsx       # Main app component
│   └── main.tsx      # Entry point
├── public/           # Static assets
└── package.json
```

### Backend
```
backend/
├── src/
│   ├── routes/       # API route handlers
│   ├── services/     # Business logic
│   ├── repositories/ # Data access layer
│   ├── middleware/   # Express middleware
│   ├── utils/        # Utility functions
│   └── index.js      # Entry point
├── data/             # SQLite database
├── logs/             # Application logs
└── package.json
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the backend directory:

```env
PORT=3000
NODE_ENV=development
JWT_SECRET=your-secret-key
DB_PATH=./data/openclaw.db
```

## 📄 Documentation

- [Contributing Guide](./CONTRIBUTING.md)
- [API Documentation](./docs/api.md)
- [Architecture](./docs/architecture.md)

## 🤝 Contributing

Please read our [Contributing Guide](./CONTRIBUTING.md) before submitting pull requests.

## 📝 License

ISC
