import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CalendarView } from './CalendarView';
import { TaskState, TodoList } from './types';
import * as TaskContext from '../../context/TaskContext';

// Mock the context
const mockDispatch = vi.fn();

function renderCalendarView(state: TaskState) {
  vi.spyOn(TaskContext, 'useTaskContext').mockReturnValue({
    state,
    dispatch: mockDispatch,
  });
  
  return render(<CalendarView />);
}

describe('CalendarView - Today Button State', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set a fixed date for testing: January 15, 2026
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-15T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const testList: TodoList = {
    id: 'list-1',
    name: 'Test List',
    color: '#3B82F6',
    createdAt: Date.now(),
  };

  describe('When viewing current month (January 2026)', () => {
    it('should disable the Today button', () => {
      const state: TaskState = {
        lists: [testList],
        tasks: [],
        activeListId: 'list-1',
        activeView: 'calendar',
        error: null,
        sortPreferences: {},
      };

      renderCalendarView(state);
      
      const todayButton = screen.getByRole('button', { name: 'Currently viewing current month' });
      expect(todayButton).toBeDisabled();
    });

    it('should show "Currently viewing current month" aria-label', () => {
      const state: TaskState = {
        lists: [testList],
        tasks: [],
        activeListId: 'list-1',
        activeView: 'calendar',
        error: null,
        sortPreferences: {},
      };

      renderCalendarView(state);
      
      const todayButton = screen.getByRole('button', { name: 'Currently viewing current month' });
      expect(todayButton).toBeInTheDocument();
    });

    it('should display the current month header', () => {
      const state: TaskState = {
        lists: [testList],
        tasks: [],
        activeListId: 'list-1',
        activeView: 'calendar',
        error: null,
        sortPreferences: {},
      };

      renderCalendarView(state);
      
      expect(screen.getByText('January 2026')).toBeInTheDocument();
    });
  });

  describe('When viewing different month (December 2025)', () => {
    it('should enable the Today button after clicking Previous', () => {
      const state: TaskState = {
        lists: [testList],
        tasks: [],
        activeListId: 'list-1',
        activeView: 'calendar',
        error: null,
        sortPreferences: {},
      };

      renderCalendarView(state);
      
      // Initially disabled on current month
      const todayButton = screen.getByRole('button', { name: /currently viewing current month/i });
      expect(todayButton).toBeDisabled();
      
      // Click previous month
      const prevButton = screen.getByRole('button', { name: '◀' });
      fireEvent.click(prevButton);
      
      // Now should be enabled with different aria-label
      const enabledTodayButton = screen.getByRole('button', { name: 'Return to today' });
      expect(enabledTodayButton).not.toBeDisabled();
      expect(screen.getByText('December 2025')).toBeInTheDocument();
    });

    it('should enable the Today button after clicking Next', () => {
      const state: TaskState = {
        lists: [testList],
        tasks: [],
        activeListId: 'list-1',
        activeView: 'calendar',
        error: null,
        sortPreferences: {},
      };

      renderCalendarView(state);
      
      // Click next month
      const nextButton = screen.getByRole('button', { name: '▶' });
      fireEvent.click(nextButton);
      
      // Should be enabled
      const todayButton = screen.getByRole('button', { name: 'Return to today' });
      expect(todayButton).not.toBeDisabled();
      expect(screen.getByText('February 2026')).toBeInTheDocument();
    });
  });

  describe('Year boundary edge case', () => {
    it('should enable Today button when viewing January 2027 (same month, different year)', () => {
      const state: TaskState = {
        lists: [testList],
        tasks: [],
        activeListId: 'list-1',
        activeView: 'calendar',
        error: null,
        sortPreferences: {},
      };

      renderCalendarView(state);
      
      // Click next 12 times to reach January 2027
      const nextButton = screen.getByRole('button', { name: '▶' });
      for (let i = 0; i < 12; i++) {
        fireEvent.click(nextButton);
      }
      
      // Should be enabled even though it's January (different year)
      const todayButton = screen.getByRole('button', { name: 'Return to today' });
      expect(todayButton).not.toBeDisabled();
      expect(screen.getByText('January 2027')).toBeInTheDocument();
    });

    it('should enable Today button when viewing December 2025 -> January 2026 boundary', () => {
      const state: TaskState = {
        lists: [testList],
        tasks: [],
        activeListId: 'list-1',
        activeView: 'calendar',
        error: null,
        sortPreferences: {},
      };

      renderCalendarView(state);
      
      // Go to December 2025
      const prevButton = screen.getByRole('button', { name: '◀' });
      fireEvent.click(prevButton);
      
      expect(screen.getByText('December 2025')).toBeInTheDocument();
      const todayButton = screen.getByRole('button', { name: 'Return to today' });
      expect(todayButton).not.toBeDisabled();
    });
  });

  describe('Today button navigation', () => {
    it('should return to current month when Today button is clicked', () => {
      const state: TaskState = {
        lists: [testList],
        tasks: [],
        activeListId: 'list-1',
        activeView: 'calendar',
        error: null,
        sortPreferences: {},
      };

      renderCalendarView(state);
      
      // Navigate to different month
      const prevButton = screen.getByRole('button', { name: '◀' });
      fireEvent.click(prevButton);
      fireEvent.click(prevButton);
      expect(screen.getByText('November 2025')).toBeInTheDocument();
      
      // Click Today button
      const todayButton = screen.getByRole('button', { name: 'Return to today' });
      fireEvent.click(todayButton);
      
      // Should return to January 2026
      expect(screen.getByText('January 2026')).toBeInTheDocument();
      
      // Button should now be disabled
      const disabledTodayButton = screen.getByRole('button', { name: 'Currently viewing current month' });
      expect(disabledTodayButton).toBeDisabled();
    });

    it('should update button state immediately after clicking Today', () => {
      const state: TaskState = {
        lists: [testList],
        tasks: [],
        activeListId: 'list-1',
        activeView: 'calendar',
        error: null,
        sortPreferences: {},
      };

      renderCalendarView(state);
      
      // Navigate away
      const nextButton = screen.getByRole('button', { name: '▶' });
      fireEvent.click(nextButton);
      fireEvent.click(nextButton);
      fireEvent.click(nextButton);
      
      // Click Today
      const todayButton = screen.getByRole('button', { name: 'Return to today' });
      fireEvent.click(todayButton);
      
      // Verify immediate state change
      expect(screen.getByRole('button', { name: 'Currently viewing current month' })).toBeDisabled();
    });
  });

  describe('Multiple navigation scenarios', () => {
    it('should maintain correct button state when navigating forward and backward', () => {
      const state: TaskState = {
        lists: [testList],
        tasks: [],
        activeListId: 'list-1',
        activeView: 'calendar',
        error: null,
        sortPreferences: {},
      };

      renderCalendarView(state);
      
      const nextButton = screen.getByRole('button', { name: '▶' });
      const prevButton = screen.getByRole('button', { name: '◀' });
      
      // Go forward
      fireEvent.click(nextButton);
      expect(screen.getByRole('button', { name: 'Return to today' })).not.toBeDisabled();
      
      // Go back to current month
      fireEvent.click(prevButton);
      expect(screen.getByRole('button', { name: 'Currently viewing current month' })).toBeDisabled();
      
      // Go backward
      fireEvent.click(prevButton);
      expect(screen.getByRole('button', { name: 'Return to today' })).not.toBeDisabled();
      
      // Go forward to current month
      fireEvent.click(nextButton);
      expect(screen.getByRole('button', { name: 'Currently viewing current month' })).toBeDisabled();
    });
  });
});
