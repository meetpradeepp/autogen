import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TaskSummaryModal } from './TaskSummaryModal';
import { TaskState, Task, TodoList } from './types';
import * as TaskContext from '../../context/TaskContext';

// Mock the context
const mockDispatch = vi.fn();

function renderModal(
  state: TaskState,
  filterType: 'open' | 'overdue' | 'dueToday',
  title: string,
  onClose = vi.fn(),
  onTaskClick = vi.fn()
) {
  vi.spyOn(TaskContext, 'useTaskContext').mockReturnValue({
    state,
    dispatch: mockDispatch,
  });

  return render(
    <TaskSummaryModal
      title={title}
      filterType={filterType}
      onClose={onClose}
      onTaskClick={onTaskClick}
    />
  );
}

describe('TaskSummaryModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const testList: TodoList = {
    id: 'list-1',
    name: 'Work',
    color: '#3B82F6',
    createdAt: Date.now(),
  };

  const testList2: TodoList = {
    id: 'list-2',
    name: 'Personal',
    color: '#10B981',
    createdAt: Date.now(),
  };

  const createTask = (
    id: string,
    title: string,
    listId: string,
    dueDate?: number
  ): Task => ({
    id,
    title,
    isCompleted: false,
    priority: 'medium',
    createdAt: Date.now(),
    listId,
    ...(dueDate && { dueDate }),
  });

  describe('Overdue Tasks Filter', () => {
    it('should display only overdue tasks', () => {
      const now = Date.now();
      const yesterday = now - 24 * 60 * 60 * 1000;
      const tomorrow = now + 24 * 60 * 60 * 1000;

      const state: TaskState = {
        lists: [testList],
        tasks: [
          createTask('1', 'Overdue task', 'list-1', yesterday),
          createTask('2', 'Future task', 'list-1', tomorrow),
          createTask('3', 'No due date', 'list-1'),
        ],
        activeListId: null,
        activeView: 'dashboard',
        error: null,
        sortPreferences: {},
      };

      renderModal(state, 'overdue', 'Overdue Tasks');

      expect(screen.getByText('Overdue task')).toBeInTheDocument();
      expect(screen.queryByText('Future task')).not.toBeInTheDocument();
      expect(screen.queryByText('No due date')).not.toBeInTheDocument();
    });

    it('should show empty state when no overdue tasks', () => {
      const state: TaskState = {
        lists: [testList],
        tasks: [],
        activeListId: null,
        activeView: 'dashboard',
        error: null,
        sortPreferences: {},
      };

      renderModal(state, 'overdue', 'Overdue Tasks');

      expect(screen.getByText('No tasks are overdue')).toBeInTheDocument();
    });
  });

  describe('Due Today Filter', () => {
    it('should display only tasks due today', () => {
      const now = Date.now();
      const inTwoHours = now + 2 * 60 * 60 * 1000;
      const yesterday = now - 24 * 60 * 60 * 1000;

      const state: TaskState = {
        lists: [testList],
        tasks: [
          createTask('1', 'Due today', 'list-1', inTwoHours),
          createTask('2', 'Overdue task', 'list-1', yesterday),
        ],
        activeListId: null,
        activeView: 'dashboard',
        error: null,
        sortPreferences: {},
      };

      renderModal(state, 'dueToday', 'Due Today');

      expect(screen.getByText('Due today')).toBeInTheDocument();
      expect(screen.queryByText('Overdue task')).not.toBeInTheDocument();
    });
  });

  describe('Open Tasks Filter', () => {
    it('should display all tasks', () => {
      const state: TaskState = {
        lists: [testList],
        tasks: [
          createTask('1', 'Task 1', 'list-1'),
          createTask('2', 'Task 2', 'list-1'),
          createTask('3', 'Task 3', 'list-1'),
        ],
        activeListId: null,
        activeView: 'dashboard',
        error: null,
        sortPreferences: {},
      };

      renderModal(state, 'open', 'Open Tasks');

      expect(screen.getByText('Task 1')).toBeInTheDocument();
      expect(screen.getByText('Task 2')).toBeInTheDocument();
      expect(screen.getByText('Task 3')).toBeInTheDocument();
    });
  });

  describe('Grouping by List', () => {
    it('should group tasks by list name', () => {
      const state: TaskState = {
        lists: [testList, testList2],
        tasks: [
          createTask('1', 'Work task', 'list-1'),
          createTask('2', 'Personal task', 'list-2'),
        ],
        activeListId: null,
        activeView: 'dashboard',
        error: null,
        sortPreferences: {},
      };

      renderModal(state, 'open', 'Open Tasks');

      expect(screen.getByText('Work')).toBeInTheDocument();
      expect(screen.getByText('Personal')).toBeInTheDocument();
      expect(screen.getByText('Work task')).toBeInTheDocument();
      expect(screen.getByText('Personal task')).toBeInTheDocument();
    });

    it('should exclude tasks from deleted lists', () => {
      const state: TaskState = {
        lists: [testList], // Only list-1 exists
        tasks: [
          createTask('1', 'Valid task', 'list-1'),
          createTask('2', 'Orphaned task', 'deleted-list'),
        ],
        activeListId: null,
        activeView: 'dashboard',
        error: null,
        sortPreferences: {},
      };

      renderModal(state, 'open', 'Open Tasks');

      expect(screen.getByText('Valid task')).toBeInTheDocument();
      expect(screen.queryByText('Orphaned task')).not.toBeInTheDocument();
    });
  });

  describe('Modal Interactions', () => {
    it('should call onClose when close button is clicked', () => {
      const onClose = vi.fn();
      const state: TaskState = {
        lists: [testList],
        tasks: [createTask('1', 'Task 1', 'list-1')],
        activeListId: null,
        activeView: 'dashboard',
        error: null,
        sortPreferences: {},
      };

      renderModal(state, 'open', 'Open Tasks', onClose);

      const closeButton = screen.getByLabelText('Close modal');
      fireEvent.click(closeButton);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should call onTaskClick when task is clicked', () => {
      const onTaskClick = vi.fn();
      const task = createTask('1', 'Clickable task', 'list-1');
      const state: TaskState = {
        lists: [testList],
        tasks: [task],
        activeListId: null,
        activeView: 'dashboard',
        error: null,
        sortPreferences: {},
      };

      renderModal(state, 'open', 'Open Tasks', vi.fn(), onTaskClick);

      const taskElement = screen.getByText('Clickable task');
      fireEvent.click(taskElement.closest('li')!);

      expect(onTaskClick).toHaveBeenCalledTimes(1);
      expect(onTaskClick).toHaveBeenCalledWith(task);
    });
  });

  describe('Scrollable for High Volume', () => {
    it('should render many tasks without issues', () => {
      const manyTasks = Array.from({ length: 100 }, (_, i) =>
        createTask(`task-${i}`, `Task ${i}`, 'list-1')
      );

      const state: TaskState = {
        lists: [testList],
        tasks: manyTasks,
        activeListId: null,
        activeView: 'dashboard',
        error: null,
        sortPreferences: {},
      };

      renderModal(state, 'open', 'Open Tasks');

      // Check first and last tasks are present
      expect(screen.getByText('Task 0')).toBeInTheDocument();
      expect(screen.getByText('Task 99')).toBeInTheDocument();
    });
  });
});
