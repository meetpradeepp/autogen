import { useMemo } from 'react';
import { useTaskContext } from '../../context/TaskContext';
import { Task, TodoList } from './types';
import { isTaskOverdue, isTaskDueToday, normalizeToStartOfDay } from './utils';
import styles from './TaskSummaryModal.module.css';

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

interface TaskSummaryModalProps {
  title: string;
  filterType: 'open' | 'overdue' | 'dueToday';
  onClose: () => void;
  onTaskClick?: (task: Task) => void;
}

export function TaskSummaryModal({ title, filterType, onClose, onTaskClick }: TaskSummaryModalProps) {
  const { state } = useTaskContext();

  // Filter tasks based on type - calculated on click per requirements
  const filteredTasks = useMemo(() => {
    const now = Date.now();

    switch (filterType) {
      case 'overdue':
        return state.tasks.filter(task => !task.isCompleted && task.dueDate && isTaskOverdue(task.dueDate, now));
      case 'dueToday':
        return state.tasks.filter(task => {
          if (task.isCompleted || !task.dueDate) return false;
          return isTaskDueToday(task.dueDate, now);
        });
      case 'open':
      default:
        return state.tasks.filter(task => !task.isCompleted);
    }
  }, [state.tasks, filterType]);

  // Group tasks by list
  const tasksByList = useMemo(() => {
    const grouped = new Map<string, { list: TodoList; tasks: Task[] }>();

    filteredTasks.forEach(task => {
      const list = state.lists.find(l => l.id === task.listId);
      if (!list) return; // Skip tasks from deleted lists

      if (!grouped.has(task.listId)) {
        grouped.set(task.listId, { list, tasks: [] });
      }
      grouped.get(task.listId)!.tasks.push(task);
    });

    return Array.from(grouped.values());
  }, [filteredTasks, state.lists]);

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleTaskClick = (task: Task) => {
    if (onTaskClick) {
      onTaskClick(task);
    }
  };

  const formatDueDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    
    // Normalize dates to compare only the calendar date, not time
    const dueDateNormalized = normalizeToStartOfDay(timestamp);
    const todayNormalized = normalizeToStartOfDay(now.getTime());
    const diffMs = dueDateNormalized - todayNormalized;
    const diffDays = Math.floor(diffMs / MILLISECONDS_PER_DAY);

    if (diffDays === 0) {
      return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays === -1) {
      return 'Due yesterday';
    } else if (diffDays < -1) {
      return `Due ${Math.abs(diffDays)} days ago`;
    } else if (diffDays === 1) {
      return 'Due tomorrow';
    } else {
      return `Due ${date.toLocaleDateString()}`;
    }
  };

  return (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>{title}</h2>
          <button
            onClick={onClose}
            className={styles.closeButton}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        <div className={styles.body}>
          {filteredTasks.length === 0 ? (
            <div className={styles.emptyState}>
              {filterType === 'overdue' && 'No tasks are overdue'}
              {filterType === 'dueToday' && 'No tasks are due today'}
              {filterType === 'open' && 'No open tasks'}
            </div>
          ) : (
            tasksByList.map(({ list, tasks }) => (
              <div key={list.id} className={styles.listGroup}>
                <h3 className={styles.listHeader}>
                  <span
                    className={styles.listColor}
                    style={{ backgroundColor: list.color }}
                  />
                  {list.name}
                </h3>
                <ul className={styles.taskList}>
                  {tasks.map(task => {
                    const isOverdue = task.dueDate && isTaskOverdue(task.dueDate);
                    return (
                      <li
                        key={task.id}
                        className={styles.taskItem}
                        onClick={() => handleTaskClick(task)}
                      >
                        <span className={styles.taskIcon}>
                          {isOverdue ? '⚠️' : '📋'}
                        </span>
                        <div className={styles.taskContent}>
                          <p className={styles.taskTitle}>{task.title}</p>
                          <div className={styles.taskMeta}>
                            <span className={styles.taskMetaItem}>
                              <span
                                className={`${styles.priorityBadge} ${
                                  task.priority === 'high'
                                    ? styles.priorityHigh
                                    : task.priority === 'medium'
                                    ? styles.priorityMedium
                                    : styles.priorityLow
                                }`}
                              >
                                {task.priority}
                              </span>
                            </span>
                            {task.dueDate && (
                              <span
                                className={`${styles.taskMetaItem} ${
                                  isOverdue ? styles.overdue : ''
                                }`}
                              >
                                {formatDueDate(task.dueDate)}
                              </span>
                            )}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
