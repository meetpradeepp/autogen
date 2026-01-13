import { useLocation } from 'react-router-dom';
import styles from './Header.module.css';
import { useCompactMode } from '../../context/CompactModeContext';

export function Header() {
  const { compactMode, toggleCompactMode } = useCompactMode();
  const location = useLocation();
  
  // Only show compact mode toggle on Task List views
  const isListView = location.pathname.startsWith('/list/');
  
  return (
    <header className={styles.header}>
      <div className={styles.logo}>
        <div className={styles.logoIcon}>✓</div>
        <h1 className={styles.title}>Task Manager</h1>
      </div>
      {isListView && (
        <div className={styles.controls}>
          <label className={styles.toggleLabel}>
            <input
              type="checkbox"
              checked={compactMode}
              onChange={toggleCompactMode}
              className={styles.toggleInput}
              aria-label="Toggle compact view"
            />
            <span className={styles.toggleText}>Compact View</span>
          </label>
        </div>
      )}
    </header>
  );
}
