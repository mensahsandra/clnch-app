import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { Opportunity } from '../types';

const DEMO_OPPS: Opportunity[] = [
  {
    id: '1',
    title: 'TechForward Research Fellowship',
    org: 'TechForward Institute',
    category: 'fellowship',
    status: 'pending',
    urgency: 'High',
    daysLeft: 12,
    deadline: '2026-06-24',
    link: 'https://example.com/fellowship',
    requirements: [
      'Graduate or postgraduate student status',
      'Minimum 3.5 GPA',
      'Research focus in AI/ML or sustainability',
      'Two letters of recommendation',
    ],
    location: 'Accra, Ghana (Remote eligible)',
    contact: 'applications@techforward.org',
    monitorStatus: 'watching',
    lastCheckedAt: '2h ago',
  },
  {
    id: '2',
    title: 'Green Innovation Grant 2026',
    org: 'Climate Action Fund',
    category: 'grant',
    status: 'in_progress',
    urgency: 'Medium',
    daysLeft: 28,
    deadline: '2026-07-10',
    link: 'https://example.com/grant',
    requirements: ['Registered NGO or startup', 'Climate-focused project proposal', 'Budget under $50,000'],
  },
  {
    id: '3',
    title: 'AI Startup Accelerator Program',
    org: 'Founders Studio',
    category: 'accelerator',
    status: 'applied',
    urgency: 'High',
    daysLeft: 5,
    deadline: '2026-06-17',
    link: 'https://example.com/accelerator',
    requirements: ['Early-stage startup (pre-seed to seed)', 'AI/ML product focus', 'Team of at least 2 founders'],
  },
  {
    id: '4',
    title: 'Frontend Engineer — Remote',
    org: 'Vercel',
    category: 'job',
    status: 'saved',
    urgency: 'Low',
    daysLeft: 45,
    deadline: '2026-07-28',
    link: 'https://example.com/job',
    requirements: ['3+ years React experience', 'TypeScript proficiency', 'Experience with edge deployments'],
  },
  {
    id: '5',
    title: 'Africa Tech Summit 2026',
    org: 'AfriTech Alliance',
    category: 'conference',
    status: 'pending',
    urgency: 'Medium',
    daysLeft: 19,
    deadline: '2026-07-01',
    link: 'https://example.com/summit',
    requirements: ['Speaker application required', 'Abstract (300 words max)'],
    location: 'Lagos, Nigeria',
    monitorStatus: 'watching',
    lastCheckedAt: '4h ago',
  },
  {
    id: '6',
    title: 'Software Engineering Internship',
    org: 'Google Africa',
    category: 'internship',
    status: 'shortlisted',
    urgency: 'High',
    daysLeft: 3,
    deadline: '2026-06-15',
    link: 'https://example.com/intern',
    requirements: ['Currently enrolled in CS/Engineering degree', 'Python or Java proficiency', 'Available for 12 weeks'],
  },
];

interface OpportunitiesContextValue {
  opportunities: Opportunity[];
  addOpportunity: (opp: Opportunity) => void;
  updateOpportunity: (id: string, patch: Partial<Opportunity>) => void;
  deleteOpportunity: (id: string) => void;
}

const OpportunitiesContext = createContext<OpportunitiesContextValue | null>(null);

export function OpportunitiesProvider({ children }: { children: ReactNode }) {
  const [opportunities, setOpportunities] = useState<Opportunity[]>(DEMO_OPPS);

  const addOpportunity = useCallback((opp: Opportunity) => {
    setOpportunities((prev) => [opp, ...prev]);
  }, []);

  const updateOpportunity = useCallback((id: string, patch: Partial<Opportunity>) => {
    setOpportunities((prev) => prev.map((o) => (o.id === id ? { ...o, ...patch } : o)));
  }, []);

  const deleteOpportunity = useCallback((id: string) => {
    setOpportunities((prev) => prev.filter((o) => o.id !== id));
  }, []);

  return (
    <OpportunitiesContext.Provider value={{ opportunities, addOpportunity, updateOpportunity, deleteOpportunity }}>
      {children}
    </OpportunitiesContext.Provider>
  );
}

export function useOpportunities() {
  const ctx = useContext(OpportunitiesContext);
  if (!ctx) throw new Error('useOpportunities must be used within OpportunitiesProvider');
  return ctx;
}

export { DEMO_OPPS };
