import { useState } from 'react';
import { useTaskContext } from '../../context/TaskContext';
import { useToast } from '../../context/ToastContext';
import { TaskItem } from './TaskItem';
import styles from './TaskList.module.css';

export function TaskList() {
  const { state, dispatch } = useTaskContext();
  const { showToast } = useToast();
  const [sortByDueDate, setSortByDueDate] = useState(false);

  const handleDelete = (id: string) => {
    dispatch({ type: 'DELETE_TASK', payload: id });
    showToast('Task deleted');
  };

  // Filter tasks for the active list only
  const activeTasks = state.activeListId
    ? state.tasks.filter(task => task.listId === state.activeListId)
    : [];

  // Sort tasks based on toggle
  const sortedTasks = [...activeTasks].sort((a, b) => {
    if (sortByDueDate) {
      // Sort by due date: tasks with due dates first, then by date ascending
      // Tasks without due dates go to the end
      if (!a.dueDate && !b.dueDate) return b.createdAt - a.createdAt;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return a.dueDate - b.dueDate;
    } else {
      // Default: sort by creation time (newest first)
      return b.createdAt - a.createdAt;
    }
  });

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
    <div className={styles.container}>
      <div className={styles.header}>
        <button
          onClick={() => setSortByDueDate(!sortByDueDate)}
          className={styles.sortButton}
          aria-label={sortByDueDate ? 'Sort by creation time' : 'Sort by due date'}
        >
          {sortByDueDate ? '📅 Sorted by Due Date' : '🕒 Sorted by Creation Time'}
        </button>
      </div>
      <div className={styles.taskList}>
        {sortedTasks.map((task) => (
          <TaskItem key={task.id} task={task} onDelete={handleDelete} />
        ))}
      </div>
    </div>
  );
}
