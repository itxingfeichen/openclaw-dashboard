import { useState } from 'react';
import './App.css';

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="app">
      <header className="app-header">
        <h1>🦀 OpenClaw Dashboard</h1>
        <p>Welcome to your OpenClaw Dashboard</p>
      </header>

      <main className="app-main">
        <div className="card">
          <button onClick={() => setCount((count) => count + 1)}>count is {count}</button>
          <p>
            Edit <code>src/App.tsx</code> and save to test HMR
          </p>
        </div>

        <p className="read-the-docs">Click on the OpenClaw logo to learn more</p>
      </main>
    </div>
  );
}

export default App;
