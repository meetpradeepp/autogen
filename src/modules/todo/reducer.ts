import { Task, TaskState, TaskAction, TodoList } from './types';

const STORAGE_KEY = 'taskManagerState';
const LEGACY_STORAGE_KEY = 'tasks';

/**
 * Default color palette for lists
 */
const DEFAULT_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Violet
  '#EC4899', // Pink
];

/**
 * Maximum valid JavaScript timestamp (equivalent to Sep 13, 275760)
 * This is the maximum value that Date can safely represent
 */
const MAX_SAFE_TIMESTAMP = 8640000000000000;

/**
 * Validate hex color format
 * @throws Error if invalid
 */
function validateColor(color: string): string {
  const hexPattern = /^#[0-9A-Fa-f]{6}$/;
  if (!hexPattern.test(color)) {
    throw new Error('Invalid color format. Must be hex (#RRGGBB)');
  }
  return color;
}

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
 * Validate task title
 * @throws Error if validation fails
 */
function validateTaskTitle(title: string): string {
  const trimmed = title.trim();
  if (trimmed.length === 0) {
    throw new Error('Task title cannot be empty');
  }
  if (trimmed.length > 200) {
    throw new Error('Task title too long (max 200 characters)');
  }
  return trimmed;
}

/**
 * Validate task description (optional)
 * @throws Error if validation fails
 */
function validateTaskDescription(description: string | undefined): string | undefined {
  if (!description) {
    return undefined;
  }
  const trimmed = description.trim();
  if (trimmed.length === 0) {
    return undefined; // Empty description is treated as no description
  }
  if (trimmed.length > 2000) {
    throw new Error('Task description too long (max 2000 characters)');
  }
  return trimmed;
}

/**
 * Save state to localStorage with error handling
 */
function saveState(state: TaskState): void {
  try {
    const { lists, tasks, activeListId, sortPreferences } = state;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ lists, tasks, activeListId, sortPreferences }));
  } catch (error) {
    // localStorage might be full, disabled, or in private mode
    console.warn('Failed to save state to localStorage:', error);
    // Graceful degradation - app continues in memory-only mode
  }
}

/**
 * Migrate a task from old format to new format
 * Handles both 'text' (pre-FE-101) and 'description' (FE-101) to 'title' migration
 */
function migrateTask(task: any): Task {
  // If task already has title, it's in the new format - keep both title and description
  if (task.title) {
    return {
      id: task.id,
      title: task.title,
      description: task.description || undefined,
      isCompleted: task.isCompleted ?? false,
      priority: task.priority,
      createdAt: task.createdAt,
      listId: task.listId,
      dueDate: task.dueDate,
    };
  }
  
  // Legacy migration: old 'description' or 'text' becomes new 'title'
  return {
    id: task.id,
    title: task.description || task.text || 'Untitled',
    description: undefined, // Legacy tasks don't have separate description
    isCompleted: task.isCompleted ?? false,
    priority: task.priority,
    createdAt: task.createdAt,
    listId: task.listId,
    dueDate: task.dueDate,
  };
}

/**
 * Migrate activeView from old 'list' format to new 'dashboard' format
 */
function migrateActiveView(activeView: unknown): 'dashboard' | 'calendar' {
  if (activeView === 'list') {
    return 'dashboard';
  }
  return (activeView === 'calendar' ? 'calendar' : 'dashboard');
}

/**
 * Load state from localStorage with migration support
 */
