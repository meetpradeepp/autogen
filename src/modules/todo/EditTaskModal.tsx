import React, { useState, FormEvent, useEffect } from 'react';
import { useTaskContext } from '../../context/TaskContext';
import { useToast } from '../../context/ToastContext';
import { Priority, Task } from './types';
import styles from './EditTaskModal.module.css';

interface TaskModalProps {
  task?: Task; // Optional - undefined for create mode
  initialDueDate?: number; // Optional - pre-filled due date for create mode
  onClose: () => void;
}

export function TaskModal({ task, initialDueDate, onClose }: TaskModalProps) {
  const { state, dispatch } = useTaskContext();
  const { showToast } = useToast();
  const isEditMode = !!task;
  const [description, setDescription] = useState(task?.description || '');
  const [priority, setPriority] = useState<Priority>(task?.priority || 'medium');
  const [dueDate, setDueDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize due date from task or initialDueDate
  useEffect(() => {
    const timestamp = task?.dueDate || initialDueDate;
    if (timestamp) {
      // Convert timestamp to datetime-local format (YYYY-MM-DDTHH:MM)
      const date = new Date(timestamp);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      setDueDate(`${year}-${month}-${day}T${hours}:${minutes}`);
    }
  }, [task?.dueDate, initialDueDate]);

  // Verify task still exists (only in edit mode)
  useEffect(() => {
    if (!isEditMode) return;
    const taskExists = state.tasks.find(t => t.id === task!.id);
    if (!taskExists) {
      showToast('Task not found. It may have been deleted.');
      onClose();
    }
  }, [state.tasks, task, isEditMode, showToast, onClose]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    // Maximum valid JavaScript timestamp
    const MAX_SAFE_TIMESTAMP = 8640000000000000;
    
    // Convert datetime-local string to timestamp if provided
    let dueDateTimestamp: number | undefined;
    if (dueDate) {
      const timestamp = new Date(dueDate).getTime();
      // Validate timestamp matches reducer validation
      dueDateTimestamp = (isFinite(timestamp) && timestamp > 0 && timestamp <= MAX_SAFE_TIMESTAMP) 
        ? timestamp 
        : undefined;
    }
    
    setIsSubmitting(true);
    
    if (isEditMode) {
      // Update existing task
      dispatch({
        type: 'UPDATE_TASK',
        payload: {
          id: task!.id,
          description,
          priority,
          dueDate: dueDateTimestamp,
        },
      });
    } else {
      // Create new task
      dispatch({
        type: 'ADD_TASK',
        payload: {
          description,
          priority,
          dueDate: dueDateTimestamp,
        },
      });
    }
  };

  // Handle success/error after dispatch
  useEffect(() => {
    if (!isSubmitting) return;
    
    // If there's an error, don't close the modal
    if (state.error) {
      setIsSubmitting(false);
      return;
    }
    
    if (isEditMode) {
      // Check if our task was actually updated (success case)
      const updatedTask = state.tasks.find(t => t.id === task!.id);
      if (updatedTask && 
          updatedTask.description === description && 
          updatedTask.priority === priority) {
        // Task was updated successfully
        showToast('Task updated successfully');
        setIsSubmitting(false);
        onClose();
      }
    } else {
      // In create mode, check if a new task was added
      const newestTask = state.tasks[0]; // Tasks are prepended
      if (newestTask && 
          newestTask.description === description && 
          newestTask.priority === priority) {
        // Task was created successfully
        showToast('Task created successfully');
        setIsSubmitting(false);
        onClose();
      }
    }
  }, [state.tasks, state.error, task, description, priority, isSubmitting, isEditMode, onClose, showToast]);

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
          <h2 className={styles.title}>{isEditMode ? 'Edit Task' : 'Create Task'}</h2>
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
              {isEditMode ? 'Update Task' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Keep the old name as an alias for backward compatibility
export const EditTaskModal = TaskModal;
