import { TaskProvider } from './context/TaskContext';
import { TaskForm } from './modules/todo/TaskForm';
import { TaskList } from './modules/todo/TaskList';
import { Layout } from './modules/todo/Layout';
import './App.css';

function App() {
  return (
    <TaskProvider>
      <Layout>
        <div className="container">
          <TaskForm />
          <TaskList />
        </div>
      </Layout>
    </TaskProvider>
  );
}

export default App;
