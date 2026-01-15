import { useState, FormEvent, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTaskContext } from '../../context/TaskContext';
import { useToast } from '../../context/ToastContext';
import { DEFAULT_COLORS } from './reducer';
import styles from './Sidebar.module.css';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableListItemProps {
  id: string;
  name: string;
  color: string;
  isActive: boolean;
  onSwitch: (id: string) => void;
  onDelete: (id: string, name: string, e: React.MouseEvent) => void;
}

function SortableListItem({ id, name, color, isActive, onSwitch, onDelete }: SortableListItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${styles.listItem} ${isActive ? styles.active : ''} ${isDragging ? styles.dragging : ''}`}
    >
      <button
        onClick={() => onSwitch(id)}
        className={styles.listButton}
        {...attributes}
        {...listeners}
      >
        <span 
          className={styles.colorDot} 
          style={{ backgroundColor: color }}
          aria-hidden="true"
        />
        {name}
      </button>
      <button
        onClick={(e) => onDelete(id, name, e)}
        className={styles.deleteButton}
        aria-label={`Delete ${name}`}
        title="Delete list"
      >
        <svg 
          width="14" 
          height="14" 
          viewBox="0 0 16 16" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path 
            d="M6 2V1h4v1h3v1H3V2h3zM4 4h8v10H4V4zm2 2v6h1V6H6zm3 0v6h1V6H9z" 
            fill="currentColor"
          />
        </svg>
      </button>
    </div>
  );
}

export function Sidebar() {
  const { state, dispatch } = useTaskContext();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [newListName, setNewListName] = useState('');
  const [selectedColor, setSelectedColor] = useState(DEFAULT_COLORS[0]);
  const [isCreating, setIsCreating] = useState(false);
  const previousListCountRef = useRef(state.lists.length);

  // Configure drag sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Determine active view from URL
  const isCalendarView = location.pathname === '/calendar';
  const isDashboardView = location.pathname === '/';
  
  // Extract active list ID from URL (source of truth)
  const activeListIdFromUrl = location.pathname.startsWith('/list/') 
    ? location.pathname.split('/list/')[1] 
    : null;

  // Close form when a list is successfully created
  useEffect(() => {
    if (state.lists.length > previousListCountRef.current && !state.error && state.lists.length > 0) {
      const newList = state.lists[state.lists.length - 1];
      showToast(`List '${newList.name}' created`);
      setNewListName('');
      setSelectedColor(DEFAULT_COLORS[0]);
      setIsCreating(false);
      // Navigate to the new list
      navigate(`/list/${newList.id}`);
    }
    previousListCountRef.current = state.lists.length;
  }, [state.lists.length, state.error, state.lists, showToast, navigate]);

  const handleCreateList = (e: FormEvent) => {
    e.preventDefault();
    if (newListName.trim()) {
      dispatch({ type: 'CREATE_LIST', payload: { name: newListName, color: selectedColor } });
    }
  };

  /**
   * Navigate to a specific list view.
   * The URL is the source of truth for active list.
   */
  const handleSwitchList = (listId: string) => {
    navigate(`/list/${listId}`);
  };

  const handleDeleteList = (listId: string, listName: string, e: React.MouseEvent) => {
    // Prevent event bubbling to avoid selecting the list when clicking delete
    e.stopPropagation();
    
    // Show confirmation dialog
    const confirmed = window.confirm(
      `Are you sure you want to delete "${listName}"? This will permanently remove all tasks in this list.`
    );
    
    if (confirmed) {
      // Check if we're currently viewing this list
      const isViewingDeletedList = location.pathname === `/list/${listId}`;
      
      dispatch({ type: 'DELETE_LIST', payload: listId });
      showToast(`List '${listName}' deleted`);
      
      // If we're viewing the deleted list, redirect to dashboard
      if (isViewingDeletedList) {
        navigate('/', { replace: true });
      }
    }
  };

  const handleCancelCreate = () => {
    setNewListName('');
    setSelectedColor(DEFAULT_COLORS[0]);
    setIsCreating(false);
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const handleViewChange = (view: 'dashboard' | 'calendar') => {
    if (view === 'dashboard') {
      navigate('/');
    } else {
      navigate('/calendar');
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = state.lists.findIndex((list) => list.id === active.id);
      const newIndex = state.lists.findIndex((list) => list.id === over.id);

      // Only dispatch if both indices are valid
      if (oldIndex !== -1 && newIndex !== -1) {
        dispatch({
          type: 'REORDER_LISTS',
          payload: { oldIndex, newIndex },
        });
      }
    }
  };

  return (
    <aside className={styles.sidebar}>
      {/* Views Section */}
      <div className={styles.section}>
        <div className={styles.header}>
          <h2 className={styles.title}>Views</h2>
        </div>
        <nav className={styles.viewNav}>
          <button
            onClick={() => handleViewChange('dashboard')}
            className={`${styles.viewButton} ${isDashboardView ? styles.active : ''}`}
          >
            📊 Dashboard
          </button>
          <button
            onClick={() => handleViewChange('calendar')}
            className={`${styles.viewButton} ${isCalendarView ? styles.active : ''}`}
            disabled={state.lists.length === 0}
          >
            📅 Calendar
          </button>
        </nav>
      </div>

      {/* Task Lists Section */}
      <div className={styles.section}>
        <div className={styles.header}>
          <h2 className={styles.title}>Task Lists</h2>
        </div>

        <nav className={styles.listNav}>
          {state.lists.length === 0 ? (
            <div className={styles.emptyState}>No lists yet</div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={state.lists.map((list) => list.id)}
                strategy={verticalListSortingStrategy}
              >
                {state.lists.map((list) => (
                  <SortableListItem
                    key={list.id}
                    id={list.id}
                    name={list.name}
                    color={list.color}
                    isActive={activeListIdFromUrl === list.id}
                    onSwitch={handleSwitchList}
                    onDelete={handleDeleteList}
                  />
                ))}
              </SortableContext>
            </DndContext>
          )}
        </nav>

        {isCreating ? (
          <form onSubmit={handleCreateList} className={styles.createForm}>
            <input
              type="text"
              value={newListName}
              onChange={(e) => {
                setNewListName(e.target.value);
                if (state.error) {
                  dispatch({ type: 'CLEAR_ERROR' });
                }
              }}
              placeholder="List name..."
              className={styles.input}
              autoFocus
              aria-label="New list name"
            />
            
            <div className={styles.colorPicker}>
              <label className={styles.colorLabel}>Color:</label>
              <div className={styles.colorOptions}>
                {DEFAULT_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setSelectedColor(color)}
                    className={`${styles.colorOption} ${selectedColor === color ? styles.selected : ''}`}
                    style={{ backgroundColor: color }}
                    aria-label={`Select color ${color}`}
                    title={color}
                  />
                ))}
              </div>
            </div>
            
            <div className={styles.calendarInfo}>
              <span className={styles.infoIcon}>ℹ️</span>
              <span className={styles.infoText}>Tasks in this list will appear in My Calendar</span>
            </div>
            
            <div className={styles.formActions}>
              <button type="submit" className={styles.saveButton}>
                Save
              </button>
              <button
                type="button"
                onClick={handleCancelCreate}
                className={styles.cancelButton}
              >
                Cancel
              </button>
            </div>
            {state.error && (
              <div className={styles.error} role="alert">
                {state.error}
              </div>
            )}
          </form>
        ) : (
          <button
            onClick={() => setIsCreating(true)}
            className={styles.newListButton}
          >
            + New List
          </button>
        )}
      </div>
    </aside>
  );
}
