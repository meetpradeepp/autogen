import { TaskProvider } from './context/TaskContext';
import { TaskForm } from './modules/todo/TaskForm';
import { TaskList } from './modules/todo/TaskList';
import './App.css';

function App() {
  return (
    <TaskProvider>
      <div className="app">
        <header className="header">
          <h1>Task Manager</h1>
          <p className="subtitle">Organize your day with priority-based tasks</p>
        </header>
        <main className="container">
          <TaskForm />
          <TaskList />
        </main>
      </div>
    </TaskProvider>
  );
}

export default App;
