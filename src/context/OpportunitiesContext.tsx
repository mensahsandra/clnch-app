import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from './AuthContext';
import type { Opportunity } from '../types';

interface OpportunitiesContextValue {
  opportunities: Opportunity[];
  loading: boolean;
  error: string | null;
  addOpportunity: (opp: Opportunity) => void;
  updateOpportunity: (id: string, patch: Partial<Opportunity>) => void;
  deleteOpportunity: (id: string) => void;
  refresh: () => Promise<void>;
}

const OpportunitiesContext = createContext<OpportunitiesContextValue | null>(null);

function daysUntil(deadline?: string): number {
  if (!deadline) return 30;
  const parsed = Date.parse(deadline);
  if (Number.isNaN(parsed)) return 30;
  return Math.max(0, Math.ceil((parsed - Date.now()) / 86400000));
}

function urgencyFromDays(days: number): 'High' | 'Medium' | 'Low' {
  if (days <= 7) return 'High';
  if (days <= 21) return 'Medium';
  return 'Low';
}

function mapRowToOpportunity(row: Record<string, unknown>): Opportunity {
  const deadline = row.deadline as string | undefined;
  const days = daysUntil(deadline);
  return {
    id: row.id as string,
    title: (row.title as string) || (row.organization as string) || 'Untitled Opportunity',
    org: row.organization as string,
    category: row.category as Opportunity['category'],
    status: row.status as Opportunity['status'],
    urgency: urgencyFromDays(days),
    daysLeft: days,
    deadline: deadline || undefined,
    link: row.link as string | undefined,
    requirements: row.requirements as string[] | undefined,
    location: row.location as string | undefined,
    contact: undefined,
    description: row.description as string | undefined,
  monitorStatus: undefined,
    monitorGoal: undefined,
    monitorId: undefined,
    lastCheckedAt: undefined,
    changeSummary: undefined,
    archived: row.status === 'archived',
  };
}

export function OpportunitiesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOpportunities = useCallback(async () => {
    if (!user) {
      setOpportunities([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('opportunities')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      const mapped = (data || []).map(mapRowToOpportunity);
      setOpportunities(mapped);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load opportunities';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchOpportunities();
  }, [fetchOpportunities]);

  const addOpportunity = useCallback((opp: Opportunity) => {
    setOpportunities((prev) => [opp, ...prev]);
  }, []);

  const updateOpportunity = useCallback((id: string, patch: Partial<Opportunity>) => {
    setOpportunities((prev) => prev.map((o) => (o.id === id ? { ...o, ...patch } : o)));
  }, []);

  const deleteOpportunity = useCallback((id: string) => {
    setOpportunities((prev) => prev.filter((o) => o.id !== id));
  }, []);

  const refresh = useCallback(async () => {
    await fetchOpportunities();
  }, [fetchOpportunities]);

  return (
    <OpportunitiesContext.Provider value={{ opportunities, loading, error, addOpportunity, updateOpportunity, deleteOpportunity, refresh }}>
      {children}
    </OpportunitiesContext.Provider>
  );
}

export function useOpportunities() {
  const ctx = useContext(OpportunitiesContext);
  if (!ctx) throw new Error('useOpportunities must be used within OpportunitiesProvider');
  return ctx;
}
