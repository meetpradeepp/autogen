import { Task } from './types';
import styles from './TaskItem.module.css';
import { useCompactMode } from '../../context/CompactModeContext';

interface TaskItemProps {
  task: Task;
  onDelete: (id: string) => void;
}

export function TaskItem({ task, onDelete }: TaskItemProps) {
  const { compactMode } = useCompactMode();
  
  return (
    <div className={`${styles.taskItem} ${compactMode ? styles.compact : ''}`}>
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
