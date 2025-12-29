import styles from './Header.module.css';
import { useCompactMode } from '../../context/CompactModeContext';

export function Header() {
  const { compactMode, toggleCompactMode } = useCompactMode();
  
  return (
    <header className={styles.header}>
      <div className={styles.logo}>
        <div className={styles.logoIcon}>✓</div>
        <h1 className={styles.title}>Task Manager</h1>
      </div>
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
    </header>
  );
}
