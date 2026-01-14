/**
 * Utility functions for task management
 */

// Create formatters at module level for performance
const createdDateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
});

const dueDateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
});

/**
 * Format task creation date in "DD MMM" format (e.g., "12 Jan")
 */
export function formatCreatedDate(timestamp: number): string {
  return createdDateFormatter.format(new Date(timestamp));
}

/**
 * Format task due date in "MMM DD, HH:MM AM/PM" format (e.g., "Jan 15, 10:00 AM")
 */
export function formatDueDate(timestamp: number): string {
  return dueDateFormatter.format(new Date(timestamp));
}

/**
 * Calculate and format task age based on creation timestamp
 * 
 * Format rules:
 * - < 24h: "New"
 * - < 7 days: "X days"
 * - >= 7 days: "X weeks"
 * - Future dates (clock skew): "Just now"
 * 
 * @param createdAt - Task creation timestamp
 * @returns Formatted age string
 */
export function formatTaskAge(createdAt: number): string {
  const now = Date.now();
  const ageInMs = now - createdAt;
  
  // Handle future dates (clock skew)
  if (ageInMs < 0) {
    return 'Just now';
  }
  
  const ageInHours = ageInMs / (1000 * 60 * 60);
  const ageInDays = Math.floor(ageInMs / (1000 * 60 * 60 * 24));
  
  // Less than 24 hours
  if (ageInHours < 24) {
    return 'New';
  }
  
  // Less than 7 days
  if (ageInDays < 7) {
    return `${ageInDays} ${ageInDays === 1 ? 'day' : 'days'}`;
  }
  
  // 7 days or more - convert to weeks
  const ageInWeeks = Math.floor(ageInDays / 7);
  return `${ageInWeeks} ${ageInWeeks === 1 ? 'week' : 'weeks'}`;
}

/**
 * Normalize a date to midnight (00:00:00.000) in local time
 * This strips the time component, keeping only the calendar date
 * 
 * @param timestamp - Date timestamp to normalize
 * @returns Timestamp normalized to midnight
 */
export function normalizeToStartOfDay(timestamp: number): number {
  const date = new Date(timestamp);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

/**
 * Check if a task is overdue based on its due date
 * A task is overdue if its due date is before today (yesterday or earlier)
 * 
 * @param dueDate - Task due date timestamp
 * @param now - Current timestamp (defaults to Date.now())
 * @returns true if task is overdue
 */
export function isTaskOverdue(dueDate: number, now: number = Date.now()): boolean {
  const dueDateNormalized = normalizeToStartOfDay(dueDate);
  const todayNormalized = normalizeToStartOfDay(now);
  return dueDateNormalized < todayNormalized;
}

/**
 * Check if a task is due today
 * A task is due today if its due date matches today's calendar date
 * 
 * @param dueDate - Task due date timestamp
 * @param now - Current timestamp (defaults to Date.now())
 * @returns true if task is due today
 */
export function isTaskDueToday(dueDate: number, now: number = Date.now()): boolean {
  const dueDateNormalized = normalizeToStartOfDay(dueDate);
  const todayNormalized = normalizeToStartOfDay(now);
  return dueDateNormalized === todayNormalized;
}

/**
 * Check if a task is due in the future
 * A task is due in the future if its due date is after today (tomorrow or later)
 * 
 * @param dueDate - Task due date timestamp
 * @param now - Current timestamp (defaults to Date.now())
 * @returns true if task is due in the future
 */
export function isTaskDueFuture(dueDate: number, now: number = Date.now()): boolean {
  const dueDateNormalized = normalizeToStartOfDay(dueDate);
  const todayNormalized = normalizeToStartOfDay(now);
  return dueDateNormalized > todayNormalized;
}

/**
 * Check if two dates are in the same month and year
 * 
 * @param date1 - First date to compare
 * @param date2 - Second date to compare
 * @returns true if both dates are in the same month and year
 */
export function isSameMonth(date1: Date, date2: Date): boolean {
  return date1.getMonth() === date2.getMonth() && 
         date1.getFullYear() === date2.getFullYear();
}
