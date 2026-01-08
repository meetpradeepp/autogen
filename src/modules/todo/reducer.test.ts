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
      color: '#3B82F6',
      createdAt: Date.now(),
    };
    return {
      lists: [list],
      tasks: [],
      activeListId: list.id,
      activeView: 'dashboard',
      error: null,
      sortPreferences: {},
    };
  };

  describe('ADD_TASK action', () => {
    it('should add a valid task to the beginning of the list', () => {
      const state = createStateWithList();
      const action = {
        type: 'ADD_TASK' as const,
        payload: { title: 'Test task', priority: 'high' as const },
      };

      const newState = taskReducer(state, action);

      expect(newState.tasks).toHaveLength(1);
      expect(newState.tasks[0].title).toBe('Test task');
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
        title: 'Existing task',
        isCompleted: false,
        priority: 'low' as const,
        createdAt: Date.now(),
        listId: 'test-list-id',
      };
      state.tasks = [existingTask];
      const action = {
        type: 'ADD_TASK' as const,
        payload: { title: 'New task', priority: 'medium' as const },
      };

      const newState = taskReducer(state, action);

      expect(newState.tasks).toHaveLength(2);
      expect(newState.tasks[0].title).toBe('New task');
      expect(newState.tasks[1].title).toBe('Existing task');
    });

    it('should reject empty task title', () => {
      const state = createStateWithList();
      const action = {
        type: 'ADD_TASK' as const,
        payload: { title: '', priority: 'medium' as const },
      };

      const newState = taskReducer(state, action);

      expect(newState.tasks).toHaveLength(0);
      expect(newState.error).toBe('Task title cannot be empty');
    });

    it('should reject whitespace-only task title', () => {
      const state = createStateWithList();
      const action = {
        type: 'ADD_TASK' as const,
        payload: { title: '   ', priority: 'medium' as const },
      };

      const newState = taskReducer(state, action);

      expect(newState.tasks).toHaveLength(0);
      expect(newState.error).toBe('Task title cannot be empty');
    });

    it('should trim whitespace from task title', () => {
      const state = createStateWithList();
      const action = {
        type: 'ADD_TASK' as const,
        payload: { title: '  Task with spaces  ', priority: 'low' as const },
      };

      const newState = taskReducer(state, action);

      expect(newState.tasks[0].title).toBe('Task with spaces');
    });

    it('should reject task title exceeding 200 characters', () => {
      const state = createStateWithList();
      const longTitle = 'a'.repeat(201);
      const action = {
        type: 'ADD_TASK' as const,
        payload: { title: longDescription, priority: 'medium' as const },
      };

      const newState = taskReducer(state, action);

      expect(newState.tasks).toHaveLength(0);
      expect(newState.error).toBe('Task title too long (max 200 characters)');
    });

    it('should reject task when no active list is selected', () => {
      const state: TaskState = {
        lists: [],
        tasks: [],
        activeListId: null,
        activeView: 'dashboard',
        error: null,
        sortPreferences: {},
      };
      const action = {
        type: 'ADD_TASK' as const,
        payload: { title: 'Test task', priority: 'medium' as const },
      };

      const newState = taskReducer(state, action);

      expect(newState.tasks).toHaveLength(0);
      expect(newState.error).toBe('No active list selected');
    });

    it('should save state to localStorage on successful add', () => {
      const state = createStateWithList();
      const action = {
        type: 'ADD_TASK' as const,
        payload: { title: 'Persistent task', priority: 'high' as const },
      };

      taskReducer(state, action);

      const stored = localStorage.getItem('taskManagerState');
      expect(stored).toBeDefined();
      const parsedState = JSON.parse(stored!);
      expect(parsedState.tasks).toHaveLength(1);
      expect(parsedState.tasks[0].title).toBe('Persistent task');
    });

    it('should add task with optional dueDate', () => {
      const state = createStateWithList();
      const dueDate = Date.now() + 86400000; // 1 day from now
      const action = {
        type: 'ADD_TASK' as const,
        payload: { 
          title: 'Task with due date', 
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
        payload: { title: 'Task without due date', priority: 'medium' as const },
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
          title: 'Persistent due date task', 
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
        { id: '1', title: 'Task 1', isCompleted: false, priority: 'high' as const, createdAt: Date.now(), listId: 'test-list-id' },
        { id: '2', title: 'Task 2', isCompleted: false, priority: 'medium' as const, createdAt: Date.now(), listId: 'test-list-id' },
        { id: '3', title: 'Task 3', isCompleted: false, priority: 'low' as const, createdAt: Date.now(), listId: 'test-list-id' },
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
        { id: '1', title: 'Task 1', isCompleted: false, priority: 'high' as const, createdAt: Date.now(), listId: 'test-list-id' },
      ];
      state.tasks = tasks;
      const action = { type: 'DELETE_TASK' as const, payload: '1' };

      taskReducer(state, action);

      const stored = localStorage.getItem('taskManagerState');
      const parsedState = JSON.parse(stored!);
      expect(parsedState.tasks).toHaveLength(0);
    });
  });

  describe('UPDATE_TASK action', () => {
    it('should update task with matching ID', () => {
      const state = createStateWithList();
      const tasks = [
        { id: '1', title: 'Task 1', isCompleted: false, priority: 'high' as const, createdAt: Date.now(), listId: 'test-list-id' },
        { id: '2', title: 'Task 2', isCompleted: false, priority: 'medium' as const, createdAt: Date.now(), listId: 'test-list-id' },
      ];
      state.tasks = tasks;
      const action = {
        type: 'UPDATE_TASK' as const,
        payload: { id: '1', title: 'Updated Task 1', priority: 'low' as const },
      };

      const newState = taskReducer(state, action);

      expect(newState.tasks).toHaveLength(2);
      const updatedTask = newState.tasks.find(t => t.id === '1');
      expect(updatedTask?.title).toBe('Updated Task 1');
      expect(updatedTask?.priority).toBe('low');
      expect(newState.error).toBeNull();
    });

    it('should update task due date', () => {
      const state = createStateWithList();
      const tasks = [
        { id: '1', title: 'Task 1', isCompleted: false, priority: 'high' as const, createdAt: Date.now(), listId: 'test-list-id' },
      ];
      state.tasks = tasks;
      const dueDate = new Date('2026-01-15T10:00').getTime();
      const action = {
        type: 'UPDATE_TASK' as const,
        payload: { id: '1', title: 'Task 1', priority: 'high' as const, dueDate },
      };

      const newState = taskReducer(state, action);

      const updatedTask = newState.tasks.find(t => t.id === '1');
      expect(updatedTask?.dueDate).toBe(dueDate);
    });

    it('should return error if task not found', () => {
      const state = createStateWithList();
      const action = {
        type: 'UPDATE_TASK' as const,
        payload: { id: 'non-existent', title: 'Test', priority: 'high' as const },
      };

      const newState = taskReducer(state, action);

      expect(newState.error).toBe('Task not found');
      expect(newState.tasks).toEqual(state.tasks);
    });

    it('should validate task title', () => {
      const state = createStateWithList();
      const tasks = [
        { id: '1', title: 'Task 1', isCompleted: false, priority: 'high' as const, createdAt: Date.now(), listId: 'test-list-id' },
      ];
      state.tasks = tasks;
      const action = {
        type: 'UPDATE_TASK' as const,
        payload: { id: '1', title: '   ', priority: 'high' as const },
      };

      const newState = taskReducer(state, action);

      expect(newState.error).toBe('Task title cannot be empty');
    });

    it('should update localStorage after update', () => {
      const state = createStateWithList();
      const tasks = [
        { id: '1', title: 'Task 1', isCompleted: false, priority: 'high' as const, createdAt: Date.now(), listId: 'test-list-id' },
      ];
      state.tasks = tasks;
      const action = {
        type: 'UPDATE_TASK' as const,
        payload: { id: '1', title: 'Updated', priority: 'low' as const },
      };

      taskReducer(state, action);

      const stored = localStorage.getItem('taskManagerState');
      const parsedState = JSON.parse(stored!);
      expect(parsedState.tasks[0].title).toBe('Updated');
      expect(parsedState.tasks[0].priority).toBe('low');
    });
  });

  describe('CREATE_LIST action', () => {
    it('should create a new list and set it as active', () => {
      const state: TaskState = {
        lists: [],
        tasks: [],
        activeListId: null,
        activeView: 'dashboard',
        error: null,
        sortPreferences: {},
      };
      const action = { type: 'CREATE_LIST' as const, payload: { name: 'Work Tasks', color: '#3B82F6' } };

      const newState = taskReducer(state, action);

      expect(newState.lists).toHaveLength(1);
      expect(newState.lists[0].name).toBe('Work Tasks');
      expect(newState.lists[0].color).toBe('#3B82F6');
      expect(newState.lists[0].id).toBeDefined();
      expect(newState.activeListId).toBe(newState.lists[0].id);
      expect(newState.error).toBeNull();
    });

    it('should reject duplicate list names (case-insensitive)', () => {
      const state = createStateWithList('Work');
      const action = { type: 'CREATE_LIST' as const, payload: { name: 'work', color: '#10B981' } };

      const newState = taskReducer(state, action);

      expect(newState.lists).toHaveLength(1);
      expect(newState.error).toBe('List name must be unique');
    });

    it('should reject empty list name', () => {
      const state: TaskState = {
        lists: [],
        tasks: [],
        activeListId: null,
        activeView: 'dashboard',
        error: null,
        sortPreferences: {},
      };
      const action = { type: 'CREATE_LIST' as const, payload: { name: '   ', color: '#F59E0B' } };

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
        color: '#10B981',
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
        color: '#3B82F6',
        createdAt: Date.now(),
      };
      const list2: TodoList = {
        id: 'list-2',
        name: 'List 2',
        color: '#10B981',
        createdAt: Date.now(),
      };
      const state: TaskState = {
        lists: [list1, list2],
        tasks: [
          { id: 't1', title: 'Task 1', isCompleted: false, priority: 'high' as const, createdAt: Date.now(), listId: 'list-1' },
          { id: 't2', title: 'Task 2', isCompleted: false, priority: 'medium' as const, createdAt: Date.now(), listId: 'list-2' },
          { id: 't3', title: 'Task 3', isCompleted: false, priority: 'low' as const, createdAt: Date.now(), listId: 'list-1' },
        ],
        activeListId: 'list-2',
        activeView: 'dashboard',
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
        color: '#3B82F6',
        createdAt: Date.now(),
      };
      const list2: TodoList = {
        id: 'list-2',
        name: 'List 2',
        color: '#10B981',
        createdAt: Date.now(),
      };
      const state: TaskState = {
        lists: [list1, list2],
        tasks: [],
        activeListId: 'list-1',
        activeView: 'dashboard',
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
        color: '#3B82F6',
        createdAt: Date.now(),
      };
      const list2: TodoList = {
        id: 'list-2',
        name: 'List 2',
        color: '#10B981',
        createdAt: Date.now(),
      };
      const state: TaskState = {
        lists: [list1, list2],
        tasks: [],
        activeListId: 'list-1',
        activeView: 'dashboard',
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
        color: '#3B82F6',
        createdAt: Date.now(),
      };
      const list2: TodoList = {
        id: 'list-2',
        name: 'List 2',
        color: '#10B981',
        createdAt: Date.now(),
      };
      const state: TaskState = {
        lists: [list1, list2],
        tasks: [
          { id: 't1', title: 'Task 1', isCompleted: false, priority: 'high' as const, createdAt: Date.now(), listId: 'list-1' },
        ],
        activeListId: 'list-1',
        activeView: 'dashboard',
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
      const state: TaskState = { lists: [], tasks: [], activeListId: null, activeView: 'dashboard', error: null, sortPreferences: {} };
      const action = { type: 'SET_ERROR' as const, payload: 'Test error' };

      const newState = taskReducer(state, action);

      expect(newState.error).toBe('Test error');
    });
  });

  describe('CLEAR_ERROR action', () => {
    it('should clear error message', () => {
      const state: TaskState = { lists: [], tasks: [], activeListId: null, activeView: 'dashboard', error: 'Existing error', sortPreferences: {} };
      const action = { type: 'CLEAR_ERROR' as const };

      const newState = taskReducer(state, action);

      expect(newState.error).toBeNull();
    });
  });

  describe('SET_VIEW action', () => {
    it('should set view to calendar', () => {
      const state = createStateWithList();
      const action = { type: 'SET_VIEW' as const, payload: 'calendar' as const };

      const newState = taskReducer(state, action);

      expect(newState.activeView).toBe('calendar');
    });

    it('should set view to list', () => {
      const state = createStateWithList();
      state.activeView = 'calendar';
      const action = { type: 'SET_VIEW' as const, payload: 'dashboard' as const };

      const newState = taskReducer(state, action);

      expect(newState.activeView).toBe('dashboard');
    });
  });

  describe('loadState function', () => {
    it('should load state from localStorage', () => {
      const stateToStore = {
        lists: [{ id: '1', name: 'Test List', createdAt: Date.now() }],
        tasks: [{ id: '1', title: 'Stored task', isCompleted: false, priority: 'high' as const, createdAt: Date.now(), listId: '1' }],
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
        payload: { title: 'Test task', priority: 'medium' as const },
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
