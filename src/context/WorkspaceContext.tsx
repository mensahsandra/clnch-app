import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

interface WorkspaceContextValue {
  rightPanelWidth: number;
  setRightPanelWidth: (width: number) => void;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [rightPanelWidth, setRightPanelWidthState] = useState(0);

  const setRightPanelWidth = useCallback((width: number) => {
    setRightPanelWidthState(width);
  }, []);

  return (
    <WorkspaceContext.Provider value={{ rightPanelWidth, setRightPanelWidth }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error('useWorkspace must be used within WorkspaceProvider');
  return ctx;
}
