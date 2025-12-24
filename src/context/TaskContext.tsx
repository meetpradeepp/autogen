import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { TaskState, TaskAction } from '../modules/todo/types';
import { taskReducer, initialState, loadState } from '../modules/todo/reducer';

interface TaskContextValue {
  state: TaskState;
  dispatch: React.Dispatch<TaskAction>;
}

const TaskContext = createContext<TaskContextValue | undefined>(undefined);

export function TaskProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(taskReducer, initialState);

  // Load state from localStorage on mount
  useEffect(() => {
    const loadedState = loadState();
    if (loadedState.lists.length > 0 || loadedState.tasks.length > 0) {
      dispatch({ type: 'LOAD_STATE', payload: loadedState });
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
