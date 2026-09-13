import { supabase } from './supabase';
import type { OpportunityCategory, OpportunityStatus, UrgencyLevel, MonitorStatus } from '../types';

export interface Opportunity {
  id?: string;
  title?: string;
  link: string;
  organization: string;
  category: OpportunityCategory | string;
  requirements: string[];
  deadline?: string;
  status: OpportunityStatus | string;
  description?: string;
  location?: string;
  award_value?: string;
  eligibility_regions?: string[];
  application_url?: string;
  urgency?: UrgencyLevel;
  monitor_status?: MonitorStatus;
  monitor_goal?: string;
  monitor_id?: string;
  last_checked_at?: string;
  change_summary?: string;
  created_at?: string;
  updated_at?: string;
  user_id?: string;
}

export interface ExtractionResult {
  title: string;
  organization: string;
  category: string;
  requirements: string[];
  deadline?: string;
  deadline_text?: string;
  location?: string;
  description?: string;
  award_value?: string;
  eligibility_regions?: string[];
  application_url?: string;
  link: string;
  page_content?: string;
  source?: string;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const EXTRACT_URL = `${SUPABASE_URL}/functions/v1/extract`;

export async function processOpportunityUrl(url: string): Promise<ExtractionResult> {
  const response = await fetch(EXTRACT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ url }),
  });

  if (!response.ok) {
    throw new Error('Failed to extract opportunity data');
  }

  return response.json();
}

export async function createOpportunity(
  data: Omit<Opportunity, 'id' | 'created_at' | 'updated_at'>
): Promise<Opportunity> {
  const { data: result, error } = await supabase
    .from('opportunities')
    .insert({
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    throw new Error('Failed to create opportunity');
  }

  return result;
}

export async function getOpportunities(): Promise<Opportunity[]> {
  const { data, error } = await supabase
    .from('opportunities')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error('Failed to fetch opportunities');
  }

  return data || [];
}

export async function updateOpportunityStatus(
  id: string,
  status: Opportunity['status']
): Promise<Opportunity> {
  const { data, error } = await supabase
    .from('opportunities')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error('Failed to update opportunity');
  }

  return result;
}

export async function updateOpportunity(
  id: string,
  patch: Partial<Opportunity>
): Promise<Opportunity> {
  const { data, error } = await supabase
    .from('opportunities')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error('Failed to update opportunity');
  }

  return data;
}

export async function deleteOpportunity(id: string): Promise<void> {
  const { error } = await supabase
    .from('opportunities')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error('Failed to delete opportunity');
  }
}
