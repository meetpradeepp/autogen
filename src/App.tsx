import { TaskProvider } from './context/TaskContext';
import { CompactModeProvider } from './context/CompactModeContext';
import { TaskForm } from './modules/todo/TaskForm';
import { TaskList } from './modules/todo/TaskList';
import { CalendarView } from './modules/todo/CalendarView';
import { Layout } from './modules/todo/Layout';
import { useTaskContext } from './context/TaskContext';
import './App.css';

function AppContent() {
  const { state } = useTaskContext();

  return (
    <Layout>
      <div className="container">
        {state.activeView === 'calendar' ? (
          <CalendarView />
        ) : (
          <>
            <TaskForm />
            <TaskList />
          </>
        )}
      </div>
    </Layout>
  );
}

function App() {
  return (
    <CompactModeProvider>
      <TaskProvider>
        <AppContent />
      </TaskProvider>
    </CompactModeProvider>
  );
}

export default App;
