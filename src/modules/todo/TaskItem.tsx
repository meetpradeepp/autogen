import { Task } from './types';
import styles from './TaskItem.module.css';

interface TaskItemProps {
  task: Task;
  onDelete: (id: string) => void;
}

export function TaskItem({ task, onDelete }: TaskItemProps) {
  return (
    <div className={styles.taskItem}>
      <div className={styles.content}>
        <span className={`${styles.badge} ${styles[task.priority]}`}>
          {task.priority.toUpperCase()}
        </span>
        <p className={styles.description}>{task.description}</p>
      </div>
      <button
        onClick={() => onDelete(task.id)}
        className={styles.deleteButton}
        aria-label={`Delete task: ${task.description}`}
      >
        ✕
      </button>
    </div>
  );
}
