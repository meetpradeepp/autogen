import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { formatCreatedDate, formatTaskAge, formatDueDate } from './utils';

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
