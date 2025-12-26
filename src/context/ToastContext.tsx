import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import styles from './Toast.module.css';

/**
 * Truncate message for display to prevent layout issues
 */
function truncateMessage(message: string, maxLength: number = 200): string {
  if (message.length <= maxLength) {
    return message;
  }
  return message.substring(0, maxLength) + '...';
}

interface Toast {
  id: string;
  message: string;
}

interface ToastContextValue {
  showToast: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<Toast | null>(null);

  const showToast = useCallback((message: string) => {
    const id = crypto.randomUUID();
    setToast({ id, message });
  }, []);

  const hideToast = useCallback(() => {
    setToast(null);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && <Toast message={toast.message} onDismiss={hideToast} />}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

interface ToastProps {
  message: string;
  onDismiss: () => void;
}

function Toast({ message, onDismiss }: ToastProps) {
  const [isExiting, setIsExiting] = useState(false);

  // Auto-dismiss after 3 seconds
  useEffect(() => {
    const dismissTimer = setTimeout(() => {
      setIsExiting(true);
    }, 3000);

    const removeTimer = setTimeout(() => {
      onDismiss();
    }, 3300);

    return () => {
      clearTimeout(dismissTimer);
      clearTimeout(removeTimer);
    };
  }, [onDismiss]);

  return (
    <div
      role="status"
      aria-live="polite"
      className={isExiting ? styles['toast-exit'] : styles['toast-enter']}
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        color: 'white',
        padding: '12px 20px',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
        zIndex: 9999,
        maxWidth: '400px',
        wordWrap: 'break-word',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        fontSize: '14px',
        fontWeight: 500,
      }}
    >
      {truncateMessage(message)}
    </div>
  );
}
