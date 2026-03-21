import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AgentList } from './components/AgentList';
import { AgentDetail } from './components/AgentDetail';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <header className="app-header">
          <h1>🦀 OpenClaw Dashboard</h1>
          <p>Your OpenClaw Agent Management Console</p>
        </header>

        <main className="app-main">
          <Routes>
            <Route path="/" element={<Navigate to="/agents" replace />} />
            <Route path="/agents" element={<AgentList />} />
            <Route path="/agents/:name" element={<AgentDetail />} />
          </Routes>
        </main>

        <footer className="app-footer">
          <p>OpenClaw Dashboard v1.0.0</p>
        </footer>
      </div>
    </BrowserRouter>
  );
}

export default App;
