import { useMemo } from 'react';
import { useTaskContext } from '../../context/TaskContext';
import styles from './ProductivityDashboard.module.css';

interface DashboardMetrics {
  openTasks: number;
  overdueTasks: number;
  dueTodayTasks: number;
  oldestTaskAge: number | null;
  totalLists: number;
}

export function ProductivityDashboard() {
  const { state } = useTaskContext();

  // Calculate metrics with memoization for performance
  const metrics = useMemo<DashboardMetrics>(() => {
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;

    // Open Tasks: all tasks (assuming all are incomplete in this system)
    const openTasks = state.tasks.length;

    // Overdue: tasks with dueDate < now
    const overdueTasks = state.tasks.filter(
      task => task.dueDate && task.dueDate < now
    ).length;

    // Due Today: tasks due within the next 24 hours
    const dueTodayTasks = state.tasks.filter(task => {
      if (!task.dueDate) return false;
      return task.dueDate >= now && task.dueDate < now + oneDayMs;
    }).length;

    // Oldest Task: age in days of the oldest task
    let oldestTaskAge: number | null = null;
    if (state.tasks.length > 0) {
      const oldestTask = state.tasks.reduce((oldest, task) => 
        task.createdAt < oldest.createdAt ? task : oldest
      );
      const ageMs = now - oldestTask.createdAt;
      oldestTaskAge = Math.floor(ageMs / oneDayMs);
    }

    // Total Lists
    const totalLists = state.lists.length;

    return {
      openTasks,
      overdueTasks,
      dueTodayTasks,
      oldestTaskAge,
      totalLists,
    };
  }, [state.tasks, state.lists]);

  // Empty state: no tasks and no lists
  const isEmpty = state.tasks.length === 0 && state.lists.length === 0;

  if (isEmpty) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <h1 className={styles.emptyTitle}>Welcome to Your Task Manager! 👋</h1>
          <p className={styles.emptyDescription}>
            Get started by creating your first list using the sidebar.
          </p>
          <p className={styles.emptyHint}>
            Lists help you organize tasks by project, context, or priority.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Productivity Dashboard</h1>
      <div className={styles.grid}>
        <div className={styles.widget}>
          <div className={styles.widgetIcon}>📋</div>
          <div className={styles.widgetValue}>{metrics.openTasks}</div>
          <div className={styles.widgetLabel}>Open Tasks</div>
        </div>

        <div className={styles.widget}>
          <div className={styles.widgetIcon}>⚠️</div>
          <div className={styles.widgetValue}>{metrics.overdueTasks}</div>
          <div className={styles.widgetLabel}>Overdue</div>
        </div>

        <div className={styles.widget}>
          <div className={styles.widgetIcon}>📅</div>
          <div className={styles.widgetValue}>{metrics.dueTodayTasks}</div>
          <div className={styles.widgetLabel}>Due Today</div>
        </div>

        <div className={styles.widget}>
          <div className={styles.widgetIcon}>⏰</div>
          <div className={styles.widgetValue}>
            {metrics.oldestTaskAge !== null ? `${metrics.oldestTaskAge} days` : 'N/A'}
          </div>
          <div className={styles.widgetLabel}>Oldest Task</div>
        </div>

        <div className={styles.widget}>
          <div className={styles.widgetIcon}>📁</div>
          <div className={styles.widgetValue}>{metrics.totalLists}</div>
          <div className={styles.widgetLabel}>Total Lists</div>
        </div>
      </div>
    </div>
  );
}
