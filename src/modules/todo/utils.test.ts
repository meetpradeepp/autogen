import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { formatCreatedDate, formatTaskAge, formatDueDate, normalizeToStartOfDay, isTaskOverdue, isTaskDueToday, isTaskDueFuture, isSameMonth } from './utils';

describe('formatCreatedDate', () => {
  it('should format timestamp as "DD MMM"', () => {
    const timestamp = new Date('2026-01-12').getTime();
    const result = formatCreatedDate(timestamp);
    expect(result).toBe('Jan 12');
  });

  it('should handle different months', () => {
    const timestamp = new Date('2026-03-25').getTime();
    const result = formatCreatedDate(timestamp);
    expect(result).toBe('Mar 25');
  });

  it('should handle single-digit days', () => {
    const timestamp = new Date('2026-02-05').getTime();
    const result = formatCreatedDate(timestamp);
    expect(result).toBe('Feb 5');
  });
});

describe('formatDueDate', () => {
  it('should format timestamp with time', () => {
    const timestamp = new Date('2026-01-15T10:00:00').getTime();
    const result = formatDueDate(timestamp);
    expect(result).toBe('Jan 15, 10:00 AM');
  });

  it('should format afternoon times', () => {
    const timestamp = new Date('2026-03-20T15:30:00').getTime();
    const result = formatDueDate(timestamp);
    expect(result).toBe('Mar 20, 3:30 PM');
  });
});

describe('formatTaskAge', () => {
  beforeEach(() => {
    // Mock Date.now() to return a fixed time
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-15T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return "New" for tasks less than 24 hours old', () => {
    // Created 12 hours ago
    const createdAt = Date.now() - (12 * 60 * 60 * 1000);
    expect(formatTaskAge(createdAt)).toBe('New');
  });

  it('should return "New" for tasks exactly 23 hours old', () => {
    // Created 23 hours ago
    const createdAt = Date.now() - (23 * 60 * 60 * 1000);
    expect(formatTaskAge(createdAt)).toBe('New');
  });

  it('should return "1 day" for tasks 1 day old', () => {
    // Created 1 day ago
    const createdAt = Date.now() - (1 * 24 * 60 * 60 * 1000);
    expect(formatTaskAge(createdAt)).toBe('1 day');
  });

  it('should return "X days" for tasks between 2-6 days old', () => {
    // Created 3 days ago
    const createdAt = Date.now() - (3 * 24 * 60 * 60 * 1000);
    expect(formatTaskAge(createdAt)).toBe('3 days');
  });

  it('should return "1 week" for tasks exactly 7 days old', () => {
    // Created 7 days ago
    const createdAt = Date.now() - (7 * 24 * 60 * 60 * 1000);
    expect(formatTaskAge(createdAt)).toBe('1 week');
  });

  it('should return "2 weeks" for tasks 14 days old', () => {
    // Created 14 days ago
    const createdAt = Date.now() - (14 * 24 * 60 * 60 * 1000);
    expect(formatTaskAge(createdAt)).toBe('2 weeks');
  });

  it('should return "3 weeks" for tasks 21 days old', () => {
    // Created 21 days ago
    const createdAt = Date.now() - (21 * 24 * 60 * 60 * 1000);
    expect(formatTaskAge(createdAt)).toBe('3 weeks');
  });

  it('should handle future dates by returning "Just now"', () => {
    // Created in the future (system clock skew)
    const createdAt = Date.now() + (5 * 60 * 60 * 1000); // 5 hours in future
    expect(formatTaskAge(createdAt)).toBe('Just now');
  });

  it('should return "New" for tasks created now', () => {
    const createdAt = Date.now();
    expect(formatTaskAge(createdAt)).toBe('New');
  });

  it('should correctly handle edge case of 6 days 23 hours', () => {
    // Created 6 days and 23 hours ago (should show "6 days")
    const createdAt = Date.now() - (6 * 24 * 60 * 60 * 1000 + 23 * 60 * 60 * 1000);
    expect(formatTaskAge(createdAt)).toBe('6 days');
  });
});

describe('normalizeToStartOfDay', () => {
  it('should normalize timestamp to midnight (00:00:00.000)', () => {
    const timestamp = new Date('2026-01-15T14:30:45.123').getTime();
    const normalized = normalizeToStartOfDay(timestamp);
    const date = new Date(normalized);
    
    expect(date.getHours()).toBe(0);
    expect(date.getMinutes()).toBe(0);
    expect(date.getSeconds()).toBe(0);
    expect(date.getMilliseconds()).toBe(0);
  });

  it('should keep the same calendar date', () => {
    const timestamp = new Date('2026-01-15T23:59:59.999').getTime();
    const normalized = normalizeToStartOfDay(timestamp);
    const date = new Date(normalized);
    
    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(0); // January (0-indexed)
    expect(date.getDate()).toBe(15);
  });

  it('should handle already normalized timestamps', () => {
    const timestamp = new Date('2026-01-15T00:00:00.000').getTime();
    const normalized = normalizeToStartOfDay(timestamp);
    
    expect(normalized).toBe(timestamp);
  });
});

