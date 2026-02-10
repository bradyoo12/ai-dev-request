/**
 * Sample project files for the Sandpack code preview.
 * Used as a demo/fallback when real generated project files are not yet available.
 */

export const sampleProjectFiles: Record<string, string> = {
  '/App.tsx': `import React, { useState } from 'react'
import './styles.css'

interface Task {
  id: number
  text: string
  completed: boolean
}

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([
    { id: 1, text: 'Review project requirements', completed: true },
    { id: 2, text: 'Set up development environment', completed: true },
    { id: 3, text: 'Build the landing page', completed: false },
    { id: 4, text: 'Add user authentication', completed: false },
  ])
  const [newTask, setNewTask] = useState('')

  const addTask = () => {
    if (!newTask.trim()) return
    setTasks(prev => [
      ...prev,
      { id: Date.now(), text: newTask.trim(), completed: false },
    ])
    setNewTask('')
  }

  const toggleTask = (id: number) => {
    setTasks(prev =>
      prev.map(t => (t.id === id ? { ...t, completed: !t.completed } : t))
    )
  }

  const deleteTask = (id: number) => {
    setTasks(prev => prev.filter(t => t.id !== id))
  }

  const completedCount = tasks.filter(t => t.completed).length

  return (
    <div className="app">
      <header className="header">
        <h1>AI Dev Request</h1>
        <p className="subtitle">Generated Project Preview</p>
      </header>

      <main className="main">
        <div className="stats">
          <div className="stat-card">
            <span className="stat-value">{tasks.length}</span>
            <span className="stat-label">Total Tasks</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{completedCount}</span>
            <span className="stat-label">Completed</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">
              {tasks.length > 0
                ? Math.round((completedCount / tasks.length) * 100)
                : 0}%
            </span>
            <span className="stat-label">Progress</span>
          </div>
        </div>

        <div className="add-task">
          <input
            type="text"
            value={newTask}
            onChange={e => setNewTask(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addTask()}
            placeholder="Add a new task..."
            className="task-input"
          />
          <button onClick={addTask} className="add-btn">
            Add
          </button>
        </div>

        <ul className="task-list">
          {tasks.map(task => (
            <li key={task.id} className={\`task-item \${task.completed ? 'completed' : ''}\`}>
              <label className="task-label">
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => toggleTask(task.id)}
                />
                <span className="task-text">{task.text}</span>
              </label>
              <button
                onClick={() => deleteTask(task.id)}
                className="delete-btn"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      </main>
    </div>
  )
}
`,

  '/index.tsx': `import React, { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import App from "./App"

const rootElement = document.getElementById("root")!
const root = createRoot(rootElement)

root.render(
  <StrictMode>
    <App />
  </StrictMode>
)
`,

  '/styles.css': `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  color: #e2e8f0;
  min-height: 100vh;
}

.app {
  max-width: 640px;
  margin: 0 auto;
  padding: 24px 16px;
}

.header {
  text-align: center;
  margin-bottom: 32px;
}

.header h1 {
  font-size: 28px;
  font-weight: 700;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 4px;
}

.subtitle {
  color: #94a3b8;
  font-size: 14px;
}

.stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 24px;
}

.stat-card {
  background: rgba(30, 41, 59, 0.8);
  border: 1px solid #334155;
  border-radius: 12px;
  padding: 16px;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #3b82f6;
}

.stat-label {
  font-size: 12px;
  color: #94a3b8;
}

.add-task {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
}

.task-input {
  flex: 1;
  padding: 12px 16px;
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 10px;
  color: #e2e8f0;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
}

.task-input:focus {
  border-color: #3b82f6;
}

.task-input::placeholder {
  color: #64748b;
}

.add-btn {
  padding: 12px 20px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 10px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s;
}

.add-btn:hover {
  background: #2563eb;
}

.task-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.task-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid #334155;
  border-radius: 10px;
  transition: all 0.2s;
}

.task-item:hover {
  border-color: #475569;
}

.task-item.completed {
  opacity: 0.6;
}

.task-item.completed .task-text {
  text-decoration: line-through;
  color: #64748b;
}

.task-label {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  flex: 1;
}

.task-label input[type="checkbox"] {
  width: 18px;
  height: 18px;
  accent-color: #3b82f6;
  cursor: pointer;
}

.task-text {
  font-size: 14px;
}

.delete-btn {
  padding: 4px 12px;
  background: transparent;
  color: #ef4444;
  border: 1px solid #ef4444;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  opacity: 0;
  transition: all 0.2s;
}

.task-item:hover .delete-btn {
  opacity: 1;
}

.delete-btn:hover {
  background: #ef4444;
  color: white;
}
`,
}
