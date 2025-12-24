import { Task, TaskState, TaskAction } from './types';

const STORAGE_KEY = 'tasks';

/**
 * Generate unique ID using crypto.randomUUID with fallback
 */
function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for environments without crypto.randomUUID
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Validate task description
 * @throws Error if validation fails
 */
function validateTaskDescription(description: string): string {
  const trimmed = description.trim();
  if (trimmed.length === 0) {
    throw new Error('Task cannot be empty');
  }
  if (trimmed.length > 500) {
    throw new Error('Task description too long (max 500 characters)');
  }
  return trimmed;
}

/**
 * Save tasks to localStorage with error handling
 */
function saveTasks(tasks: Task[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch (error) {
    // localStorage might be full, disabled, or in private mode
    console.warn('Failed to save tasks to localStorage:', error);
    // Graceful degradation - app continues in memory-only mode
  }
}

/**
 * Load tasks from localStorage
 */
export function loadTasks(): Task[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored) as Task[];
    }
  } catch (error) {
    console.warn('Failed to load tasks from localStorage:', error);
  }
  return [];
}

/**
 * Task reducer - pure function handling all state transitions
 */
export function taskReducer(state: TaskState, action: TaskAction): TaskState {
  switch (action.type) {
    case 'ADD_TASK': {
      try {
        const validatedDescription = validateTaskDescription(action.payload.description);
        const newTask: Task = {
          id: generateId(),
          description: validatedDescription,
          priority: action.payload.priority,
          createdAt: Date.now(),
        };
        const updatedTasks = [newTask, ...state.tasks];
        saveTasks(updatedTasks);
        return {
          tasks: updatedTasks,
          error: null,
        };
      } catch (error) {
        return {
          ...state,
          error: error instanceof Error ? error.message : 'Failed to add task',
        };
      }
    }

    case 'DELETE_TASK': {
      const updatedTasks = state.tasks.filter(task => task.id !== action.payload);
      saveTasks(updatedTasks);
      return {
        ...state,
        tasks: updatedTasks,
      };
    }

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
      };

    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };

    case 'LOAD_TASKS':
      return {
        ...state,
        tasks: action.payload,
      };

    default:
      return state;
  }
}

export const initialState: TaskState = {
  tasks: [],
  error: null,
};