export function loadState(): TaskState {
  try {
    // Try new format first
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      
      // Migrate lists without color field
      const migratedLists = (parsed.lists || []).map((list: TodoList, index: number) => ({
        ...list,
        color: list.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length],
      }));
      
      // Migrate tasks to new format (handles title/description/isCompleted migration)
      const migratedTasks = (parsed.tasks || []).map(migrateTask);
      
      return {
        lists: migratedLists,
        tasks: migratedTasks,
        activeListId: parsed.activeListId || null,
        activeView: migrateActiveView(parsed.activeView),
        error: null,
        sortPreferences: parsed.sortPreferences || {},
      };
    }

    // Try legacy format (migration from FE-101)
    const legacyStored = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacyStored) {
      const legacyTasks = JSON.parse(legacyStored) as Array<{
        id: string;
        description: string;
        priority: 'high' | 'medium' | 'low';
        createdAt: number;
      }>;
      
      // Create default "General" list with color
      const defaultList: TodoList = {
        id: generateId(),
        name: 'General',
        color: DEFAULT_COLORS[0],
        createdAt: Date.now(),
      };

      // Migrate tasks to new format with listId and new schema
      const migratedTasks: Task[] = legacyTasks.map(task => ({
        id: task.id,
        title: task.description, // Old 'description' becomes 'title'
        description: undefined,
        isCompleted: false,
        priority: task.priority,
        createdAt: task.createdAt,
        listId: defaultList.id,
      }));

      const migratedState: TaskState = {
        lists: [defaultList],
        tasks: migratedTasks,
        activeListId: defaultList.id,
        activeView: 'dashboard',
        error: null,
        sortPreferences: {},
      };

      // Save migrated state and remove legacy key
      saveState(migratedState);
      localStorage.removeItem(LEGACY_STORAGE_KEY);

      return migratedState;
    }
  } catch (error) {
    console.warn('Failed to load state from localStorage:', error);
  }
  
  return {
    lists: [],
    tasks: [],
    activeListId: null,
    activeView: 'dashboard',
    error: null,
    sortPreferences: {},
  };
}

/**
 * Task reducer - pure function handling all state transitions
 */
