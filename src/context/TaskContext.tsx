import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { TaskState, TaskAction } from '../modules/todo/types';
import { taskReducer, initialState, loadTasks } from '../modules/todo/reducer';

interface TaskContextValue {
  state: TaskState;
  dispatch: React.Dispatch<TaskAction>;
}

const TaskContext = createContext<TaskContextValue | undefined>(undefined);

export function TaskProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(taskReducer, initialState);

  // Load tasks from localStorage on mount
  useEffect(() => {
    const storedTasks = loadTasks();
    if (storedTasks.length > 0) {
      dispatch({ type: 'LOAD_TASKS', payload: storedTasks });
    }
  }, []);

  return (
    <TaskContext.Provider value={{ state, dispatch }}>
      {children}
    </TaskContext.Provider>
  );
}

export function useTaskContext() {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTaskContext must be used within TaskProvider');
  }
  return context;
}
