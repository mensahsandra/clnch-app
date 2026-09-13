import { supabase } from './supabase';
import type { Opportunity, OpportunityCategory } from '../types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;

export interface ExtractionResult {
  title: string;
  organization: string;
  category: string;
  requirements: string[];
  deadline?: string;
  deadline_text?: string;
  location?: string;
  description: string;
  award_value?: string;
  eligibility_regions?: string[];
  application_url?: string;
  link: string;
  page_content?: string;
  source: string;
}

export interface ChatReply {
  reply: string;
  source: string;
}

export interface AssessmentResult {
  fit_rating: 'strong' | 'moderate' | 'weak';
  summary: string;
  matching_criteria: string[];
  missing_criteria: string[];
  recommendations: string[];
}

export interface AssessmentResponse {
  assessment: AssessmentResult;
  source: string;
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }
  return headers;
}

export async function extractOpportunity(
  url: string,
  contextHints?: { description?: string; categoryHints?: string[] }
): Promise<ExtractionResult> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${SUPABASE_URL}/functions/v1/extract`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ url, contextHints }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || `Extraction failed (${response.status})`);
  }

  return response.json();
}

export async function chatWithAssistant(
  message: string,
  opportunity: {
    title?: string;
    org?: string;
    category?: string;
    deadline?: string;
    requirements?: string[];
    description?: string;
    location?: string;
    link?: string;
  },
  conversationHistory?: { role: 'user' | 'assistant'; content: string }[],
  pageContent?: string
): Promise<ChatReply> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${SUPABASE_URL}/functions/v1/chat`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ message, opportunity, conversationHistory, pageContent }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || `Chat failed (${response.status})`);
  }

  return response.json();
}

export async function assessFit(opportunity: {
  title?: string;
  org?: string;
  category?: string;
  deadline?: string;
  requirements?: string[];
  description?: string;
  location?: string;
  link?: string;
}): Promise<AssessmentResponse> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${SUPABASE_URL}/functions/v1/assess`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ opportunity }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || `Assessment failed (${response.status})`);
  }

  return response.json();
}

export function normalizeCategory(raw: string): OpportunityCategory {
  const lower = raw.toLowerCase();
  if (lower.includes('fellow')) return 'fellowship';
  if (lower.includes('grant')) return 'grant';
  if (lower.includes('accel') || lower.includes('incubat')) return 'accelerator';
  if (lower.includes('conference') || lower.includes('summit') || lower.includes('event')) return 'conference';
  if (lower.includes('intern')) return 'internship';
  if (lower.includes('job') || lower.includes('engineer') || lower.includes('career')) return 'job';
  return 'fellowship';
}

export function extractionToOpportunity(extraction: ExtractionResult): Partial<Opportunity> {
  const days = extraction.deadline
    ? Math.max(0, Math.ceil((new Date(extraction.deadline).getTime() - Date.now()) / 86400000))
    : 30;

  return {
    title: extraction.title,
    org: extraction.organization,
    category: normalizeCategory(extraction.category),
    requirements: extraction.requirements,
    deadline: extraction.deadline,
    location: extraction.location,
    description: extraction.description,
    link: extraction.link,
    status: 'saved',
    urgency: days <= 7 ? 'High' : days <= 21 ? 'Medium' : 'Low',
    daysLeft: days,
  };
}
