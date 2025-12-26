import { useTaskContext } from '../../context/TaskContext';
import { useToast } from '../../context/ToastContext';
import { TaskItem } from './TaskItem';
import styles from './TaskList.module.css';

export function TaskList() {
  const { state, dispatch } = useTaskContext();
  const { showToast } = useToast();

  const handleDelete = (id: string) => {
    dispatch({ type: 'DELETE_TASK', payload: id });
    showToast('Task deleted');
  };

  // Filter tasks for the active list only
  const activeTasks = state.activeListId
    ? state.tasks.filter(task => task.listId === state.activeListId)
    : [];

  if (!state.activeListId) {
    return (
      <div className={styles.empty}>
        <p>No lists yet. Create one to get started!</p>
      </div>
    );
  }

  if (activeTasks.length === 0) {
    return (
      <div className={styles.empty}>
        <p>No tasks in this list yet.</p>
      </div>
    );
  }

  return (
    <div className={styles.taskList}>
      {activeTasks.map((task) => (
        <TaskItem key={task.id} task={task} onDelete={handleDelete} />
      ))}
    </div>
  );
}
