import { Task } from './types';
import styles from './TaskItem.module.css';
import { useCompactMode } from '../../context/CompactModeContext';
import { formatCreatedDate, formatTaskAge } from './utils';

interface TaskItemProps {
  task: Task;
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
}

function formatDueDate(timestamp: number): string {
  const formatter = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  return formatter.format(new Date(timestamp));
}

function isOverdue(dueDate: number): boolean {
  return dueDate < Date.now();
}

export function TaskItem({ task, onDelete, onEdit }: TaskItemProps) {
  const overdue = task.dueDate ? isOverdue(task.dueDate) : false;
  const { compactMode } = useCompactMode();
  
  return (
    <div className={`${styles.taskItem} ${overdue ? styles.overdue : ''} ${compactMode ? styles.compact : ''}`}>
      <div className={styles.content}>
        <span className={`${styles.badge} ${styles[task.priority]}`}>
          {task.priority.toUpperCase()}
        </span>
        {overdue && (
          <span className={styles.overdueBadge}>
            OVERDUE
          </span>
        )}
        <div className={styles.textContent}>
          <p className={styles.description}>{task.description}</p>
          {!compactMode && (
            <p className={styles.metadata}>
              Created: {formatCreatedDate(task.createdAt)} · Age: {formatTaskAge(task.createdAt)}
            </p>
          )}
          {task.dueDate && (
            <p className={styles.dueDate}>
              Due: {formatDueDate(task.dueDate)}
            </p>
          )}
        </div>
      </div>
      <div className={styles.actions}>
        <button
          onClick={() => onEdit(task)}
          className={styles.editButton}
          aria-label={`Edit task: ${task.description}`}
        >
          ✏️
        </button>
        <button
          onClick={() => onDelete(task.id)}
          className={styles.deleteButton}
          aria-label={`Delete task: ${task.description}`}
        >
          ✕
        </button>
      </div>
    </div>
  );
}
