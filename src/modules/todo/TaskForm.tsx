import React, { useState, FormEvent, useEffect, useRef } from 'react';
import { useTaskContext } from '../../context/TaskContext';
import { useToast } from '../../context/ToastContext';
import { Priority } from '../todo/types';
import styles from './TaskForm.module.css';

export function TaskForm() {
  const { state, dispatch } = useTaskContext();
  const { showToast } = useToast();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [dueDate, setDueDate] = useState('');
  const previousTaskCountRef = useRef(state.tasks.length);

  // Clear form when a task is successfully added
  useEffect(() => {
    if (state.tasks.length > previousTaskCountRef.current && !state.error && state.tasks.length > 0) {
      const newTask = state.tasks[0]; // New tasks are prepended
      const truncatedTitle = newTask.title.length > 50 
        ? newTask.title.substring(0, 50) + '...' 
        : newTask.title;
      showToast(`Task '${truncatedTitle}' added`);
      setTitle('');
      setDescription('');
      setPriority('medium');
      setDueDate('');
    }
    previousTaskCountRef.current = state.tasks.length;
  }, [state.tasks.length, state.error, state.tasks, showToast]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    // Convert datetime-local string to timestamp if provided
    // HTML5 datetime-local input ensures valid format, but validate conversion
    let dueDateTimestamp: number | undefined;
    if (dueDate) {
      const timestamp = new Date(dueDate).getTime();
      dueDateTimestamp = !isNaN(timestamp) ? timestamp : undefined;
    }
    
    dispatch({
      type: 'ADD_TASK',
      payload: {
        title,
        description: description || undefined,
        priority,
        dueDate: dueDateTimestamp,
      },
    });
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    // Clear error when user starts typing
    if (state.error) {
      dispatch({ type: 'CLEAR_ERROR' });
    }
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDescription(e.target.value);
  };

  // State Guard: Only render TaskForm when an active list is selected
  // This prevents users from attempting to create tasks without context
  if (state.activeListId === null) {
    return null;
  }

  // Get the current active list for display
  const activeList = state.lists.find(list => list.id === state.activeListId);
  const activeListName = activeList?.name || 'Unknown List';

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.listIndicator}>
        <span className={styles.listLabel}>Adding to:</span>
        <span className={styles.listName} style={{ color: activeList?.color || '#4a5568' }}>
          {activeListName}
        </span>
      </div>
      
      <div className={styles.inputGroup}>
        <input
          type="text"
          value={title}
          onChange={handleTitleChange}
          placeholder="Task title (required)..."
          className={styles.input}
          aria-label="Task title"
          required
        />
        
        <textarea
          value={description}
          onChange={handleDescriptionChange}
          placeholder="Description (optional)..."
          className={styles.textarea}
          aria-label="Task description"
          rows={2}
        />
        
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value as Priority)}
          className={styles.select}
          aria-label="Task priority"
        >
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        
        <input
          type="datetime-local"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className={styles.dateInput}
          aria-label="Task due date"
        />
        
        <button type="submit" className={styles.button}>
          Add Task
        </button>
      </div>
      
      {state.error && (
        <div className={styles.error} role="alert">
          {state.error}
        </div>
      )}
    </form>
  );
}
