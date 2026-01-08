import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TaskModal } from './EditTaskModal';
import { ToastProvider } from '../../context/ToastContext';
import { TaskState, TodoList, Task } from './types';
import * as TaskContext from '../../context/TaskContext';

// Mock the context
const mockDispatch = vi.fn();
const mockShowToast = vi.fn();

vi.mock('../../context/ToastContext', () => ({
  ToastProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useToast: () => ({ showToast: mockShowToast }),
}));

function renderWithContext(state: TaskState, props: React.ComponentProps<typeof TaskModal>) {
  vi.spyOn(TaskContext, 'useTaskContext').mockReturnValue({
    state,
    dispatch: mockDispatch,
  });
  
  return render(
    <ToastProvider>
      <TaskModal {...props} />
    </ToastProvider>
  );
}

describe('TaskModal - List Selection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const testLists: TodoList[] = [
    {
      id: 'list-1',
      name: 'Work',
      color: '#3B82F6',
      createdAt: Date.now() - 2000,
    },
    {
      id: 'list-2',
      name: 'Personal',
      color: '#10B981',
      createdAt: Date.now() - 1000,
    },
    {
      id: 'list-3',
      name: 'Shopping',
      color: '#F59E0B',
      createdAt: Date.now(),
    },
  ];

  describe('Create Mode from Calendar (No forceListId)', () => {
    it('should show list dropdown with all available lists', () => {
      const state: TaskState = {
        lists: testLists,
        tasks: [],
        activeListId: 'list-1',
        activeView: 'calendar',
        error: null,
        sortPreferences: {},
      };

      renderWithContext(state, {
        initialDueDate: Date.now(),
        onClose: vi.fn(),
      });

      // List dropdown should be visible and editable
      const listSelect = screen.getByLabelText('Task list') as HTMLSelectElement;
      expect(listSelect).toBeInTheDocument();
      expect(listSelect).not.toBeDisabled();

      // Should have all lists as options
      expect(listSelect.options.length).toBe(3);
      expect(listSelect.options[0].text).toBe('Work');
      expect(listSelect.options[1].text).toBe('Personal');
      expect(listSelect.options[2].text).toBe('Shopping');
    });

    it('should default to first available list', () => {
      const state: TaskState = {
        lists: testLists,
        tasks: [],
        activeListId: 'list-2',
        activeView: 'calendar',
        error: null,
        sortPreferences: {},
      };

      renderWithContext(state, {
        initialDueDate: Date.now(),
        onClose: vi.fn(),
      });

      const listSelect = screen.getByLabelText('Task list') as HTMLSelectElement;
      expect(listSelect.value).toBe('list-1'); // First list in array
    });

    it('should allow user to select different list before creating task', async () => {
      const state: TaskState = {
        lists: testLists,
        tasks: [],
        activeListId: 'list-1',
        activeView: 'calendar',
        error: null,
        sortPreferences: {},
      };

      renderWithContext(state, {
        initialDueDate: Date.now(),
        onClose: vi.fn(),
      });

      const listSelect = screen.getByLabelText('Task list') as HTMLSelectElement;
      
      // Change to Personal list
      fireEvent.change(listSelect, { target: { value: 'list-2' } });
      expect(listSelect.value).toBe('list-2');

      // Fill in task details
      const descInput = screen.getByLabelText('Task description');
      fireEvent.change(descInput, { target: { value: 'Test task' } });

      // Submit form
      const submitButton = screen.getByRole('button', { name: 'Create Task' });
      fireEvent.click(submitButton);

      // Should dispatch ADD_TASK with selected listId
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'ADD_TASK',
        payload: expect.objectContaining({
          description: 'Test task',
          listId: 'list-2',
        }),
      });
    });

    it('should show error if no lists are available', () => {
      const state: TaskState = {
        lists: [],
        tasks: [],
        activeListId: null,
        activeView: 'calendar',
        error: null,
        sortPreferences: {},
      };

      renderWithContext(state, {
        initialDueDate: Date.now(),
        onClose: vi.fn(),
      });

      const listSelect = screen.getByLabelText('Task list') as HTMLSelectElement;
      expect(listSelect).toBeDisabled();
      expect(screen.getByText('No lists available')).toBeInTheDocument();
    });
  });

  describe('Edit Mode (Task Moving)', () => {
    const existingTask: Task = {
      id: 'task-1',
      description: 'Existing task',
      priority: 'medium',
      createdAt: Date.now(),
      listId: 'list-1',
    };

    it('should show dropdown with current list selected', () => {
      const state: TaskState = {
        lists: testLists,
        tasks: [existingTask],
        activeListId: 'list-1',
        activeView: 'dashboard',
        error: null,
        sortPreferences: {},
      };

      renderWithContext(state, {
        task: existingTask,
        onClose: vi.fn(),
      });

      const listSelect = screen.getByLabelText('Task list') as HTMLSelectElement;
      expect(listSelect).toBeInTheDocument();
      expect(listSelect.value).toBe('list-1');
      expect(listSelect).not.toBeDisabled();
    });

    it('should allow moving task to different list', async () => {
      const state: TaskState = {
        lists: testLists,
        tasks: [existingTask],
        activeListId: 'list-1',
        activeView: 'dashboard',
        error: null,
        sortPreferences: {},
      };

      renderWithContext(state, {
        task: existingTask,
        onClose: vi.fn(),
      });

      const listSelect = screen.getByLabelText('Task list') as HTMLSelectElement;
      
      // Change to Shopping list
      fireEvent.change(listSelect, { target: { value: 'list-3' } });
      expect(listSelect.value).toBe('list-3');

      // Submit form
      const submitButton = screen.getByText('Update Task');
      fireEvent.click(submitButton);

      // Should dispatch UPDATE_TASK with new listId
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'UPDATE_TASK',
        payload: expect.objectContaining({
          id: 'task-1',
          description: 'Existing task',
          listId: 'list-3',
        }),
      });
    });

    it('should NOT include listId in UPDATE_TASK if list did not change', async () => {
      const state: TaskState = {
        lists: testLists,
        tasks: [existingTask],
        activeListId: 'list-1',
        activeView: 'dashboard',
        error: null,
        sortPreferences: {},
      };

      renderWithContext(state, {
        task: existingTask,
        onClose: vi.fn(),
      });

      // Just change description, not list
      const descInput = screen.getByLabelText('Task description');
      fireEvent.change(descInput, { target: { value: 'Updated description' } });

      // Submit form
      const submitButton = screen.getByText('Update Task');
      fireEvent.click(submitButton);

      // Should dispatch UPDATE_TASK without listId
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'UPDATE_TASK',
        payload: {
          id: 'task-1',
          description: 'Updated description',
          priority: 'medium',
          dueDate: undefined,
          // No listId property
        },
      });
    });
  });

  describe('Create Mode from List View (forceListId)', () => {
    it('should show read-only list name when forceListId is provided', () => {
      const state: TaskState = {
        lists: testLists,
        tasks: [],
        activeListId: 'list-2',
        activeView: 'dashboard',
        error: null,
        sortPreferences: {},
      };

      renderWithContext(state, {
        forceListId: 'list-2',
        onClose: vi.fn(),
      });

      // Should NOT show dropdown
      expect(screen.queryByLabelText('Task list')).not.toBeInTheDocument();

      // Should show read-only text with list name
      expect(screen.getByText('Personal')).toBeInTheDocument();
    });

    it('should create task in forced list', async () => {
      const state: TaskState = {
        lists: testLists,
        tasks: [],
        activeListId: 'list-2',
        activeView: 'dashboard',
        error: null,
        sortPreferences: {},
      };

      renderWithContext(state, {
        forceListId: 'list-2',
        onClose: vi.fn(),
      });

      // Fill in task details
      const descInput = screen.getByLabelText('Task description');
      fireEvent.change(descInput, { target: { value: 'Forced list task' } });

      // Submit form
      const submitButton = screen.getByRole('button', { name: 'Create Task' });
      fireEvent.click(submitButton);

      // Should dispatch ADD_TASK with forced listId
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'ADD_TASK',
        payload: expect.objectContaining({
          description: 'Forced list task',
          listId: 'list-2',
        }),
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle single list scenario in dropdown', () => {
      const singleList: TodoList[] = [testLists[0]];
      const state: TaskState = {
        lists: singleList,
        tasks: [],
        activeListId: 'list-1',
        activeView: 'calendar',
        error: null,
        sortPreferences: {},
      };

      renderWithContext(state, {
        initialDueDate: Date.now(),
        onClose: vi.fn(),
      });

      const listSelect = screen.getByLabelText('Task list') as HTMLSelectElement;
      expect(listSelect.options.length).toBe(1);
      expect(listSelect.value).toBe('list-1');
      expect(listSelect).not.toBeDisabled();
    });

    it('should validate list selection before creating task', async () => {
      const state: TaskState = {
        lists: testLists,
        tasks: [],
        activeListId: 'list-1',
        activeView: 'calendar',
        error: null,
        sortPreferences: {},
      };

      renderWithContext(state, {
        initialDueDate: Date.now(),
        onClose: vi.fn(),
      });

      const descInput = screen.getByLabelText('Task description');
      fireEvent.change(descInput, { target: { value: 'Test task' } });

      // Manually clear the select value (simulate invalid state)
      const listSelect = screen.getByLabelText('Task list') as HTMLSelectElement;
      fireEvent.change(listSelect, { target: { value: '' } });

      const submitButton = screen.getByRole('button', { name: 'Create Task' });
      fireEvent.click(submitButton);

      // Should show error
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'SET_ERROR',
        payload: 'Please select a list',
      });
    });
  });
});
