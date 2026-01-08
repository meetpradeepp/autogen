import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TaskForm } from './TaskForm';
import { ToastProvider } from '../../context/ToastContext';
import { TaskState, TodoList } from './types';
import * as TaskContext from '../../context/TaskContext';

// Mock the context
const mockDispatch = vi.fn();

function renderWithContext(state: TaskState) {
  vi.spyOn(TaskContext, 'useTaskContext').mockReturnValue({
    state,
    dispatch: mockDispatch,
  });
  
  return render(
    <ToastProvider>
      <TaskForm />
    </ToastProvider>
  );
}

describe('TaskForm - Context-Aware Rendering', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const testList: TodoList = {
    id: 'list-1',
    name: 'Test List',
    color: '#3B82F6',
    createdAt: Date.now(),
  };

  describe('State Guard - Conditional Visibility', () => {
    it('should not render when activeListId is null (no list selected)', () => {
      const state: TaskState = {
        lists: [],
        tasks: [],
        activeListId: null,
        activeView: 'dashboard',
        error: null,
        sortPreferences: {},
      };

      const { container } = renderWithContext(state);
      
      // TaskForm should render nothing (null)
      expect(container.firstChild).toBeNull();
      expect(screen.queryByPlaceholderText('Task title (required)...')).not.toBeInTheDocument();
      expect(screen.queryByText('Add Task')).not.toBeInTheDocument();
    });

    it('should not render on dashboard view when no list is selected (even with lists available)', () => {
      const state: TaskState = {
        lists: [testList],
        tasks: [],
        activeListId: null,
        activeView: 'dashboard',
        error: null,
        sortPreferences: {},
      };

      const { container } = renderWithContext(state);
      
      expect(container.firstChild).toBeNull();
      expect(screen.queryByPlaceholderText('Task title (required)...')).not.toBeInTheDocument();
    });

    it('should render when activeListId is set (list selected)', () => {
      const state: TaskState = {
        lists: [testList],
        tasks: [],
        activeListId: 'list-1',
        activeView: 'dashboard',
        error: null,
        sortPreferences: {},
      };

      renderWithContext(state);
      
      // TaskForm should be visible
      expect(screen.getByPlaceholderText('Task title (required)...')).toBeInTheDocument();
      expect(screen.getByText('Add Task')).toBeInTheDocument();
      expect(screen.getByLabelText('Task priority')).toBeInTheDocument();
    });

    it('should immediately disappear when active list is deleted (activeListId becomes null)', () => {
      const state: TaskState = {
        lists: [testList],
        tasks: [],
        activeListId: 'list-1',
        activeView: 'dashboard',
        error: null,
        sortPreferences: {},
      };

      const { rerender, container } = renderWithContext(state);
      
      // Initially visible
      expect(screen.getByPlaceholderText('Task title (required)...')).toBeInTheDocument();

      // Simulate list deletion - activeListId becomes null
      const stateAfterDeletion: TaskState = {
        ...state,
        lists: [],
        activeListId: null,
      };

      vi.spyOn(TaskContext, 'useTaskContext').mockReturnValue({
        state: stateAfterDeletion,
        dispatch: mockDispatch,
      });

      rerender(
        <ToastProvider>
          <TaskForm />
        </ToastProvider>
      );

      // Should now be hidden
      expect(container.firstChild).toBeNull();
      expect(screen.queryByPlaceholderText('Task title (required)...')).not.toBeInTheDocument();
    });

    it('should prevent "No active list selected" error from appearing in UI', () => {
      // This test verifies that the error state cannot be reached because
      // the form is not rendered when activeListId is null
      const state: TaskState = {
        lists: [],
        tasks: [],
        activeListId: null,
        activeView: 'dashboard',
        error: 'No active list selected', // This error should not be visible
        sortPreferences: {},
      };

      const { container } = renderWithContext(state);
      
      // Form not rendered, so error cannot be displayed
      expect(container.firstChild).toBeNull();
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      expect(screen.queryByText('No active list selected')).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should not flash on screen during browser refresh when no list is selected', () => {
      // Simulates app initialization state (typical after refresh to dashboard)
      const initialState: TaskState = {
        lists: [testList],
        tasks: [],
        activeListId: null,  // No list selected after refresh
        activeView: 'dashboard',
        error: null,
        sortPreferences: {},
      };

      const { container } = renderWithContext(initialState);
      
      // Should be hidden immediately, no flash
      expect(container.firstChild).toBeNull();
    });
  });
});