describe('isTaskOverdue', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Set current time to Jan 15, 2026, 14:30 (2:30 PM)
    vi.setSystemTime(new Date('2026-01-15T14:30:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return true for tasks due yesterday', () => {
    const yesterday = new Date('2026-01-14T10:00:00.000').getTime();
    expect(isTaskOverdue(yesterday)).toBe(true);
  });

  it('should return true for tasks due yesterday at midnight', () => {
    const yesterday = new Date('2026-01-14T00:00:00.000').getTime();
    expect(isTaskOverdue(yesterday)).toBe(true);
  });

  it('should return false for tasks due today at midnight', () => {
    const today = new Date('2026-01-15T00:00:00.000').getTime();
    expect(isTaskOverdue(today)).toBe(false);
  });

  it('should return false for tasks due today at 11:59 PM', () => {
    const today = new Date('2026-01-15T23:59:59.999').getTime();
    expect(isTaskOverdue(today)).toBe(false);
  });

  it('should return false for tasks due tomorrow', () => {
    const tomorrow = new Date('2026-01-16T10:00:00.000').getTime();
    expect(isTaskOverdue(tomorrow)).toBe(false);
  });

  it('should return true for tasks due multiple days ago', () => {
    const pastDate = new Date('2026-01-10T15:00:00.000').getTime();
    expect(isTaskOverdue(pastDate)).toBe(true);
  });
});

describe('isTaskDueToday', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Set current time to Jan 15, 2026, 14:30 (2:30 PM)
    vi.setSystemTime(new Date('2026-01-15T14:30:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return true for tasks due today at midnight', () => {
    const today = new Date('2026-01-15T00:00:00.000').getTime();
    expect(isTaskDueToday(today)).toBe(true);
  });

  it('should return true for tasks due today at 11:59 PM', () => {
    const today = new Date('2026-01-15T23:59:59.999').getTime();
    expect(isTaskDueToday(today)).toBe(true);
  });

  it('should return true for tasks due today at current time', () => {
    const today = new Date('2026-01-15T14:30:00.000').getTime();
    expect(isTaskDueToday(today)).toBe(true);
  });

  it('should return false for tasks due yesterday', () => {
    const yesterday = new Date('2026-01-14T10:00:00.000').getTime();
    expect(isTaskDueToday(yesterday)).toBe(false);
  });

  it('should return false for tasks due tomorrow', () => {
    const tomorrow = new Date('2026-01-16T10:00:00.000').getTime();
    expect(isTaskDueToday(tomorrow)).toBe(false);
  });

  it('should handle edge case: task at 00:00:00 when current time is late evening', () => {
    vi.setSystemTime(new Date('2026-01-15T23:00:00.000Z'));
    const today = new Date('2026-01-15T00:00:00.000').getTime();
    expect(isTaskDueToday(today)).toBe(true);
  });
});

describe('isTaskDueFuture', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Set current time to Jan 15, 2026, 14:30 (2:30 PM)
    vi.setSystemTime(new Date('2026-01-15T14:30:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return true for tasks due tomorrow', () => {
    const tomorrow = new Date('2026-01-16T10:00:00.000').getTime();
    expect(isTaskDueFuture(tomorrow)).toBe(true);
  });

  it('should return true for tasks due tomorrow at midnight', () => {
    const tomorrow = new Date('2026-01-16T00:00:00.000').getTime();
    expect(isTaskDueFuture(tomorrow)).toBe(true);
  });

  it('should return false for tasks due today', () => {
    const today = new Date('2026-01-15T10:00:00.000').getTime();
    expect(isTaskDueFuture(today)).toBe(false);
  });

  it('should return false for tasks due yesterday', () => {
    const yesterday = new Date('2026-01-14T10:00:00.000').getTime();
    expect(isTaskDueFuture(yesterday)).toBe(false);
  });

  it('should return true for tasks due multiple days in the future', () => {
    const futureDate = new Date('2026-01-20T15:00:00.000').getTime();
    expect(isTaskDueFuture(futureDate)).toBe(true);
  });
});

describe('isSameMonth', () => {
  it('should return true for dates in the same month and year', () => {
    const date1 = new Date('2026-01-15');
    const date2 = new Date('2026-01-20');
    expect(isSameMonth(date1, date2)).toBe(true);
  });

  it('should return true for the same exact date', () => {
    const date1 = new Date('2026-01-15');
    const date2 = new Date('2026-01-15');
    expect(isSameMonth(date1, date2)).toBe(true);
  });

  it('should return false for different months in the same year', () => {
    const date1 = new Date('2026-01-15');
    const date2 = new Date('2026-02-15');
    expect(isSameMonth(date1, date2)).toBe(false);
  });

  it('should return false for same month in different years', () => {
    const date1 = new Date('2026-01-15');
    const date2 = new Date('2027-01-15');
    expect(isSameMonth(date1, date2)).toBe(false);
  });

  it('should return false for different months and years', () => {
    const date1 = new Date('2026-01-15');
    const date2 = new Date('2027-02-15');
    expect(isSameMonth(date1, date2)).toBe(false);
  });

  it('should handle beginning and end of same month', () => {
    const date1 = new Date('2026-01-01');
    const date2 = new Date('2026-01-31');
    expect(isSameMonth(date1, date2)).toBe(true);
  });

  it('should handle year boundary - Dec 2025 vs Jan 2026', () => {
    const date1 = new Date('2025-12-31');
    const date2 = new Date('2026-01-01');
    expect(isSameMonth(date1, date2)).toBe(false);
  });
});
