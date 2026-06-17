import type { OpportunityCategory, ScrapeResult, WebMonitor } from '../types';

const API_BASE = 'https://api.firecrawl.dev/v2';

function getApiKey(): string {
  const key = import.meta.env.VITE_FIRECRAWL_API_KEY as string;
  if (!key) throw new Error('Firecrawl API key not configured. Set VITE_FIRECRAWL_API_KEY in .env');
  return key;
}

async function firecrawlFetch<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || data.message || `Firecrawl request failed (${response.status})`);
  }
  return data as T;
}

const OPPORTUNITY_SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string', description: 'Full title of the opportunity' },
    organization: { type: 'string', description: 'Name of the issuing organisation, company, or institution' },
    category: {
      type: 'string',
      enum: ['fellowship', 'grant', 'accelerator', 'job', 'conference', 'internship'],
      description: 'The type of opportunity — infer from content, not user input',
    },
    requirements: {
      type: 'array',
      items: { type: 'string' },
      description: 'List of eligibility requirements and application requirements',
    },
    deadline: {
      type: 'string',
      description: 'Exact application deadline date in YYYY-MM-DD format if found, else the closest date string mentioned',
    },
    deadline_text: {
      type: 'string',
      description: 'Raw deadline text as it appears on the page, e.g. "Rolling deadline", "Applications close 30 June 2026"',
    },
    location: { type: 'string', description: 'Physical location or "Remote" / "Global"' },
    description: { type: 'string', description: 'A concise 2-3 sentence summary of the opportunity' },
    award_value: { type: 'string', description: 'Funding amount, stipend, or benefit value if mentioned' },
    eligibility_regions: {
      type: 'array',
      items: { type: 'string' },
      description: 'Countries or regions eligible to apply',
    },
  },
  required: ['title', 'organization', 'category'],
};

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

export function extractUrlFromText(text: string): string | null {
  const match = text.match(/https?:\/\/[^\s<>"{}|\\^`[\]]+/i);
  if (match) return match[0].replace(/[.,;:!?)]+$/, '');
  if (/^[\w-]+\.(com|org|net|io|dev|co|edu|gov)(\/\S*)?$/i.test(text.trim())) {
    return normalizeUrl(text.trim());
  }
  return null;
}

export async function scrapeOpportunityUrl(
  url: string,
  context?: { description?: string; categoryHints?: string[]; screenshots?: File[] }
): Promise<ScrapeResult> {
  const normalized = normalizeUrl(url);

  // Build a context-aware extraction prompt
  const contextClues = [
    context?.description ? `User context: "${context.description}"` : '',
    context?.categoryHints?.length
      ? `User suggests it may be: ${context.categoryHints.join(', ')} — but infer from the page content first.`
      : '',
  ].filter(Boolean).join(' ');

  const extractionPrompt = [
    'Extract ALL opportunity details from this page with maximum accuracy.',
    'Prioritise finding: the exact application deadline date (look for "apply by", "deadline", "closes", "due date", "last date"), eligibility requirements, award/stipend value.',
    'For the deadline: extract the exact date in YYYY-MM-DD format AND preserve the raw text as deadline_text.',
    'For category: determine from the page content — do NOT rely solely on the URL.',
    'For requirements: list every eligibility criterion and application step you can find.',
    contextClues,
  ].filter(Boolean).join(' ');

  const data = await firecrawlFetch<{
    success?: boolean;
    data?: {
      markdown?: string;
      json?: Record<string, unknown>;
      metadata?: { title?: string; description?: string; ogSiteName?: string };
    };
  }>('/scrape', {
    url: normalized,
    onlyMainContent: true,
    formats: [
      'markdown',
      {
        type: 'json',
        prompt: extractionPrompt,
        schema: OPPORTUNITY_SCHEMA,
      },
    ],
  });

  const payload = data.data;
  const json = (payload?.json ?? {}) as Record<string, unknown>;
  const meta = payload?.metadata ?? {};
  const markdown = payload?.markdown ?? '';

  const title =
    (typeof json.title === 'string' && json.title) ||
    meta.title ||
    'Untitled Opportunity';

  const org =
    (typeof json.organization === 'string' && json.organization) ||
    meta.ogSiteName ||
    new URL(normalized).hostname.replace('www.', '');

  // Category: trust AI extraction; fall back to hint then inference
  const aiCategory = typeof json.category === 'string' ? json.category : '';
  const hintCategory = context?.categoryHints?.[0] ?? '';
  const category = (
    aiCategory ||
    hintCategory ||
    inferCategory(`${title} ${markdown.slice(0, 600)}`)
  ) as OpportunityCategory;

  const requirements = Array.isArray(json.requirements)
    ? (json.requirements as unknown[]).filter((r): r is string => typeof r === 'string')
    : markdown
        .split('\n')
        .filter((line) => /^[-*•]\s/.test(line.trim()))
        .map((line) => line.replace(/^[-*•]\s*/, '').trim())
        .slice(0, 8);

  // Deadline: prefer structured date, fall back to deadline_text, then search markdown
  let deadline: string | undefined;
  if (typeof json.deadline === 'string' && json.deadline.trim()) {
    deadline = json.deadline;
  } else if (typeof json.deadline_text === 'string' && json.deadline_text.trim()) {
    deadline = json.deadline_text;
  } else {
    // Last resort: scan markdown for date-like patterns
    const dateMatch = markdown.match(
      /(?:deadline|apply by|closes?|due date|last date)[^\n:]*[:]\s*([A-Za-z0-9 ,\-\/]+\d{4})/i
    );
    if (dateMatch) deadline = dateMatch[1].trim();
  }

  const description =
    (typeof json.description === 'string' && json.description) ||
    meta.description ||
    markdown.slice(0, 400);

  return {
    title,
    org,
    category,
    requirements,
    deadline,
    location: typeof json.location === 'string' ? json.location : undefined,
    description,
    link: normalized,
  };
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

export async function createWebMonitor(monitor: Omit<WebMonitor, 'id' | 'status'>): Promise<{ monitorId: string }> {
  const goal = buildMonitorGoal(monitor.url, monitor.goal, monitor.category);

  const data = await firecrawlFetch<{ id?: string; monitor?: { id?: string } }>('/monitor', {
    name: monitor.name,
    schedule: { text: monitor.schedule || 'every 6 hours', timezone: 'UTC' },
    targets: [
      {
        type: 'scrape',
        urls: [monitor.url],
        scrapeOptions: { formats: ['markdown'], maxAge: 0 },
      },
    ],
    goal,
    judgeEnabled: true,
    notification: monitor.email
      ? {
          email: {
            enabled: true,
            includeDiffs: false,
            recipients: [monitor.email],
          },
        }
      : undefined,
  });

  const monitorId = data.id || data.monitor?.id;
  if (!monitorId) throw new Error('Monitor created but no ID returned');
  return { monitorId };
}

export async function summarizeChange(opportunityName: string, diff: string): Promise<string> {
  const trimmed = diff.trim();
  if (!trimmed) return `Something changed on ${opportunityName}. Review the page for updates.`;
  return `Update on ${opportunityName}: ${trimmed.slice(0, 200)}${trimmed.length > 200 ? '…' : ''}`;
}

export { daysUntil, urgencyFromDays };
