import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';

const STORAGE_KEY = 'clnch_sidebar_expanded';
const COLLAPSED_WIDTH = 56;
const EXPANDED_WIDTH = 240;

interface SidebarContextValue {
  expanded: boolean;
  width: number;
  toggleExpanded: () => void;
  setExpanded: (v: boolean) => void;
}

const SidebarContext = createContext<SidebarContextValue | null>(null);

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [expanded, setExpandedState] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) !== 'false';
    } catch {
      return true;
    }
  });

  const setExpanded = useCallback((v: boolean) => {
    setExpandedState(v);
    try {
      localStorage.setItem(STORAGE_KEY, String(v));
    } catch {
      /* ignore */
    }
  }, []);

  const toggleExpanded = useCallback(() => setExpanded(!expanded), [expanded, setExpanded]);

  const width = expanded ? EXPANDED_WIDTH : COLLAPSED_WIDTH;

  return (
    <SidebarContext.Provider value={{ expanded, width, toggleExpanded, setExpanded }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error('useSidebar must be used within SidebarProvider');
  return ctx;
}

export { COLLAPSED_WIDTH, EXPANDED_WIDTH };
