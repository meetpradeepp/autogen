import React, { useState, FormEvent, useEffect } from 'react';
import { useTaskContext } from '../../context/TaskContext';
import { useToast } from '../../context/ToastContext';
import { Priority, Task } from './types';
import styles from './EditTaskModal.module.css';

interface EditTaskModalProps {
  task: Task;
  onClose: () => void;
}

export function EditTaskModal({ task, onClose }: EditTaskModalProps) {
  const { state, dispatch } = useTaskContext();
  const { showToast } = useToast();
  const [description, setDescription] = useState(task.description);
  const [priority, setPriority] = useState<Priority>(task.priority);
  const [dueDate, setDueDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize due date from task
  useEffect(() => {
    if (task.dueDate) {
      // Convert timestamp to datetime-local format (YYYY-MM-DDTHH:MM)
      const date = new Date(task.dueDate);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      setDueDate(`${year}-${month}-${day}T${hours}:${minutes}`);
    }
  }, [task.dueDate]);

  // Verify task still exists
  useEffect(() => {
    const taskExists = state.tasks.find(t => t.id === task.id);
    if (!taskExists) {
      showToast('Task not found. It may have been deleted.');
      onClose();
    }
  }, [state.tasks, task.id, showToast, onClose]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    // Convert datetime-local string to timestamp if provided
    let dueDateTimestamp: number | undefined;
    if (dueDate) {
      const timestamp = new Date(dueDate).getTime();
      dueDateTimestamp = !isNaN(timestamp) ? timestamp : undefined;
    }
    
    setIsSubmitting(true);
    dispatch({
      type: 'UPDATE_TASK',
      payload: {
        id: task.id,
        description,
        priority,
        dueDate: dueDateTimestamp,
      },
    });
  };

  // Handle success/error after dispatch
  useEffect(() => {
    if (!isSubmitting) return;
    
    // If there's an error, don't close the modal
    if (state.error) {
      setIsSubmitting(false);
      return;
    }
    
    // Check if our task was actually updated (success case)
    const updatedTask = state.tasks.find(t => t.id === task.id);
    if (updatedTask && updatedTask.description === description && updatedTask.priority === priority) {
      showToast('Task updated successfully');
      setIsSubmitting(false);
      onClose();
    }
  }, [state.tasks, state.error, task.id, description, priority, isSubmitting, onClose, showToast]);

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDescription(e.target.value);
    // Clear error when user starts typing
    if (state.error) {
      dispatch({ type: 'CLEAR_ERROR' });
    }
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>Edit Task</h2>
          <button
            onClick={onClose}
            className={styles.closeButton}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="task-description" className={styles.label}>
              Description
            </label>
            <input
              id="task-description"
              type="text"
              value={description}
              onChange={handleDescriptionChange}
              placeholder="Enter task description..."
              className={styles.input}
              aria-label="Task description"
              autoFocus
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="task-priority" className={styles.label}>
              Priority
            </label>
            <select
              id="task-priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
              className={styles.select}
              aria-label="Task priority"
            >
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="task-due-date" className={styles.label}>
              Due Date
            </label>
            <input
              id="task-due-date"
              type="datetime-local"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className={styles.input}
              aria-label="Task due date"
            />
          </div>
          
          {state.error && (
            <div className={styles.error} role="alert">
              {state.error}
            </div>
          )}
          
          <div className={styles.actions}>
            <button
              type="button"
              onClick={onClose}
              className={styles.cancelButton}
            >
              Cancel
            </button>
            <button type="submit" className={styles.submitButton}>
              Update Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
