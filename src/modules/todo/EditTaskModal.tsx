import React, { useState, FormEvent, useEffect } from 'react';
import { useTaskContext } from '../../context/TaskContext';
import { useToast } from '../../context/ToastContext';
import { Priority, Task } from './types';
import styles from './EditTaskModal.module.css';

interface TaskModalProps {
  task?: Task; // Optional - undefined for create mode
  initialDueDate?: number; // Optional - pre-filled due date for create mode
  forceListId?: string; // Optional - when set, list field is read-only (for list view creation)
  onClose: () => void;
}

export function TaskModal({ task, initialDueDate, forceListId, onClose }: TaskModalProps) {
  const { state, dispatch } = useTaskContext();
  const { showToast } = useToast();
  const isEditMode = !!task;
  const [description, setDescription] = useState(task?.description || '');
  const [priority, setPriority] = useState<Priority>(task?.priority || 'medium');
  const [dueDate, setDueDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // List selection state
  // Priority: forceListId (read-only) > task's current list (edit mode) > first available list (create mode)
  const getInitialListId = (): string => {
    if (forceListId) return forceListId;
    if (task?.listId) return task.listId;
    // For create mode from calendar: default to first list or empty string
    return state.lists.length > 0 ? state.lists[0].id : '';
  };
  
  const [selectedListId, setSelectedListId] = useState<string>(getInitialListId());

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
    
    // Validate list selection
    if (!selectedListId) {
      dispatch({ type: 'SET_ERROR', payload: 'Please select a list' });
      return;
    }
    
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
      // Only include listId if it changed (moving task to different list)
      const listIdChanged = selectedListId !== task!.listId;
      dispatch({
        type: 'UPDATE_TASK',
        payload: {
          id: task!.id,
          description,
          priority,
          dueDate: dueDateTimestamp,
          ...(listIdChanged && { listId: selectedListId }),
        },
      });
    } else {
      // Create new task with explicit list selection
      dispatch({
        type: 'ADD_TASK',
        payload: {
          description,
          priority,
          dueDate: dueDateTimestamp,
          listId: selectedListId,
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
          updatedTask.priority === priority &&
          updatedTask.listId === selectedListId) {
        // Task was updated successfully (including potential list change)
        const wasMoved = selectedListId !== task!.listId;
        showToast(wasMoved ? 'Task moved successfully' : 'Task updated successfully');
        setIsSubmitting(false);
        onClose();
      }
    } else {
      // In create mode, find task matching our input (newest task with matching criteria)
      // Check tasks in reverse chronological order to find the most recently created
      const matchingTask = state.tasks.find(t => 
        t.description === description && 
        t.priority === priority &&
        t.listId === selectedListId
      );
      
      if (matchingTask) {
        // Task was created successfully
        showToast('Task created successfully');
        setIsSubmitting(false);
        onClose();
      }
    }
  }, [state.tasks, state.error, task, description, priority, selectedListId, isSubmitting, isEditMode, onClose, showToast]);

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
            <label htmlFor="task-list" className={styles.label}>
              Task List
            </label>
            {forceListId ? (
              // Read-only mode: Show list name when creating from list view
              <div className={styles.readOnlyField}>
                {state.lists.find(l => l.id === forceListId)?.name || 'Unknown List'}
              </div>
            ) : (
              // Editable mode: Show dropdown for calendar create and edit modes
              <select
                id="task-list"
                value={selectedListId}
                onChange={(e) => setSelectedListId(e.target.value)}
                className={styles.select}
                aria-label="Task list"
                disabled={state.lists.length === 0}
              >
                {state.lists.length === 0 ? (
                  <option value="">No lists available</option>
                ) : (
                  state.lists.map(list => (
                    <option key={list.id} value={list.id}>
                      {list.name}
                    </option>
                  ))
                )}
              </select>
            )}
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
