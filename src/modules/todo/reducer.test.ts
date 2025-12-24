import { describe, it, expect, beforeEach, vi } from 'vitest';
import { taskReducer, loadTasks } from './reducer';
import { TaskState } from './types';

describe('taskReducer', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('ADD_TASK action', () => {
    it('should add a valid task to the beginning of the list', () => {
      const state: TaskState = { tasks: [], error: null };
      const action = {
        type: 'ADD_TASK' as const,
        payload: { description: 'Test task', priority: 'high' as const },
      };

      const newState = taskReducer(state, action);

      expect(newState.tasks).toHaveLength(1);
      expect(newState.tasks[0].description).toBe('Test task');
      expect(newState.tasks[0].priority).toBe('high');
      expect(newState.tasks[0].id).toBeDefined();
      expect(newState.tasks[0].createdAt).toBeDefined();
      expect(newState.error).toBeNull();
    });

    it('should prepend new task to existing tasks', () => {
      const existingTask = {
        id: '1',
        description: 'Existing task',
        priority: 'low' as const,
        createdAt: Date.now(),
      };
      const state: TaskState = { tasks: [existingTask], error: null };
      const action = {
        type: 'ADD_TASK' as const,
        payload: { description: 'New task', priority: 'medium' as const },
      };

      const newState = taskReducer(state, action);

      expect(newState.tasks).toHaveLength(2);
      expect(newState.tasks[0].description).toBe('New task');
      expect(newState.tasks[1].description).toBe('Existing task');
    });

    it('should reject empty task description', () => {
      const state: TaskState = { tasks: [], error: null };
      const action = {
        type: 'ADD_TASK' as const,
        payload: { description: '', priority: 'medium' as const },
      };

      const newState = taskReducer(state, action);

      expect(newState.tasks).toHaveLength(0);
      expect(newState.error).toBe('Task cannot be empty');
    });

    it('should reject whitespace-only task description', () => {
      const state: TaskState = { tasks: [], error: null };
      const action = {
        type: 'ADD_TASK' as const,
        payload: { description: '   ', priority: 'medium' as const },
      };

      const newState = taskReducer(state, action);

      expect(newState.tasks).toHaveLength(0);
      expect(newState.error).toBe('Task cannot be empty');
    });

    it('should trim whitespace from task description', () => {
      const state: TaskState = { tasks: [], error: null };
      const action = {
        type: 'ADD_TASK' as const,
        payload: { description: '  Task with spaces  ', priority: 'low' as const },
      };

      const newState = taskReducer(state, action);

      expect(newState.tasks[0].description).toBe('Task with spaces');
    });

    it('should reject task description exceeding 500 characters', () => {
      const state: TaskState = { tasks: [], error: null };
      const longDescription = 'a'.repeat(501);
      const action = {
        type: 'ADD_TASK' as const,
        payload: { description: longDescription, priority: 'medium' as const },
      };

      const newState = taskReducer(state, action);

      expect(newState.tasks).toHaveLength(0);
      expect(newState.error).toBe('Task description too long (max 500 characters)');
    });

    it('should save tasks to localStorage on successful add', () => {
      const state: TaskState = { tasks: [], error: null };
      const action = {
        type: 'ADD_TASK' as const,
        payload: { description: 'Persistent task', priority: 'high' as const },
      };

      taskReducer(state, action);

      const stored = localStorage.getItem('tasks');
      expect(stored).toBeDefined();
      const parsedTasks = JSON.parse(stored!);
      expect(parsedTasks).toHaveLength(1);
      expect(parsedTasks[0].description).toBe('Persistent task');
    });
  });

  describe('DELETE_TASK action', () => {
    it('should remove task with matching ID', () => {
      const tasks = [
        { id: '1', description: 'Task 1', priority: 'high' as const, createdAt: Date.now() },
        { id: '2', description: 'Task 2', priority: 'medium' as const, createdAt: Date.now() },
        { id: '3', description: 'Task 3', priority: 'low' as const, createdAt: Date.now() },
      ];
      const state: TaskState = { tasks, error: null };
      const action = { type: 'DELETE_TASK' as const, payload: '2' };

      const newState = taskReducer(state, action);

      expect(newState.tasks).toHaveLength(2);
      expect(newState.tasks.find(t => t.id === '2')).toBeUndefined();
      expect(newState.tasks.find(t => t.id === '1')).toBeDefined();
      expect(newState.tasks.find(t => t.id === '3')).toBeDefined();
    });

    it('should update localStorage after deletion', () => {
      const tasks = [
        { id: '1', description: 'Task 1', priority: 'high' as const, createdAt: Date.now() },
      ];
      const state: TaskState = { tasks, error: null };
      const action = { type: 'DELETE_TASK' as const, payload: '1' };

      taskReducer(state, action);

      const stored = localStorage.getItem('tasks');
      const parsedTasks = JSON.parse(stored!);
      expect(parsedTasks).toHaveLength(0);
    });
  });

  describe('SET_ERROR action', () => {
    it('should set error message', () => {
      const state: TaskState = { tasks: [], error: null };
      const action = { type: 'SET_ERROR' as const, payload: 'Test error' };

      const newState = taskReducer(state, action);

      expect(newState.error).toBe('Test error');
    });
  });

  describe('CLEAR_ERROR action', () => {
    it('should clear error message', () => {
      const state: TaskState = { tasks: [], error: 'Existing error' };
      const action = { type: 'CLEAR_ERROR' as const };

      const newState = taskReducer(state, action);

      expect(newState.error).toBeNull();
    });
  });

  describe('LOAD_TASKS action', () => {
    it('should load tasks from payload', () => {
      const state: TaskState = { tasks: [], error: null };
      const tasksToLoad = [
        { id: '1', description: 'Loaded task', priority: 'medium' as const, createdAt: Date.now() },
      ];
      const action = { type: 'LOAD_TASKS' as const, payload: tasksToLoad };

      const newState = taskReducer(state, action);

      expect(newState.tasks).toEqual(tasksToLoad);
    });
  });

  describe('loadTasks function', () => {
    it('should load tasks from localStorage', () => {
      const tasks = [
        { id: '1', description: 'Stored task', priority: 'high' as const, createdAt: Date.now() },
      ];
      localStorage.setItem('tasks', JSON.stringify(tasks));

      const loaded = loadTasks();

      expect(loaded).toEqual(tasks);
    });

    it('should return empty array if localStorage is empty', () => {
      const loaded = loadTasks();

      expect(loaded).toEqual([]);
    });

    it('should return empty array if localStorage contains invalid JSON', () => {
      localStorage.setItem('tasks', 'invalid json');

      const loaded = loadTasks();

      expect(loaded).toEqual([]);
    });
  });

  describe('localStorage error handling', () => {
    it('should handle localStorage.setItem failure gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      // Mock localStorage.setItem to throw
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = vi.fn(() => {
        throw new Error('QuotaExceededError');
      });

      const state: TaskState = { tasks: [], error: null };
      const action = {
        type: 'ADD_TASK' as const,
        payload: { description: 'Test task', priority: 'medium' as const },
      };

      const newState = taskReducer(state, action);

      // Task should still be added to state
      expect(newState.tasks).toHaveLength(1);
      expect(newState.error).toBeNull();
      expect(consoleSpy).toHaveBeenCalled();

      // Restore
      localStorage.setItem = originalSetItem;
      consoleSpy.mockRestore();
    });
  });
});
