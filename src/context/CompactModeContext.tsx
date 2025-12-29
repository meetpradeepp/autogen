import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

const COMPACT_MODE_KEY = 'compactViewEnabled';

interface CompactModeContextValue {
  compactMode: boolean;
  toggleCompactMode: () => void;
}

const CompactModeContext = createContext<CompactModeContextValue | undefined>(undefined);

export function CompactModeProvider({ children }: { children: ReactNode }) {
  const [compactMode, setCompactMode] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(COMPACT_MODE_KEY);
      return stored === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(COMPACT_MODE_KEY, String(compactMode));
    } catch (error) {
      console.warn('Failed to save compact mode preference:', error);
    }
  }, [compactMode]);

  const toggleCompactMode = () => {
    setCompactMode(prev => !prev);
  };

  return (
    <CompactModeContext.Provider value={{ compactMode, toggleCompactMode }}>
      {children}
    </CompactModeContext.Provider>
  );
}

export function useCompactMode() {
  const context = useContext(CompactModeContext);
  if (!context) {
    throw new Error('useCompactMode must be used within CompactModeProvider');
  }
  return context;
}
