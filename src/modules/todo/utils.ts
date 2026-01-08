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
