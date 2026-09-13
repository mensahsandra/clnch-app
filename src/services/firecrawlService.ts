import type { OpportunityCategory, WebMonitor } from '../types';

// Firecrawl API calls have been moved server-side to the extract edge function.
// This file now only contains shared utility functions used by the frontend.

function normalizeUrl(raw: string): string {
  const trimmed = raw.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function inferCategory(text: string): OpportunityCategory {
  const lower = text.toLowerCase();
  if (/fellowship|scholar/.test(lower)) return 'fellowship';
  if (/grant|fund/.test(lower)) return 'grant';
  if (/accelerator|incubator/.test(lower)) return 'accelerator';
  if (/conference|summit|event|workshop/.test(lower)) return 'conference';
  if (/intern/.test(lower)) return 'internship';
  if (/job|engineer|hire|career|role/.test(lower)) return 'job';
  return 'fellowship';
}

export function daysUntil(deadline?: string): number {
  if (!deadline) return 30;
  const parsed = Date.parse(deadline);
  if (Number.isNaN(parsed)) return 30;
  return Math.max(0, Math.ceil((parsed - Date.now()) / 86400000));
}

export function urgencyFromDays(days: number): 'High' | 'Medium' | 'Low' {
  if (days <= 7) return 'High';
  if (days <= 21) return 'Medium';
  return 'Low';
}

export function extractUrlFromText(text: string): string | null {
  const match = text.match(/https?:\/\/[^\s<>"{}|\\^`[\]]+/i);
  if (match) return match[0].replace(/[.,;:!?)]+$/, '');
  if (/^[\w-]+\.(com|org|net|io|dev|co|edu|gov)(\/\S*)?$/i.test(text.trim())) {
    return normalizeUrl(text.trim());
  }
  return null;
}

export function buildMonitorGoal(url: string, userGoal?: string, category?: OpportunityCategory): string {
  const typeHints: Record<string, string> = {
    fellowship: 'application status, deadline, or eligibility changes',
    grant: 'application status, deadline, or eligibility changes',
    accelerator: 'cohort announcement or application window changes',
    conference: 'ticket sales, agenda, or speaker list changes',
    job: 'role changes or application close date changes',
    internship: 'role changes or application close date changes',
  };

  const hint = category ? typeHints[category] ?? 'meaningful content changes' : 'meaningful content changes';
  const custom = userGoal?.trim() ? `\nUser goal: ${userGoal.trim()}` : '';

  return `Watch ${url}. Alert me if:
(1) the page adds any mention of "apply", "applications open", or "now accepting",
(2) a deadline date changes or is added,
(3) eligibility requirements change, or
(4) the page goes down or redirects.
Also watch for: ${hint}.
Summarize only what changed, not the full page.${custom}`;
}

export async function createWebMonitor(_monitor: Omit<WebMonitor, 'id' | 'status'>): Promise<{ monitorId: string }> {
  throw new Error('Web monitoring is not yet available in this phase. The Firecrawl monitor API now runs server-side.');
}

export function summarizeChange(opportunityName: string, diff: string): string {
  const trimmed = diff.trim();
  if (!trimmed) return `Something changed on ${opportunityName}. Review the page for updates.`;
  return `Update on ${opportunityName}: ${trimmed.slice(0, 200)}${trimmed.length > 200 ? '…' : ''}`;
}

export { inferCategory, normalizeUrl };
export type { WebMonitor };
