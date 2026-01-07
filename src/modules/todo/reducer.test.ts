import { describe, it, expect, beforeEach, vi } from 'vitest';
import { taskReducer, loadState } from './reducer';
import { TaskState, TodoList } from './types';

describe('taskReducer', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  // Helper to create a state with a default list
  const createStateWithList = (listName = 'Test List'): TaskState => {
    const list: TodoList = {
      id: 'test-list-id',
      name: listName,
      createdAt: Date.now(),
    };
    return {
      lists: [list],
      tasks: [],
      activeListId: list.id,
      error: null,
      sortPreferences: {},
    };
  };

  describe('ADD_TASK action', () => {
    it('should add a valid task to the beginning of the list', () => {
      const state = createStateWithList();
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
      expect(newState.tasks[0].listId).toBe('test-list-id');
      expect(newState.error).toBeNull();
    });

    it('should prepend new task to existing tasks', () => {
      const state = createStateWithList();
      const existingTask = {
        id: '1',
        description: 'Existing task',
        priority: 'low' as const,
        createdAt: Date.now(),
        listId: 'test-list-id',
      };
      state.tasks = [existingTask];
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
      const state = createStateWithList();
      const action = {
        type: 'ADD_TASK' as const,
        payload: { description: '', priority: 'medium' as const },
      };

      const newState = taskReducer(state, action);

      expect(newState.tasks).toHaveLength(0);
      expect(newState.error).toBe('Task cannot be empty');
    });

    it('should reject whitespace-only task description', () => {
      const state = createStateWithList();
      const action = {
        type: 'ADD_TASK' as const,
        payload: { description: '   ', priority: 'medium' as const },
      };

      const newState = taskReducer(state, action);

      expect(newState.tasks).toHaveLength(0);
      expect(newState.error).toBe('Task cannot be empty');
    });

    it('should trim whitespace from task description', () => {
      const state = createStateWithList();
      const action = {
        type: 'ADD_TASK' as const,
        payload: { description: '  Task with spaces  ', priority: 'low' as const },
      };

      const newState = taskReducer(state, action);

      expect(newState.tasks[0].description).toBe('Task with spaces');
    });

    it('should reject task description exceeding 500 characters', () => {
      const state = createStateWithList();
      const longDescription = 'a'.repeat(501);
      const action = {
        type: 'ADD_TASK' as const,
        payload: { description: longDescription, priority: 'medium' as const },
      };

      const newState = taskReducer(state, action);

      expect(newState.tasks).toHaveLength(0);
      expect(newState.error).toBe('Task description too long (max 500 characters)');
    });

    it('should reject task when no active list is selected', () => {
      const state: TaskState = {
        lists: [],
        tasks: [],
        activeListId: null,
        error: null,
        sortPreferences: {},
      };
      const action = {
        type: 'ADD_TASK' as const,
        payload: { description: 'Test task', priority: 'medium' as const },
      };

      const newState = taskReducer(state, action);

      expect(newState.tasks).toHaveLength(0);
      expect(newState.error).toBe('No active list selected');
    });

    it('should save state to localStorage on successful add', () => {
      const state = createStateWithList();
      const action = {
        type: 'ADD_TASK' as const,
        payload: { description: 'Persistent task', priority: 'high' as const },
      };

      taskReducer(state, action);

      const stored = localStorage.getItem('taskManagerState');
      expect(stored).toBeDefined();
      const parsedState = JSON.parse(stored!);
      expect(parsedState.tasks).toHaveLength(1);
      expect(parsedState.tasks[0].description).toBe('Persistent task');
    });

    it('should add task with optional dueDate', () => {
      const state = createStateWithList();
      const dueDate = Date.now() + 86400000; // 1 day from now
      const action = {
        type: 'ADD_TASK' as const,
        payload: { 
          description: 'Task with due date', 
          priority: 'high' as const,
          dueDate,
        },
      };

      const newState = taskReducer(state, action);

      expect(newState.tasks).toHaveLength(1);
      expect(newState.tasks[0].dueDate).toBe(dueDate);
      expect(newState.error).toBeNull();
    });

    it('should add task without dueDate when not provided', () => {
      const state = createStateWithList();
      const action = {
        type: 'ADD_TASK' as const,
        payload: { description: 'Task without due date', priority: 'medium' as const },
      };

      const newState = taskReducer(state, action);

      expect(newState.tasks).toHaveLength(1);
      expect(newState.tasks[0].dueDate).toBeUndefined();
      expect(newState.error).toBeNull();
    });

    it('should persist dueDate to localStorage', () => {
      const state = createStateWithList();
      const dueDate = Date.now() + 86400000;
      const action = {
        type: 'ADD_TASK' as const,
        payload: { 
          description: 'Persistent due date task', 
          priority: 'low' as const,
          dueDate,
        },
      };

      taskReducer(state, action);

      const stored = localStorage.getItem('taskManagerState');
      expect(stored).toBeDefined();
      const parsedState = JSON.parse(stored!);
      expect(parsedState.tasks[0].dueDate).toBe(dueDate);
    });
  });

  describe('DELETE_TASK action', () => {
    it('should remove task with matching ID', () => {
      const state = createStateWithList();
      const tasks = [
        { id: '1', description: 'Task 1', priority: 'high' as const, createdAt: Date.now(), listId: 'test-list-id' },
        { id: '2', description: 'Task 2', priority: 'medium' as const, createdAt: Date.now(), listId: 'test-list-id' },
        { id: '3', description: 'Task 3', priority: 'low' as const, createdAt: Date.now(), listId: 'test-list-id' },
      ];
      state.tasks = tasks;
      const action = { type: 'DELETE_TASK' as const, payload: '2' };

      const newState = taskReducer(state, action);

      expect(newState.tasks).toHaveLength(2);
      expect(newState.tasks.find(t => t.id === '2')).toBeUndefined();
      expect(newState.tasks.find(t => t.id === '1')).toBeDefined();
      expect(newState.tasks.find(t => t.id === '3')).toBeDefined();
    });

    it('should update localStorage after deletion', () => {
      const state = createStateWithList();
      const tasks = [
        { id: '1', description: 'Task 1', priority: 'high' as const, createdAt: Date.now(), listId: 'test-list-id' },
      ];
      state.tasks = tasks;
      const action = { type: 'DELETE_TASK' as const, payload: '1' };

      taskReducer(state, action);

      const stored = localStorage.getItem('taskManagerState');
      const parsedState = JSON.parse(stored!);
      expect(parsedState.tasks).toHaveLength(0);
    });
  });

  describe('CREATE_LIST action', () => {
    it('should create a new list and set it as active', () => {
      const state: TaskState = {
        lists: [],
        tasks: [],
        activeListId: null,
        error: null,
        sortPreferences: {},
      };
      const action = { type: 'CREATE_LIST' as const, payload: 'Work Tasks' };

      const newState = taskReducer(state, action);

      expect(newState.lists).toHaveLength(1);
      expect(newState.lists[0].name).toBe('Work Tasks');
      expect(newState.lists[0].id).toBeDefined();
      expect(newState.activeListId).toBe(newState.lists[0].id);
      expect(newState.error).toBeNull();
    });

    it('should reject duplicate list names (case-insensitive)', () => {
      const state = createStateWithList('Work');
      const action = { type: 'CREATE_LIST' as const, payload: 'work' };

      const newState = taskReducer(state, action);

      expect(newState.lists).toHaveLength(1);
      expect(newState.error).toBe('List name must be unique');
    });

    it('should reject empty list name', () => {
      const state: TaskState = {
        lists: [],
        tasks: [],
        activeListId: null,
        error: null,
        sortPreferences: {},
      };
      const action = { type: 'CREATE_LIST' as const, payload: '   ' };

      const newState = taskReducer(state, action);

      expect(newState.lists).toHaveLength(0);
      expect(newState.error).toBe('List name cannot be empty');
    });
  });

  describe('SWITCH_LIST action', () => {
    it('should switch to the specified list', () => {
      const state = createStateWithList();
      const secondList: TodoList = {
        id: 'second-list-id',
        name: 'Second List',
        createdAt: Date.now(),
      };
      state.lists.push(secondList);

      const action = { type: 'SWITCH_LIST' as const, payload: 'second-list-id' };
      const newState = taskReducer(state, action);

      expect(newState.activeListId).toBe('second-list-id');
    });
  });

  describe('DELETE_LIST action', () => {
    it('should delete a list and all associated tasks', () => {
      const list1: TodoList = {
        id: 'list-1',
        name: 'List 1',
        createdAt: Date.now(),
      };
      const list2: TodoList = {
        id: 'list-2',
        name: 'List 2',
        createdAt: Date.now(),
      };
      const state: TaskState = {
        lists: [list1, list2],
        tasks: [
          { id: 't1', description: 'Task 1', priority: 'high' as const, createdAt: Date.now(), listId: 'list-1' },
          { id: 't2', description: 'Task 2', priority: 'medium' as const, createdAt: Date.now(), listId: 'list-2' },
          { id: 't3', description: 'Task 3', priority: 'low' as const, createdAt: Date.now(), listId: 'list-1' },
        ],
        activeListId: 'list-2',
        error: null,
        sortPreferences: {},
      };

      const action = { type: 'DELETE_LIST' as const, payload: 'list-1' };
      const newState = taskReducer(state, action);

      expect(newState.lists).toHaveLength(1);
      expect(newState.lists[0].id).toBe('list-2');
      expect(newState.tasks).toHaveLength(1);
      expect(newState.tasks[0].id).toBe('t2');
      expect(newState.activeListId).toBe('list-2');
      expect(newState.error).toBeNull();
    });

    it('should allow deletion of the last list (zero-list state)', () => {
      const state = createStateWithList();
      const action = { type: 'DELETE_LIST' as const, payload: state.lists[0].id };

      const newState = taskReducer(state, action);

      expect(newState.lists).toHaveLength(0);
      expect(newState.activeListId).toBeNull();
      expect(newState.error).toBeNull();
    });

    it('should switch active list when deleting the active list', () => {
      const list1: TodoList = {
        id: 'list-1',
        name: 'List 1',
        createdAt: Date.now(),
      };
      const list2: TodoList = {
        id: 'list-2',
        name: 'List 2',
        createdAt: Date.now(),
      };
      const state: TaskState = {
        lists: [list1, list2],
        tasks: [],
        activeListId: 'list-1',
        error: null,
        sortPreferences: {},
      };

      const action = { type: 'DELETE_LIST' as const, payload: 'list-1' };
      const newState = taskReducer(state, action);

      expect(newState.lists).toHaveLength(1);
      expect(newState.activeListId).toBe('list-2');
    });

    it('should not change active list when deleting a non-active list', () => {
      const list1: TodoList = {
        id: 'list-1',
        name: 'List 1',
        createdAt: Date.now(),
      };
      const list2: TodoList = {
        id: 'list-2',
        name: 'List 2',
        createdAt: Date.now(),
      };
      const state: TaskState = {
        lists: [list1, list2],
        tasks: [],
        activeListId: 'list-1',
        error: null,
        sortPreferences: {},
      };

      const action = { type: 'DELETE_LIST' as const, payload: 'list-2' };
      const newState = taskReducer(state, action);

      expect(newState.lists).toHaveLength(1);
      expect(newState.activeListId).toBe('list-1');
    });

    it('should update localStorage after deletion', () => {
      const list1: TodoList = {
        id: 'list-1',
        name: 'List 1',
        createdAt: Date.now(),
      };
      const list2: TodoList = {
        id: 'list-2',
        name: 'List 2',
        createdAt: Date.now(),
      };
      const state: TaskState = {
        lists: [list1, list2],
        tasks: [
          { id: 't1', description: 'Task 1', priority: 'high' as const, createdAt: Date.now(), listId: 'list-1' },
        ],
        activeListId: 'list-1',
        error: null,
        sortPreferences: {},
      };

      const action = { type: 'DELETE_LIST' as const, payload: 'list-1' };
      taskReducer(state, action);

      const stored = localStorage.getItem('taskManagerState');
      expect(stored).toBeDefined();
      const parsedState = JSON.parse(stored!);
      expect(parsedState.lists).toHaveLength(1);
      expect(parsedState.tasks).toHaveLength(0);
      expect(parsedState.activeListId).toBe('list-2');
    });
  });

  describe('SET_ERROR action', () => {
    it('should set error message', () => {
      const state: TaskState = { lists: [], tasks: [], activeListId: null, error: null, sortPreferences: {} };
      const action = { type: 'SET_ERROR' as const, payload: 'Test error' };

      const newState = taskReducer(state, action);

      expect(newState.error).toBe('Test error');
    });
  });

  describe('CLEAR_ERROR action', () => {
    it('should clear error message', () => {
      const state: TaskState = { lists: [], tasks: [], activeListId: null, error: 'Existing error', sortPreferences: {} };
      const action = { type: 'CLEAR_ERROR' as const };

      const newState = taskReducer(state, action);

      expect(newState.error).toBeNull();
    });
  });

  describe('loadState function', () => {
    it('should load state from localStorage', () => {
      const stateToStore = {
        lists: [{ id: '1', name: 'Test List', createdAt: Date.now() }],
        tasks: [{ id: '1', description: 'Stored task', priority: 'high' as const, createdAt: Date.now(), listId: '1' }],
        activeListId: '1',
      };
      localStorage.setItem('taskManagerState', JSON.stringify(stateToStore));

      const loaded = loadState();

      expect(loaded.lists).toHaveLength(1);
      expect(loaded.tasks).toHaveLength(1);
      expect(loaded.activeListId).toBe('1');
    });

    it('should return empty state if localStorage is empty', () => {
      const loaded = loadState();

      expect(loaded.lists).toEqual([]);
      expect(loaded.tasks).toEqual([]);
      expect(loaded.activeListId).toBeNull();
    });

    it('should migrate legacy tasks to "General" list', () => {
      const legacyTasks = [
        { id: '1', description: 'Legacy task 1', priority: 'high' as const, createdAt: Date.now() },
        { id: '2', description: 'Legacy task 2', priority: 'low' as const, createdAt: Date.now() },
      ];
      localStorage.setItem('tasks', JSON.stringify(legacyTasks));

      const loaded = loadState();

      expect(loaded.lists).toHaveLength(1);
      expect(loaded.lists[0].name).toBe('General');
      expect(loaded.tasks).toHaveLength(2);
      expect(loaded.tasks[0].listId).toBe(loaded.lists[0].id);
      expect(loaded.tasks[1].listId).toBe(loaded.lists[0].id);
      expect(loaded.activeListId).toBe(loaded.lists[0].id);
      
      // Verify legacy key is removed
      expect(localStorage.getItem('tasks')).toBeNull();
    });

    it('should return empty state if localStorage contains invalid JSON', () => {
      localStorage.setItem('taskManagerState', 'invalid json');

      const loaded = loadState();

      expect(loaded.lists).toEqual([]);
      expect(loaded.tasks).toEqual([]);
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

      const state = createStateWithList();
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
