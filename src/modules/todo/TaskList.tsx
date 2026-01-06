import { useTaskContext } from '../../context/TaskContext';
import { useToast } from '../../context/ToastContext';
import { TaskItem } from './TaskItem';
import { Task, SortOption } from './types';
import styles from './TaskList.module.css';

/**
 * Sort tasks based on selected option with stable fallback to Date Added
 */
function sortTasks(tasks: Task[], sortOption: SortOption): Task[] {
  return [...tasks].sort((a, b) => {
    // Primary sort based on option
    if (sortOption === 'priority') {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      const aPriority = a.priority || 'low'; // Treat missing priority as low
      const bPriority = b.priority || 'low';
      const priorityDiff = priorityOrder[aPriority] - priorityOrder[bPriority];
      if (priorityDiff !== 0) return priorityDiff;
    } else if (sortOption === 'alphabetical') {
      const comparison = a.description.toLowerCase().localeCompare(b.description.toLowerCase());
      if (comparison !== 0) return comparison;
    }
    // Secondary sort: Always fallback to Date Added (newest first) for stable sort
    return b.createdAt - a.createdAt;
  });
}

export function TaskList() {
  const { state, dispatch } = useTaskContext();
  const { showToast } = useToast();

  // Get current sort preference for active list (default: dateAdded)
  const currentSort: SortOption = state.activeListId 
    ? (state.sortPreferences[state.activeListId] || 'dateAdded')
    : 'dateAdded';

  const handleDelete = (id: string) => {
    dispatch({ type: 'DELETE_TASK', payload: id });
    showToast('Task deleted');
  };

  const handleSortChange = (sortOption: SortOption) => {
    if (state.activeListId) {
      dispatch({
        type: 'SET_SORT_PREFERENCE',
        payload: { listId: state.activeListId, sortOption },
      });
    }
  };

  // Filter tasks for the active list only
  const activeTasks = state.activeListId
    ? state.tasks.filter(task => task.listId === state.activeListId)
    : [];

  // Sort tasks based on current preference
  const sortedTasks = sortTasks(activeTasks, currentSort);

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

  // Show sort control only if there are 2+ tasks
  const showSortControl = activeTasks.length > 1;

  return (
    <div className={styles.container}>
      {showSortControl && (
        <div className={styles.header}>
          <label htmlFor="sort-select" className={styles.sortLabel}>
            Sort by:
          </label>
          <select
            id="sort-select"
            value={currentSort}
            onChange={(e) => handleSortChange(e.target.value as SortOption)}
            className={styles.sortSelect}
            aria-label="Sort tasks"
          >
            <option value="dateAdded">Date Added (Newest → Oldest)</option>
            <option value="priority">Priority (High → Low)</option>
            <option value="alphabetical">Alphabetical (A → Z)</option>
          </select>
        </div>
      )}
      <div className={styles.taskList}>
        {sortedTasks.map((task) => (
          <TaskItem key={task.id} task={task} onDelete={handleDelete} />
        ))}
      </div>
    </div>
  );
}
