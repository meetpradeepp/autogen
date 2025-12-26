import React, { useState, FormEvent, useEffect, useRef } from 'react';
import { useTaskContext } from '../../context/TaskContext';
import { useToast } from '../../context/ToastContext';
import { Priority } from '../todo/types';
import styles from './TaskForm.module.css';

export function TaskForm() {
  const { state, dispatch } = useTaskContext();
  const { showToast } = useToast();
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const previousTaskCountRef = useRef(state.tasks.length);

  // Clear form when a task is successfully added
  useEffect(() => {
    if (state.tasks.length > previousTaskCountRef.current && !state.error) {
      const newTask = state.tasks[0]; // New tasks are prepended
      const truncatedDesc = newTask.description.length > 50 
        ? newTask.description.substring(0, 50) + '...' 
        : newTask.description;
      showToast(`Task '${truncatedDesc}' added`);
      setDescription('');
      setPriority('medium');
    }
    previousTaskCountRef.current = state.tasks.length;
  }, [state.tasks.length, state.error, state.tasks, showToast]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    dispatch({
      type: 'ADD_TASK',
      payload: {
        description,
        priority,
      },
    });
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDescription(e.target.value);
    // Clear error when user starts typing
    if (state.error) {
      dispatch({ type: 'CLEAR_ERROR' });
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.inputGroup}>
        <input
          type="text"
          value={description}
          onChange={handleDescriptionChange}
          placeholder="Enter task description..."
          className={styles.input}
          aria-label="Task description"
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
