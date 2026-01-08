import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EditTaskModal } from './EditTaskModal';
import { ToastProvider } from '../../context/ToastContext';
import { Task, TaskState } from './types';
import * as TaskContext from '../../context/TaskContext';

// Mock the context
const mockDispatch = vi.fn();

function renderWithContext(state: TaskState, task: Task, onClose: () => void) {
  vi.spyOn(TaskContext, 'useTaskContext').mockReturnValue({
    state,
    dispatch: mockDispatch,
  });
  
  return render(
    <ToastProvider>
      <EditTaskModal task={task} onClose={onClose} />
    </ToastProvider>
  );
}

describe('EditTaskModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const testTask: Task = {
    id: 'task-1',
    description: 'Test Task',
    priority: 'medium',
    createdAt: Date.now(),
    listId: 'list-1',
    dueDate: new Date('2026-01-15T10:00').getTime(),
  };

  const testState: TaskState = {
    lists: [{ id: 'list-1', name: 'Test List', color: '#3B82F6', createdAt: Date.now() }],
    tasks: [testTask],
    activeListId: 'list-1',
    activeView: 'list',
    error: null,
    sortPreferences: {},
  };

  describe('Rendering', () => {
    it('should render modal with task data', () => {
      const onClose = vi.fn();
      renderWithContext(testState, testTask, onClose);

      expect(screen.getByText('Edit Task')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Test Task')).toBeInTheDocument();
      expect(screen.getByLabelText('Task priority')).toBeInTheDocument();
    });

    it('should render cancel and update buttons', () => {
      const onClose = vi.fn();
      renderWithContext(testState, testTask, onClose);

      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByText('Update Task')).toBeInTheDocument();
    });

    it('should have close button', () => {
      const onClose = vi.fn();
      renderWithContext(testState, testTask, onClose);

      expect(screen.getByLabelText('Close modal')).toBeInTheDocument();
    });
  });

  describe('Task Update', () => {
    it('should dispatch UPDATE_TASK action on submit', () => {
      const onClose = vi.fn();
      renderWithContext(testState, testTask, onClose);

      const descriptionInput = screen.getByDisplayValue('Test Task');
      fireEvent.change(descriptionInput, { target: { value: 'Updated Task' } });

      const submitButton = screen.getByText('Update Task');
      fireEvent.click(submitButton);

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'UPDATE_TASK',
        payload: expect.objectContaining({
          id: 'task-1',
          description: 'Updated Task',
          priority: 'medium',
        }),
      });
    });

    it('should update priority', () => {
      const onClose = vi.fn();
      renderWithContext(testState, testTask, onClose);

      const prioritySelect = screen.getByLabelText('Task priority') as HTMLSelectElement;
      fireEvent.change(prioritySelect, { target: { value: 'high' } });

      const submitButton = screen.getByText('Update Task');
      fireEvent.click(submitButton);

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'UPDATE_TASK',
        payload: expect.objectContaining({
          priority: 'high',
        }),
      });
    });
  });

  describe('Modal Close', () => {
    it('should call onClose when cancel button is clicked', () => {
      const onClose = vi.fn();
      renderWithContext(testState, testTask, onClose);

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when close button is clicked', () => {
      const onClose = vi.fn();
      renderWithContext(testState, testTask, onClose);

      const closeButton = screen.getByLabelText('Close modal');
      fireEvent.click(closeButton);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when clicking overlay', () => {
      const onClose = vi.fn();
      const { container } = renderWithContext(testState, testTask, onClose);

      const overlay = container.querySelector('.overlay');
      if (overlay) {
        fireEvent.click(overlay);
        expect(onClose).toHaveBeenCalledTimes(1);
      }
    });
  });

  describe('Error Handling', () => {
    it('should display error message when present', () => {
      const onClose = vi.fn();
      const stateWithError = {
        ...testState,
        error: 'Task not found',
      };
      renderWithContext(stateWithError, testTask, onClose);

      expect(screen.getByText('Task not found')).toBeInTheDocument();
    });

    it('should clear error when user types in description', () => {
      const onClose = vi.fn();
      const stateWithError = {
        ...testState,
        error: 'Task cannot be empty',
      };
      renderWithContext(stateWithError, testTask, onClose);

      const descriptionInput = screen.getByDisplayValue('Test Task');
      fireEvent.change(descriptionInput, { target: { value: 'New Task' } });

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'CLEAR_ERROR',
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper labels for form fields', () => {
      const onClose = vi.fn();
      renderWithContext(testState, testTask, onClose);

      expect(screen.getByLabelText('Task description')).toBeInTheDocument();
      expect(screen.getByLabelText('Task priority')).toBeInTheDocument();
      expect(screen.getByLabelText('Task due date')).toBeInTheDocument();
    });

    it('should auto-focus the description input', () => {
      const onClose = vi.fn();
      renderWithContext(testState, testTask, onClose);

      const descriptionInput = screen.getByLabelText('Task description');
      expect(descriptionInput).toHaveFocus();
    });
  });
});
