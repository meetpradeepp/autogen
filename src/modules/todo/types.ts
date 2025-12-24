export type Priority = 'high' | 'medium' | 'low';

export interface Task {
  id: string;
  description: string;
  priority: Priority;
  createdAt: number;
  listId: string; // Reference to the list this task belongs to
}

export interface TodoList {
  id: string;
  name: string;
  createdAt: number;
}

export interface TaskState {
  lists: TodoList[];
  tasks: Task[];
  activeListId: string | null;
  error: string | null;
}

export type TaskAction =
  | { type: 'ADD_TASK'; payload: Omit<Task, 'id' | 'createdAt' | 'listId'> }
  | { type: 'DELETE_TASK'; payload: string }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'LOAD_TASKS'; payload: Task[] }
  | { type: 'CREATE_LIST'; payload: string }
  | { type: 'SWITCH_LIST'; payload: string }
  | { type: 'LOAD_STATE'; payload: TaskState };
