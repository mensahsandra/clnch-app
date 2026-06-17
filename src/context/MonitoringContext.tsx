import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { WebMonitor, OpportunityCategory } from '../types';
import { createWebMonitor } from '../services/firecrawlService';

const STORAGE_KEY = 'clnch_web_monitors';
const ENABLED_KEY = 'clnch_monitoring_enabled';

interface MonitoringContextValue {
  enabled: boolean;
  setEnabled: (v: boolean) => void;
  monitors: WebMonitor[];
  addMonitor: (input: {
    name: string;
    url: string;
    goal: string;
    category: OpportunityCategory;
    email?: string;
  }) => Promise<WebMonitor>;
  removeMonitor: (id: string) => void;
  simulateChange: (id: string, summary: string) => void;
}

const MonitoringContext = createContext<MonitoringContextValue | null>(null);

function loadMonitors(): WebMonitor[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function MonitoringProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabledState] = useState(() => {
    try {
      return localStorage.getItem(ENABLED_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const [monitors, setMonitors] = useState<WebMonitor[]>(loadMonitors);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(monitors));
    } catch {
      /* ignore */
    }
  }, [monitors]);

  const setEnabled = useCallback((v: boolean) => {
    setEnabledState(v);
    try {
      localStorage.setItem(ENABLED_KEY, String(v));
    } catch {
      /* ignore */
    }
  }, []);

  const addMonitor = useCallback(
    async (input: {
      name: string;
      url: string;
      goal: string;
      category: OpportunityCategory;
      email?: string;
    }) => {
      const draft: WebMonitor = {
        id: `mon-${Date.now()}`,
        name: input.name,
        url: input.url,
        goal: input.goal,
        category: input.category,
        schedule: 'every 6 hours',
        status: 'watching',
        lastCheckedAt: 'just now',
        email: input.email,
      };

      if (enabled) {
        try {
          const { monitorId } = await createWebMonitor(draft);
          draft.monitorId = monitorId;
        } catch {
          /* keep local monitor even if API fails */
        }
      }

      setMonitors((prev) => [draft, ...prev]);
      return draft;
    },
    [enabled]
  );

  const removeMonitor = useCallback((id: string) => {
    setMonitors((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const simulateChange = useCallback((id: string, summary: string) => {
    setMonitors((prev) =>
      prev.map((m) =>
        m.id === id
          ? { ...m, status: 'changed', changeSummary: summary, lastCheckedAt: 'just now' }
          : m
      )
    );
  }, []);

  return (
    <MonitoringContext.Provider
      value={{ enabled, setEnabled, monitors, addMonitor, removeMonitor, simulateChange }}
    >
      {children}
    </MonitoringContext.Provider>
  );
}

export function useMonitoring() {
  const ctx = useContext(MonitoringContext);
  if (!ctx) throw new Error('useMonitoring must be used within MonitoringProvider');
  return ctx;
}
