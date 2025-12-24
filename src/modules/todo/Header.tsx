import styles from './Header.module.css';

export function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.logo}>
        <div className={styles.logoIcon}>✓</div>
        <h1 className={styles.title}>Task Manager</h1>
      </div>
    </header>
  );
}
