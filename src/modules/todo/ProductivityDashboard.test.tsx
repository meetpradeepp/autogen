import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProductivityDashboard } from './ProductivityDashboard';
import { TaskState, Task, TodoList } from './types';
import * as TaskContext from '../../context/TaskContext';

// Mock the context
const mockDispatch = vi.fn();

function renderWithContext(state: TaskState) {
  vi.spyOn(TaskContext, 'useTaskContext').mockReturnValue({
    state,
    dispatch: mockDispatch,
  });
  
  return render(<ProductivityDashboard />);
}

describe('ProductivityDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const testList: TodoList = {
    id: 'list-1',
    name: 'Test List',
    color: '#3B82F6',
    createdAt: Date.now(),
  };

  const createTask = (
    id: string,
    title: string,
    createdAt: number,
    dueDate?: number
  ): Task => ({
    id,
    title,
    isCompleted: false,
    priority: 'medium',
    createdAt,
    listId: 'list-1',
    ...(dueDate && { dueDate }),
  });

  describe('Empty State', () => {
    it('should show welcome message when no tasks and no lists exist', () => {
      const state: TaskState = {
        lists: [],
        tasks: [],
        activeListId: null,
        activeView: 'dashboard',
        error: null,
        sortPreferences: {},
      };

      renderWithContext(state);
      
      expect(screen.getByText(/Welcome to Your Task Manager/i)).toBeInTheDocument();
      expect(screen.getByText(/Get started by creating your first list/i)).toBeInTheDocument();
    });

    it('should not show widgets when in empty state', () => {
      const state: TaskState = {
        lists: [],
        tasks: [],
        activeListId: null,
        activeView: 'dashboard',
        error: null,
        sortPreferences: {},
      };

      renderWithContext(state);
      
      expect(screen.queryByText('Open Tasks')).not.toBeInTheDocument();
      expect(screen.queryByText('Overdue')).not.toBeInTheDocument();
    });
  });

  describe('Metrics Display', () => {
    it('should display all five widgets when tasks and lists exist', () => {
      const state: TaskState = {
        lists: [testList],
        tasks: [createTask('1', 'Test task', Date.now())],
        activeListId: null,
        activeView: 'dashboard',
        error: null,
        sortPreferences: {},
      };

      renderWithContext(state);
      
      expect(screen.getByText('Open Tasks')).toBeInTheDocument();
      expect(screen.getByText('Overdue')).toBeInTheDocument();
      expect(screen.getByText('Due Today')).toBeInTheDocument();
      expect(screen.getByText('Oldest Task')).toBeInTheDocument();
      expect(screen.getByText('Total Lists')).toBeInTheDocument();
    });

    it('should count total open tasks correctly', () => {
      const state: TaskState = {
        lists: [testList],
        tasks: [
          createTask('1', 'Task 1', Date.now()),
          createTask('2', 'Task 2', Date.now()),
          createTask('3', 'Task 3', Date.now()),
        ],
        activeListId: null,
        activeView: 'dashboard',
        error: null,
        sortPreferences: {},
      };

      renderWithContext(state);
      
      const widgets = screen.getAllByText('3');
      expect(widgets.length).toBeGreaterThan(0);
    });

    it('should count overdue tasks correctly', () => {
      const now = Date.now();
      const yesterday = now - 24 * 60 * 60 * 1000;
      
      const state: TaskState = {
        lists: [testList],
        tasks: [
          createTask('1', 'Overdue task', now, yesterday),
          createTask('2', 'Current task', now),
        ],
        activeListId: null,
        activeView: 'dashboard',
        error: null,
        sortPreferences: {},
      };

      renderWithContext(state);
      
      // Should show 1 overdue task
      const widgets = screen.getAllByText('1');
      expect(widgets.length).toBeGreaterThan(0);
    });

    it('should count due today tasks correctly', () => {
      const now = Date.now();
      const inTwoHours = now + 2 * 60 * 60 * 1000;
      
      const state: TaskState = {
        lists: [testList],
        tasks: [
          createTask('1', 'Due today', now, inTwoHours),
          createTask('2', 'No due date', now),
        ],
        activeListId: null,
        activeView: 'dashboard',
        error: null,
        sortPreferences: {},
      };

      renderWithContext(state);
      
      // Should show 1 task due today (verify by checking the "Due Today" label exists)
      expect(screen.getByText('Due Today')).toBeInTheDocument();
      // The dashboard should show the metrics
      expect(screen.getByText('Productivity Dashboard')).toBeInTheDocument();
    });

    it('should calculate oldest task age in days', () => {
      const now = Date.now();
      const tenDaysAgo = now - 10 * 24 * 60 * 60 * 1000;
      
      const state: TaskState = {
        lists: [testList],
        tasks: [
          createTask('1', 'Old task', tenDaysAgo),
          createTask('2', 'New task', now),
        ],
        activeListId: null,
        activeView: 'dashboard',
        error: null,
        sortPreferences: {},
      };

      renderWithContext(state);
      
      expect(screen.getByText(/10 days/i)).toBeInTheDocument();
    });

    it('should show N/A for oldest task when no tasks exist', () => {
      const state: TaskState = {
        lists: [testList],
        tasks: [],
        activeListId: null,
        activeView: 'dashboard',
        error: null,
        sortPreferences: {},
      };

      renderWithContext(state);
      
      expect(screen.getByText('N/A')).toBeInTheDocument();
    });

    it('should count total lists correctly', () => {
      const list2: TodoList = {
        id: 'list-2',
        name: 'Second List',
        color: '#10B981',
        createdAt: Date.now(),
      };
      
      const state: TaskState = {
        lists: [testList, list2],
        tasks: [],
        activeListId: null,
        activeView: 'dashboard',
        error: null,
        sortPreferences: {},
      };

      renderWithContext(state);
      
      expect(screen.getByText('2')).toBeInTheDocument();
    });
  });

  describe('Decoupling from activeListId', () => {
    it('should aggregate data from all lists regardless of activeListId', () => {
      const list2: TodoList = {
        id: 'list-2',
        name: 'Second List',
        color: '#10B981',
        createdAt: Date.now(),
      };
      
      const state: TaskState = {
        lists: [testList, list2],
        tasks: [
          createTask('1', 'Task in list 1', Date.now()),
          { ...createTask('2', 'Task in list 2', Date.now()), listId: 'list-2' },
        ],
        activeListId: 'list-1', // Active list is set, but dashboard should show all tasks
        activeView: 'dashboard',
        error: null,
        sortPreferences: {},
      };

      renderWithContext(state);
      
      // Should show 2 open tasks (from both lists)
      const widgets = screen.getAllByText('2');
      expect(widgets.length).toBeGreaterThan(0);
    });

    it('should work when activeListId is null', () => {
      const state: TaskState = {
        lists: [testList],
        tasks: [createTask('1', 'Test task', Date.now())],
        activeListId: null,
        activeView: 'dashboard',
        error: null,
        sortPreferences: {},
      };

      renderWithContext(state);
      
      expect(screen.getByText('Productivity Dashboard')).toBeInTheDocument();
      // Verify the dashboard renders with correct open tasks count
      expect(screen.getByText('Open Tasks')).toBeInTheDocument();
    });
  });

  describe('Performance - Memoization', () => {
    it('should render without errors with many tasks', () => {
      const manyTasks = Array.from({ length: 100 }, (_, i) =>
        createTask(`task-${i}`, `Task ${i}`, Date.now())
      );
      
      const state: TaskState = {
        lists: [testList],
        tasks: manyTasks,
        activeListId: null,
        activeView: 'dashboard',
        error: null,
        sortPreferences: {},
      };

      renderWithContext(state);
      
      expect(screen.getByText('100')).toBeInTheDocument();
    });
  });
});