export function taskReducer(state: TaskState, action: TaskAction): TaskState {
  switch (action.type) {
    case 'ADD_TASK': {
      try {
        // Determine target list: explicit listId from payload, or active list
        const targetListId = action.payload.listId || state.activeListId;
        
        // Ensure there's a target list
        if (!targetListId) {
          return {
            ...state,
            error: 'No active list selected',
          };
        }
        
        // Validate that the target list exists
        const listExists = state.lists.some(list => list.id === targetListId);
        if (!listExists) {
          return {
            ...state,
            error: 'Target list does not exist',
          };
        }

        const validatedTitle = validateTaskTitle(action.payload.title);
        const validatedDescription = validateTaskDescription(action.payload.description);
        const newTask: Task = {
          id: generateId(),
          title: validatedTitle,
          description: validatedDescription,
          isCompleted: action.payload.isCompleted ?? false,
          priority: action.payload.priority,
          createdAt: Date.now(),
          listId: targetListId,
          ...(action.payload.dueDate && { dueDate: action.payload.dueDate }),
        };
        const updatedTasks = [newTask, ...state.tasks];
        const newState = {
          ...state,
          tasks: updatedTasks,
          error: null,
        };
        saveState(newState);
        return newState;
      } catch (error) {
        return {
          ...state,
          error: error instanceof Error ? error.message : 'Failed to add task',
        };
      }
    }

    case 'UPDATE_TASK': {
      try {
        const { id, title, description, priority, dueDate, listId, isCompleted } = action.payload;
        
        // Validate task exists
        const taskExists = state.tasks.find(task => task.id === id);
        if (!taskExists) {
          return {
            ...state,
            error: 'Task not found',
          };
        }

        // Validate title
        const validatedTitle = validateTaskTitle(title);
        
        // Validate description (optional)
        const validatedDescription = validateTaskDescription(description);
        
        // Validate dueDate timestamp
        const validatedDueDate = (dueDate !== undefined && 
                                  isFinite(dueDate) && 
                                  dueDate > 0 && 
                                  dueDate <= MAX_SAFE_TIMESTAMP) 
          ? dueDate 
          : undefined;
        
        // Validate target list if listId is provided (moving task)
        if (listId !== undefined) {
          const listExists = state.lists.some(list => list.id === listId);
          if (!listExists) {
            return {
              ...state,
              error: 'Target list does not exist',
            };
          }
        }
        
        // Update the task
        const updatedTasks = state.tasks.map(task =>
          task.id === id
            ? {
                ...task,
                title: validatedTitle,
                description: validatedDescription,
                priority,
                dueDate: validatedDueDate,
                ...(listId !== undefined && { listId }),
                ...(isCompleted !== undefined && { isCompleted }),
              }
            : task
        );
        
        const newState = {
          ...state,
          tasks: updatedTasks,
          error: null,
        };
        saveState(newState);
        return newState;
      } catch (error) {
        return {
          ...state,
          error: error instanceof Error ? error.message : 'Failed to update task',
        };
      }
    }

    case 'TOGGLE_TASK_COMPLETION': {
      const updatedTasks = state.tasks.map(task =>
        task.id === action.payload
          ? { ...task, isCompleted: !task.isCompleted }
          : task
      );
      const newState = {
        ...state,
        tasks: updatedTasks,
      };
      saveState(newState);
      return newState;
    }

    case 'DELETE_TASK': {
      const updatedTasks = state.tasks.filter(task => task.id !== action.payload);
      const newState = {
        ...state,
        tasks: updatedTasks,
      };
      saveState(newState);
      return newState;
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
      // Legacy support - convert to new state structure
      return {
        ...state,
        tasks: action.payload,
      };

    case 'CREATE_LIST': {
      try {
        const { name: listName, color } = action.payload;
        
        // Validate list name
        if (listName.trim().length === 0) {
          return {
            ...state,
            error: 'List name cannot be empty',
          };
        }

        // Validate list name length
        if (listName.trim().length > 100) {
          return {
            ...state,
            error: 'List name too long (max 100 characters)',
          };
        }

        // Validate color format (security: prevent CSS injection)
        const validatedColor = validateColor(color);

        // Check for duplicate names
        const isDuplicate = state.lists.some(
          list => list.name.toLowerCase() === listName.trim().toLowerCase()
        );
        if (isDuplicate) {
          return {
            ...state,
            error: 'List name must be unique',
          };
        }

        const newList: TodoList = {
          id: generateId(),
          name: listName.trim(),
          color: validatedColor,
          createdAt: Date.now(),
        };

        const newState = {
          ...state,
          lists: [...state.lists, newList],
          activeListId: newList.id,
          error: null,
        };
        saveState(newState);
        return newState;
      } catch (error) {
        return {
          ...state,
          error: error instanceof Error ? error.message : 'Failed to create list',
        };
      }
    }

    case 'UPDATE_LIST_COLOR': {
      try {
        const { listId, color } = action.payload;
        
        // Validate color format (security: prevent CSS injection)
        const validatedColor = validateColor(color);
        
        const updatedLists = state.lists.map(list =>
          list.id === listId ? { ...list, color: validatedColor } : list
        );
        const newState = {
          ...state,
          lists: updatedLists,
        };
        saveState(newState);
        return newState;
      } catch (error) {
        return {
          ...state,
          error: error instanceof Error ? error.message : 'Failed to update list color',
        };
      }
    }

    case 'SWITCH_LIST': {
      return {
        ...state,
        activeListId: action.payload,
        error: null,
      };
    }

    case 'DELETE_LIST': {
      const listIdToDelete = action.payload;
      
      // Remove the list from lists array
      const updatedLists = state.lists.filter(list => list.id !== listIdToDelete);
      
      // Remove all tasks associated with this list (prevent orphaned tasks)
      const updatedTasks = state.tasks.filter(task => task.listId !== listIdToDelete);
      
      // Handle active list switching if the deleted list was active
      let newActiveListId = state.activeListId;
      if (state.activeListId === listIdToDelete) {
        // Switch to the first available list, or null if no lists remain
        newActiveListId = updatedLists.length > 0 ? updatedLists[0].id : null;
      }

      const newState = {
        ...state,
        lists: updatedLists,
        tasks: updatedTasks,
        activeListId: newActiveListId,
        error: null,
      };
      
      saveState(newState);
      return newState;
    }

    case 'LOAD_STATE': {
      return action.payload;
    }

    case 'SET_SORT_PREFERENCE': {
      const { listId, sortOption } = action.payload;
      const newState = {
        ...state,
        sortPreferences: {
          ...state.sortPreferences,
          [listId]: sortOption,
        },
      };
      saveState(newState);
      return newState;
    }

    case 'SET_VIEW': {
      return {
        ...state,
        activeView: action.payload,
      };
    }

    default:
      return state;
  }
}

export const initialState: TaskState = {
  lists: [],
  tasks: [],
  activeListId: null,
  activeView: 'dashboard',
  error: null,
  sortPreferences: {},
};

export { DEFAULT_COLORS };
