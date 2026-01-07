export type Priority = 'high' | 'medium' | 'low';

export type SortOption = 'priority' | 'dateAdded' | 'alphabetical';

export interface Task {
  id: string;
  description: string;
  priority: Priority;
  createdAt: number;
  listId: string; // Reference to the list this task belongs to
  dueDate?: number; // Optional due date timestamp
}

export interface TodoList {
  id: string;
  name: string;
  color: string; // Hex color code for visual identification
  createdAt: number;
}

export type ViewMode = 'list' | 'calendar';

export interface TaskState {
  lists: TodoList[];
  tasks: Task[];
  activeListId: string | null;
  activeView: ViewMode;
  error: string | null;
  sortPreferences: Record<string, SortOption>; // Per-list sort preferences
}

export type TaskAction =
  | { type: 'ADD_TASK'; payload: Omit<Task, 'id' | 'createdAt' | 'listId'> }
  | { type: 'DELETE_TASK'; payload: string }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'LOAD_TASKS'; payload: Task[] }
  | { type: 'CREATE_LIST'; payload: { name: string; color: string } }
  | { type: 'UPDATE_LIST_COLOR'; payload: { listId: string; color: string } }
  | { type: 'SWITCH_LIST'; payload: string }
  | { type: 'DELETE_LIST'; payload: string }
  | { type: 'LOAD_STATE'; payload: TaskState }
  | { type: 'SET_SORT_PREFERENCE'; payload: { listId: string; sortOption: SortOption } };
