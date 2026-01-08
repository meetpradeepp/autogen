import { BrowserRouter, Routes, Route, Navigate, useParams, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { TaskProvider } from './context/TaskContext';
import { CompactModeProvider } from './context/CompactModeContext';
import { TaskForm } from './modules/todo/TaskForm';
import { TaskList } from './modules/todo/TaskList';
import { CalendarView } from './modules/todo/CalendarView';
import { Layout } from './modules/todo/Layout';
import { useTaskContext } from './context/TaskContext';
import './App.css';

/**
 * Dashboard view - shows task form and task list
 */
function Dashboard() {
  return (
    <Layout>
      <div className="container">
        <TaskForm />
        <TaskList />
      </div>
    </Layout>
  );
}

/**
 * List view - validates list ID and shows tasks for that list
 */
function ListView() {
  const { listId } = useParams<{ listId: string }>();
  const { state, dispatch } = useTaskContext();
  const navigate = useNavigate();

  useEffect(() => {
    // Validate that the list exists
    const listExists = state.lists.some(list => list.id === listId);
    
    if (!listExists) {
      // Invalid list ID - redirect to dashboard
      navigate('/', { replace: true });
      return;
    }

    // Set the active list if it's different
    if (state.activeListId !== listId) {
      dispatch({ type: 'SWITCH_LIST', payload: listId! });
    }
  }, [listId, state.lists, state.activeListId, dispatch, navigate]);

  // Validate list exists before rendering
  const listExists = state.lists.some(list => list.id === listId);
  
  if (!listExists) {
    // Will redirect via useEffect, but return null to avoid flash
    return null;
  }

  return (
    <Layout>
      <div className="container">
        <TaskForm />
        <TaskList />
      </div>
    </Layout>
  );
}

/**
 * Calendar view route
 */
function Calendar() {
  const { dispatch } = useTaskContext();

  useEffect(() => {
    // Ensure activeView is set to calendar
    dispatch({ type: 'SET_VIEW', payload: 'calendar' });
  }, [dispatch]);

  return (
    <Layout>
      <div className="container">
        <CalendarView />
      </div>
    </Layout>
  );
}

/**
 * App content with routing
 */
function AppContent() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/list/:listId" element={<ListView />} />
      <Route path="/calendar" element={<Calendar />} />
      {/* Catch-all redirect to dashboard for 404s */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <CompactModeProvider>
      <TaskProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </TaskProvider>
    </CompactModeProvider>
  );
}

export default App;
