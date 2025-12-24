export type Priority = 'high' | 'medium' | 'low';

export interface Task {
  id: string;
  description: string;
  priority: Priority;
  createdAt: number;
}

export interface TaskState {
  tasks: Task[];
  error: string | null;
}

export type TaskAction =
  | { type: 'ADD_TASK'; payload: Omit<Task, 'id' | 'createdAt'> }
  | { type: 'DELETE_TASK'; payload: string }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'LOAD_TASKS'; payload: Task[] };
