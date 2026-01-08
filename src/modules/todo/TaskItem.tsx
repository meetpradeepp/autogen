import { Task } from './types';
import styles from './TaskItem.module.css';
import { useCompactMode } from '../../context/CompactModeContext';
import { formatCreatedDate, formatTaskAge, formatDueDate } from './utils';

interface TaskItemProps {
  task: Task;
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
  onToggleComplete: (id: string) => void;
}

function isOverdue(dueDate: number): boolean {
  return dueDate < Date.now();
}

export function TaskItem({ task, onDelete, onEdit, onToggleComplete }: TaskItemProps) {
  const overdue = task.dueDate ? isOverdue(task.dueDate) : false;
  const { compactMode } = useCompactMode();
  
  return (
    <div className={`${styles.taskItem} ${overdue ? styles.overdue : ''} ${compactMode ? styles.compact : ''} ${task.isCompleted ? styles.completed : ''}`}>
      <div className={styles.content}>
        <input
          type="checkbox"
          checked={task.isCompleted}
          onChange={() => onToggleComplete(task.id)}
          className={styles.checkbox}
          aria-label={`Mark task ${task.isCompleted ? 'incomplete' : 'complete'}: ${task.title}`}
        />
        <span className={`${styles.badge} ${styles[task.priority]}`}>
          {task.priority.toUpperCase()}
        </span>
        {overdue && (
          <span className={styles.overdueBadge}>
            OVERDUE
          </span>
        )}
        <div className={styles.textContent}>
          <p className={`${styles.title} ${task.isCompleted ? styles.strikethrough : ''}`}>
            {task.title}
            {task.description && (
              <span className={styles.notesIcon} title="Has notes">📝</span>
            )}
          </p>
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
          aria-label={`Edit task: ${task.title}`}
        >
          ✏️
        </button>
        <button
          onClick={() => onDelete(task.id)}
          className={styles.deleteButton}
          aria-label={`Delete task: ${task.title}`}
        >
          ✕
        </button>
      </div>
    </div>
  );
}
