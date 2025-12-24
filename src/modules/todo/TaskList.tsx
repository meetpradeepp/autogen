import { useTaskContext } from '../../context/TaskContext';
import { TaskItem } from './TaskItem';
import styles from './TaskList.module.css';

export function TaskList() {
  const { state, dispatch } = useTaskContext();

  const handleDelete = (id: string) => {
    dispatch({ type: 'DELETE_TASK', payload: id });
  };

  if (state.tasks.length === 0) {
    return (
      <div className={styles.empty}>
        <p>No tasks yet. Add your first task above!</p>
      </div>
    );
  }

  return (
    <div className={styles.taskList}>
      {state.tasks.map((task) => (
        <TaskItem key={task.id} task={task} onDelete={handleDelete} />
      ))}
    </div>
  );
}
