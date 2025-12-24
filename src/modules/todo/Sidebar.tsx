import { useState, FormEvent, useEffect, useRef } from 'react';
import { useTaskContext } from '../../context/TaskContext';
import styles from './Sidebar.module.css';

export function Sidebar() {
  const { state, dispatch } = useTaskContext();
  const [newListName, setNewListName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const previousListCountRef = useRef(state.lists.length);

  // Close form when a list is successfully created
  useEffect(() => {
    if (state.lists.length > previousListCountRef.current && !state.error) {
      setNewListName('');
      setIsCreating(false);
    }
    previousListCountRef.current = state.lists.length;
  }, [state.lists.length, state.error]);

  const handleCreateList = (e: FormEvent) => {
    e.preventDefault();
    if (newListName.trim()) {
      dispatch({ type: 'CREATE_LIST', payload: newListName });
    }
  };

  const handleSwitchList = (listId: string) => {
    dispatch({ type: 'SWITCH_LIST', payload: listId });
  };

  const handleCancelCreate = () => {
    setNewListName('');
    setIsCreating(false);
    dispatch({ type: 'CLEAR_ERROR' });
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.header}>
        <h2 className={styles.title}>My Lists</h2>
      </div>

      <nav className={styles.listNav}>
        {state.lists.map((list) => (
          <button
            key={list.id}
            onClick={() => handleSwitchList(list.id)}
            className={`${styles.listItem} ${
              state.activeListId === list.id ? styles.active : ''
            }`}
          >
            {list.name}
          </button>
        ))}
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
    </aside>
  );
}
