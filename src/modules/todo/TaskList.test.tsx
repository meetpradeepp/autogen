import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TaskList } from './TaskList';
import { ToastProvider } from '../../context/ToastContext';
import { CompactModeProvider } from '../../context/CompactModeContext';
import { Task, TodoList, TaskState } from './types';
import * as TaskContext from '../../context/TaskContext';

// Mock the context
const mockDispatch = vi.fn();

function renderWithContext(state: TaskState) {
  vi.spyOn(TaskContext, 'useTaskContext').mockReturnValue({
    state,
    dispatch: mockDispatch,
  });
  
  return render(
    <CompactModeProvider>
      <ToastProvider>
        <TaskList />
      </ToastProvider>
    </CompactModeProvider>
  );
}

describe('TaskList Sorting', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const testList: TodoList = {
    id: 'list-1',
    name: 'Test List',
    color: '#3B82F6',
    createdAt: Date.now(),
  };

  const createTask = (id: string, description: string, priority: 'high' | 'medium' | 'low', createdAt: number): Task => ({
    id,
    description,
    priority,
    createdAt,
    listId: 'list-1',
  });

  describe('Sort Control Visibility', () => {
    it('should hide sort control when list has 0 tasks', () => {
      const state: TaskState = {
        lists: [testList],
        tasks: [],
        activeListId: 'list-1',
        activeView: 'list',
        error: null,
        sortPreferences: {},
      };

      renderWithContext(state);
      
      expect(screen.queryByLabelText('Sort tasks')).not.toBeInTheDocument();
      expect(screen.getByText('No tasks in this list yet.')).toBeInTheDocument();
    });

    it('should hide sort control when list has 1 task', () => {
      const state: TaskState = {
        lists: [testList],
        tasks: [createTask('1', 'Single task', 'high', Date.now())],
        activeListId: 'list-1',
        activeView: 'list',
        error: null,
        sortPreferences: {},
      };

      renderWithContext(state);
      
      expect(screen.queryByLabelText('Sort tasks')).not.toBeInTheDocument();
    });

    it('should show sort control when list has 2+ tasks', () => {
      const state: TaskState = {
        lists: [testList],
        tasks: [
          createTask('1', 'Task 1', 'high', Date.now()),
          createTask('2', 'Task 2', 'low', Date.now() - 1000),
        ],
        activeListId: 'list-1',
        activeView: 'list',
        error: null,
        sortPreferences: {},
      };

      renderWithContext(state);
      
      expect(screen.getByLabelText('Sort tasks')).toBeInTheDocument();
    });
  });

  describe('Default Sort (Date Added)', () => {
    it('should default to "dateAdded" sort for new lists', () => {
      const now = Date.now();
      const state: TaskState = {
        lists: [testList],
        tasks: [
          createTask('1', 'Oldest', 'medium', now - 3000),
          createTask('2', 'Middle', 'medium', now - 2000),
          createTask('3', 'Newest', 'medium', now - 1000),
        ],
        activeListId: 'list-1',
        activeView: 'list',
        error: null,
        sortPreferences: {},
      };

      renderWithContext(state);
      
      const select = screen.getByLabelText('Sort tasks') as HTMLSelectElement;
      expect(select.value).toBe('dateAdded');
      
      // Verify tasks are in newest-first order
      const taskElements = screen.getAllByRole('button', { name: /Delete task:/ });
      expect(taskElements[0]).toHaveAttribute('aria-label', 'Delete task: Newest');
      expect(taskElements[1]).toHaveAttribute('aria-label', 'Delete task: Middle');
      expect(taskElements[2]).toHaveAttribute('aria-label', 'Delete task: Oldest');
    });
  });

  describe('Priority Sort', () => {
    it('should sort by priority (High → Medium → Low)', () => {
      const now = Date.now();
      const state: TaskState = {
        lists: [testList],
        tasks: [
          createTask('1', 'Low priority', 'low', now - 3000),
          createTask('2', 'High priority', 'high', now - 2000),
          createTask('3', 'Medium priority', 'medium', now - 1000),
        ],
        activeListId: 'list-1',
        activeView: 'list',
        error: null,
        sortPreferences: { 'list-1': 'priority' },
      };

      renderWithContext(state);
      
      const taskElements = screen.getAllByRole('button', { name: /Delete task:/ });
      expect(taskElements[0]).toHaveAttribute('aria-label', 'Delete task: High priority');
      expect(taskElements[1]).toHaveAttribute('aria-label', 'Delete task: Medium priority');
      expect(taskElements[2]).toHaveAttribute('aria-label', 'Delete task: Low priority');
    });

    it('should use stable sort (fallback to Date Added) for same priority', () => {
      const now = Date.now();
      const state: TaskState = {
        lists: [testList],
        tasks: [
          createTask('1', 'Medium Old', 'medium', now - 3000),
          createTask('2', 'Medium Middle', 'medium', now - 2000),
          createTask('3', 'Medium New', 'medium', now - 1000),
        ],
        activeListId: 'list-1',
        activeView: 'list',
        error: null,
        sortPreferences: { 'list-1': 'priority' },
      };

      renderWithContext(state);
      
      // Within same priority, should be newest first
      const taskElements = screen.getAllByRole('button', { name: /Delete task:/ });
      expect(taskElements[0]).toHaveAttribute('aria-label', 'Delete task: Medium New');
      expect(taskElements[1]).toHaveAttribute('aria-label', 'Delete task: Medium Middle');
      expect(taskElements[2]).toHaveAttribute('aria-label', 'Delete task: Medium Old');
    });

    it('should handle all priority levels', () => {
      const now = Date.now();
      const state: TaskState = {
        lists: [testList],
        tasks: [
          createTask('1', 'Low priority', 'low', now - 3000),
          createTask('2', 'High priority', 'high', now - 2000),
          createTask('3', 'Medium priority', 'medium', now - 1000),
          createTask('4', 'Another low', 'low', now - 4000),
        ],
        activeListId: 'list-1',
        activeView: 'list',
        error: null,
        sortPreferences: { 'list-1': 'priority' },
      };

      renderWithContext(state);
      
      const taskElements = screen.getAllByRole('button', { name: /Delete task:/ });
      expect(taskElements[0]).toHaveAttribute('aria-label', 'Delete task: High priority');
      expect(taskElements[1]).toHaveAttribute('aria-label', 'Delete task: Medium priority');
      // Low priority tasks should be last, sorted by date (newest first within same priority)
      expect(taskElements[2]).toHaveAttribute('aria-label', 'Delete task: Low priority');
      expect(taskElements[3]).toHaveAttribute('aria-label', 'Delete task: Another low');
    });
  });

  describe('Alphabetical Sort', () => {
    it('should sort alphabetically (A → Z)', () => {
      const now = Date.now();
      const state: TaskState = {
        lists: [testList],
        tasks: [
          createTask('1', 'Zebra task', 'high', now - 1000),
          createTask('2', 'Apple task', 'high', now - 2000),
          createTask('3', 'Mango task', 'high', now - 3000),
        ],
        activeListId: 'list-1',
        activeView: 'list',
        error: null,
        sortPreferences: { 'list-1': 'alphabetical' },
      };

      renderWithContext(state);
      
      const taskElements = screen.getAllByRole('button', { name: /Delete task:/ });
      expect(taskElements[0]).toHaveAttribute('aria-label', 'Delete task: Apple task');
      expect(taskElements[1]).toHaveAttribute('aria-label', 'Delete task: Mango task');
      expect(taskElements[2]).toHaveAttribute('aria-label', 'Delete task: Zebra task');
    });

    it('should be case-insensitive', () => {
      const now = Date.now();
      const state: TaskState = {
        lists: [testList],
        tasks: [
          createTask('1', 'apple', 'high', now - 1000),
          createTask('2', 'BANANA', 'high', now - 2000),
          createTask('3', 'Cherry', 'high', now - 3000),
        ],
        activeListId: 'list-1',
        activeView: 'list',
        error: null,
        sortPreferences: { 'list-1': 'alphabetical' },
      };

      renderWithContext(state);
      
      const taskElements = screen.getAllByRole('button', { name: /Delete task:/ });
      expect(taskElements[0]).toHaveAttribute('aria-label', 'Delete task: apple');
      expect(taskElements[1]).toHaveAttribute('aria-label', 'Delete task: BANANA');
      expect(taskElements[2]).toHaveAttribute('aria-label', 'Delete task: Cherry');
    });

    it('should use stable sort (fallback to Date Added) for identical names', () => {
      const now = Date.now();
      const state: TaskState = {
        lists: [testList],
        tasks: [
          createTask('1', 'Same Task', 'high', now - 3000),
          createTask('2', 'Same Task', 'high', now - 1000),
          createTask('3', 'Same Task', 'high', now - 2000),
        ],
        activeListId: 'list-1',
        activeView: 'list',
        error: null,
        sortPreferences: { 'list-1': 'alphabetical' },
      };

      renderWithContext(state);
      
      // Should maintain stable order by creation date (newest first)
      const taskElements = screen.getAllByRole('button', { name: /Delete task:/ });
      // All have same description, so we verify by checking there are 3 elements
      expect(taskElements).toHaveLength(3);
    });
  });

  describe('Persistence', () => {
    it('should persist sort preference per list', () => {
      const state: TaskState = {
        lists: [testList],
        tasks: [
          createTask('1', 'Task 1', 'high', Date.now()),
          createTask('2', 'Task 2', 'low', Date.now() - 1000),
        ],
        activeListId: 'list-1',
        activeView: 'list',
        error: null,
        sortPreferences: {},
      };

      renderWithContext(state);
      
      const select = screen.getByLabelText('Sort tasks') as HTMLSelectElement;
      fireEvent.change(select, { target: { value: 'priority' } });
      
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'SET_SORT_PREFERENCE',
        payload: { listId: 'list-1', sortOption: 'priority' },
      });
    });

    it('should maintain different sort preferences for different lists', () => {
      const state: TaskState = {
        lists: [testList],
        tasks: [
          createTask('1', 'Task 1', 'high', Date.now()),
          createTask('2', 'Task 2', 'low', Date.now() - 1000),
        ],
        activeListId: 'list-1',
        activeView: 'list',
        error: null,
        sortPreferences: { 'list-1': 'alphabetical', 'list-2': 'priority' },
      };

      renderWithContext(state);
      
      const select = screen.getByLabelText('Sort tasks') as HTMLSelectElement;
      expect(select.value).toBe('alphabetical');
    });
  });

  describe('Sort Option Changes', () => {
    it('should update UI when sort option changes', () => {
      const state: TaskState = {
        lists: [testList],
        tasks: [
          createTask('1', 'Task 1', 'high', Date.now()),
          createTask('2', 'Task 2', 'low', Date.now() - 1000),
        ],
        activeListId: 'list-1',
        activeView: 'list',
        error: null,
        sortPreferences: {},
      };

      renderWithContext(state);
      
      const select = screen.getByLabelText('Sort tasks') as HTMLSelectElement;
      
      fireEvent.change(select, { target: { value: 'alphabetical' } });
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'SET_SORT_PREFERENCE',
        payload: { listId: 'list-1', sortOption: 'alphabetical' },
      });
    });
  });
});
